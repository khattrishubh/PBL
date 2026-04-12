import { useState, useEffect, useCallback } from "react";
import { apiFetch, logActivity } from "@/lib/api";
import { toast } from "sonner";
import { useWallet } from "@/context/WalletContext";
import { getProvider, getBlockDriveContract } from "@/lib/blockchain";

export interface FileItem {
  _id?: string;
  id?: string; // Support for both legacy and new IDs
  name: string;
  type: "pdf" | "doc" | "xls" | "txt" | "folder" | "image" | "zip";
  cid: string;
  size: string;
  uploadedAt: string;
  status: "pinned" | "normal";
  isPinned: boolean;
  owner: string;
  verified?: boolean;
  parentId?: string | null;
}

export const useFiles = (parentId: string | null = null, pinned: boolean | null = null) => {
  const { walletAddress } = useWallet();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (!walletAddress) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const pinnedParam = pinned !== null ? `&pinned=${pinned}` : "";
      const parentParam = pinned ? "" : `&parentId=${parentId || "null"}`;
      console.log(`[useFiles] 📡 Fetching files (Parent: ${parentId || "Root"}, Pinned: ${pinned})`);
      
      const data = await apiFetch<FileItem[]>(`/files?owner=${walletAddress}${parentParam}${pinnedParam}`) ?? [];
      setFiles(data);
    } catch (err) {
      console.error("[useFiles] ❌ Failed to fetch files", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, parentId, pinned]);

  useEffect(() => {
    fetchFiles();
    
    // Listen for global refresh signal
    window.addEventListener("refresh-live-data", fetchFiles);
    return () => window.removeEventListener("refresh-live-data", fetchFiles);
  }, [fetchFiles]);

  const addFile = useCallback(async (fileOrData: Partial<FileItem> | File) => {
    if (!walletAddress) {
      toast.error("Connect wallet to upload files");
      return;
    }

    try {
      let newFile: FileItem;
      let requestOptions: RequestInit;

      if (fileOrData instanceof File) {
        // Prepare FormData for actual file upload
        const formData = new FormData();
        formData.append("file", fileOrData);
        formData.append("owner", walletAddress);
        if (parentId) formData.append("parentId", parentId);
        
        requestOptions = {
          method: "POST",
          body: formData,
        };
      } else {
        // Prepare JSON for metadata creation (like folders)
        const payload = {
          ...fileOrData,
          owner: walletAddress,
          uploadedAt: fileOrData.uploadedAt || new Date().toISOString(),
          status: fileOrData.status || "normal",
          isPinned: fileOrData.isPinned || false,
          parentId: fileOrData.parentId || parentId || null,
        };

        requestOptions = {
          method: "POST",
          body: JSON.stringify(payload),
        };
      }

      newFile = await apiFetch<FileItem>("/files", requestOptions);

      // Optimistic update
      setFiles((prev) => [newFile, ...prev]);
      
      // Trigger global refresh for Activity and Notifications
      window.dispatchEvent(new Event("refresh-live-data"));

      if (fileOrData instanceof File && newFile.type !== "folder" && newFile.cid && newFile.cid !== "N/A") {
        try {
          const provider = await getProvider();
          const contract = await getBlockDriveContract(provider);
          toast.info("Registering file ownership on blockchain...");
          const tx = await contract.registerFile(newFile.cid);
          await tx.wait();
          toast.success("File ownership verified on blockchain!");
        } catch (err: any) {
          console.error("Blockchain registration failed", err);
          toast.error("File uploaded but blockchain registration failed: " + err.message);
        }
      }

      return newFile;
    } catch (err) {
      console.error("[useFiles] ❌ Failed to add file", err);
      throw err;
    }
  }, [walletAddress, parentId]);

  const deleteFile = useCallback(async (id: string) => {
    try {
      await apiFetch(`/files/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => (f._id || f.id) !== id));
      
      // Trigger global refresh
      window.dispatchEvent(new Event("refresh-live-data"));
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  }, []);

  const togglePin = useCallback(async (id: string) => {
    try {
      const updatedFile = await apiFetch<FileItem>(`/files/${id}/pin`, {
        method: "PATCH"
      });

      setFiles((prev) =>
        prev.map((f) => ((f._id || f.id) === id ? updatedFile : f))
      );

      // Trigger global refresh for synchronization across components
      window.dispatchEvent(new Event("refresh-live-data"));
      
      toast.success(updatedFile.isPinned ? "File pinned" : "File unpinned");
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  }, []);

  const shareFile = useCallback(async (id: string, targetWallet: string) => {
    if (!walletAddress) {
      toast.error("Connect wallet to share files");
      return;
    }
    try {
      const file = files.find(f => (f._id || f.id) === id);
      if(!file || !file.cid || file.cid === "N/A") throw new Error("File not found or missing CID for blockchain sharing");

      const provider = await getProvider();
      const contract = await getBlockDriveContract(provider);
      toast.info("Updating permissions on blockchain...");
      const tx = await contract.shareFile(file.cid, targetWallet);
      await tx.wait();

      await apiFetch(`/files/${id}/share`, {
        method: "PATCH",
        body: JSON.stringify({ targetWallet, ownerWallet: walletAddress }),
      });
      toast.success("File shared successfully");
    } catch (err: any) {
      console.error("Failed to share file", err);
      toast.error(err.message || "Failed to share file");
      throw err;
    }
  }, [walletAddress, files]);

  return {
    files,
    isLoading,
    addFile,
    deleteFile,
    togglePin,
    shareFile,
    refreshFiles: fetchFiles,
  };
};
