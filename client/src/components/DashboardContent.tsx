import {
  FileText,
  HardDrive,
  Server,
  Clock,
  Upload,
  ShieldCheck,
  FolderPlus,
  LayoutGrid,
  List,
  Copy,
  ExternalLink,
  Download,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Pin,
  Globe,
  Lock,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useRef } from "react";
import { useFiles, FileItem } from "@/hooks/useFiles";
import NewFolderDialog from "./NewFolderDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { checkAccess } from "@/lib/blockchain";
import { useWallet } from "@/context/WalletContext";

// Helper to generate a mock CID
const generateCID = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "Qm";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const infoCards = [
  { icon: Globe, title: "Decentralized", desc: "Files stored across IPFS nodes worldwide" },
  { icon: Lock, title: "Secure", desc: "End-to-end blockchain encryption" },
  { icon: Database, title: "Permanent", desc: "Immutable, tamper-proof storage" },
];

const DashboardContent = () => {
  const { walletAddress } = useWallet();
  const { files, addFile, togglePin, shareFile } = useFiles();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFolderClick = (id: string, name: string, type: string) => {
    if (type === "folder") {
      navigate('/my-files', { state: { initialFolder: { id, name } } });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${uploadedFiles.length} file(s)...`);
    
    try {
      for (const file of Array.from(uploadedFiles)) {
        await addFile(file);
      }
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`, { id: toastId });
    } catch (err) {
      toast.error("Failed to upload files", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const filteredFiles = useMemo(() => {
    const result = files.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return result.sort((a, b) => {
      if (a.status === "pinned" && b.status !== "pinned") return -1;
      if (a.status !== "pinned" && b.status === "pinned") return 1;
      return 0;
    });
  }, [files, searchQuery]);

  const handleTogglePin = (id: string) => {
    togglePin(id);
    const file = files.find(f => f.id === id);
    toast.success(file?.status === "pinned" ? "Unpinned from top" : "Pinned to top");
  };

  const handleShare = async (id: string, name: string) => {
    const targetWallet = window.prompt(`Share "${name}"\nEnter the recipient's wallet address:`);
    if (!targetWallet) return;
    try {
      await shareFile(id, targetWallet);
    } catch (err) {
      // handled in useFiles
    }
  };

  const handleCopyCID = (cid: string) => {
    if (cid === "N/A") return;
    navigator.clipboard.writeText(cid);
    toast.success("CID copied to clipboard");
  };

  const handleDownload = async (cid: string, name: string) => {
    if (cid === "N/A" || !cid) {
      toast.error("File is not uploaded to IPFS yet or is a folder.");
      return;
    }

    try {
      toast.info("Verifying access on blockchain...");
      if (walletAddress) {
        const hasAccess = await checkAccess(cid, walletAddress);
        if (!hasAccess) {
          toast.error("Access Denied: You do not have permission on the blockchain.");
          return;
        }
      }
    } catch (err: any) {
      toast.error("Failed to verify access: " + err.message);
      return;
    }

    // Using the backend route which redirects to the IPFS gateway
    window.open(`http://localhost:5001/api/files/download/${cid}`, "_blank");
  };

  const getFileIcon = (type: string) => {
    if (type === "folder") return <FolderPlus className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const totalFiles = files.length;
  const storageUsed = files.reduce((acc, file) => {
    const value = parseFloat(file.size);
    if (file.size.includes("GB")) return acc + value * 1024 * 1024 * 1024;
    if (file.size.includes("MB")) return acc + value * 1024 * 1024;
    if (file.size.includes("KB")) return acc + value * 1024;
    return acc + value;
  }, 0);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const dynamicStats = [
    { icon: FileText, label: "Total Files", value: totalFiles.toString(), sub: "In your IPFS vault" },
    { icon: HardDrive, label: "Storage Used", value: formatStorage(storageUsed), sub: "of 100 GB" },
    { icon: Server, label: "Active Nodes", value: "1,024", sub: "across network" },
    { icon: Clock, label: "Status", value: "Online", sub: "Ready for upload" },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <card.icon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Upload Files to IPFS</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Your files are encrypted and distributed across a decentralized network for maximum security and availability.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <Button 
              onClick={handleChooseFiles}
              disabled={isUploading}
              className="rounded-xl bg-primary hover:bg-green-600 text-primary-foreground gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
            <span className="text-xs text-muted-foreground">or drag & drop files here</span>
          </div>
        </div>
        <div className="hidden md:flex w-20 h-20 rounded-2xl bg-secondary items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-secondary-foreground" />
        </div>
      </div>

      {/* My Files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Files</h2>
            <p className="text-sm text-muted-foreground">Manage and access your decentralized files</p>
          </div>
          <div className="flex items-center gap-2">
            <NewFolderDialog 
              onAddFolder={addFile} 
              files={files} 
              variant="outline"
            />
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-secondary text-secondary-foreground" : "hover:bg-accent text-muted-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-secondary text-secondary-foreground" : "hover:bg-accent text-muted-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table / Grid */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[300px]">
          {filteredFiles.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-muted-foreground">No files found matching your search</p>
            </div>
          ) : viewMode === "list" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-4 w-10"><Checkbox /></th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">CID</th>
                <th className="p-4 font-medium">Size</th>
                <th className="p-4 font-medium">Uploaded</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, i) => (
                <tr
                  key={file._id || file.id || i}
                  onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${file.type === "folder" ? "cursor-pointer" : ""}`}
                >
                  <td className="p-4"><Checkbox /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span className="font-medium text-foreground">{file.name}</span>
                      {file.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <code className="text-xs">{file.cid.length > 20 ? `${file.cid.slice(0, 8)}...${file.cid.slice(-4)}` : file.cid}</code>
                      <button 
                        onClick={() => handleCopyCID(file.cid)}
                        className="hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                      <button className="hover:text-foreground"><ExternalLink className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{file.size}</td>
                  <td className="p-4 text-muted-foreground">{file.uploadedAt}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleTogglePin(file.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium ${file.status === 'pinned' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <Pin className={`w-3.5 h-3.5 ${file.status === 'pinned' ? 'fill-primary' : ''}`} />
                      {file.status === 'pinned' ? 'Pinned' : 'Pin'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleDownload(file.cid, file.name)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare((file._id || file.id) as string, file.name);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredFiles.map((file, i) => (
                <div 
                  key={file._id || file.id || i}
                  onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                  className={`bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all group ${file.type === "folder" ? "cursor-pointer" : ""}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {getFileIcon(file.type)}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm truncate mb-0.5">{file.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-4">{file.size} · {file.uploadedAt}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <button 
                      onClick={() => handleTogglePin(file.id)}
                      className={`p-1 rounded-md transition-colors ${file.status === 'pinned' ? 'text-primary bg-primary/5 shadow-inner' : 'text-muted-foreground hover:bg-accent'}`}>
                      <Pin className={`w-3.5 h-3.5 ${file.status === 'pinned' ? 'fill-primary' : ''}`} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDownload(file.cid, file.name)}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare((file._id || file.id) as string, file.name);
                        }}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {infoCards.map((card) => (
          <div
            key={card.title}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <card.icon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{card.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default DashboardContent;
