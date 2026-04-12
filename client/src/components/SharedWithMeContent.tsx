import {
  FileText,
  FileSpreadsheet,
  FileType,
  Folder,
  ShieldCheck,
  Search,
  List,
  LayoutGrid,
  Eye,
  Download,
  MoreHorizontal,
  X,
  Shield,
  CheckCircle2,
  Database,
  Lock,
  ChevronDown,
  Share2,
  Copy,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/context/WalletContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { checkAccess } from "@/lib/blockchain";

const infoCards = [
  {
    icon: Shield,
    title: "Secure Access",
    desc: "You can only access files you have permission for",
  },
  {
    icon: Database,
    title: "Blockchain Verified",
    desc: "All shared files are tamper-proof on the blockchain",
  },
  {
    icon: Lock,
    title: "Permission Controlled",
    desc: "Access levels are set by file owners at all times",
  },
];

const avatarColors = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function FileIcon({ type }: { type: string }) {
  if (type === "folder")
    return <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />;
  if (type === "pdf")
    return <FileType className="w-4 h-4 text-red-500" />;
  if (type === "xlsx" || type === "xls")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  if (type === "pptx" || type === "doc")
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (type === "image")
    return <FileType className="w-4 h-4 text-purple-500" />;
  if (type === "zip")
    return <FileText className="w-4 h-4 text-orange-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

const SharedWithMeContent = () => {
  const { walletAddress } = useWallet();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterPermission, setFilterPermission] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation State
  const [folderStack, setFolderStack] = useState<{ id: string, name: string }[]>([]);
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;

  useEffect(() => {
    const fetchSharedFiles = async () => {
      if (!walletAddress) return;
      try {
        setIsLoading(true);
        const data = await apiFetch<any[]>(`/files/shared?wallet=${walletAddress}`);
        setSharedFiles(data);
      } catch (err) {
        console.error("Failed to fetch shared files:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedFiles();
  }, [walletAddress]);

  const filtered = useMemo(() => {
    // 1. Determine which ones to show structurally
    const structuralFiltered = (sharedFiles ?? []).filter((f) => {
      if (currentFolderId === null) {
        // We are at root: Show items that either have no parentId, 
        // OR their parentId is not present in our sharedFiles globally.
        const parentIsInList = sharedFiles.some(parent => parent._id === f.parentId || parent.id === f.parentId);
        return !parentIsInList || f.parentId === null;
      } else {
        // We are nested: Show items explicitly containing this parentId
        return f.parentId === currentFolderId;
      }
    });

    // 2. Filter visually by search term and permission
    return structuralFiltered.filter((f) => {
      const matchesSearch = f.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const permission = f.permission || "View";
      const matchesFilter =
        filterPermission === "All" || permission === filterPermission;
      return matchesSearch && matchesFilter;
    });
  }, [sharedFiles, searchQuery, filterPermission, currentFolderId]);

  const handleDownload = async (cid: string, name: string) => {
    if (cid === "N/A" || !cid) {
      toast.error("This file is not yet available on the blockchain");
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

    window.open(`http://localhost:5001/api/files/download/${cid}`, "_blank");
    toast.success(`Starting download for ${name}`);
  };

  const handleFolderClick = (id: string, name: string, type: string) => {
    if (type === "folder") {
      setFolderStack([...folderStack, { id, name }]);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header / Feature Card */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute right-32 top-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 pointer-events-none" />

        <div className="space-y-4 relative z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold tracking-wide mb-1">
            <ShieldCheck className="w-3 h-3" />
            Encrypted &amp; Permission Controlled
          </div>
          
          {/* Breadcrumb Navigation */}
          <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2 overflow-hidden">
            <button onClick={() => setFolderStack([])} className="hover:text-primary transition-colors shrink-0">Shared Files</button>
            
            {folderStack.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground/30 font-light shrink-0">/</span>
                {idx === folderStack.length - 1 ? (
                  <span className="text-primary truncate">{item.name}</span>
                ) : (
                  <button 
                    onClick={() => setFolderStack(folderStack.slice(0, idx + 1))}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            ))}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed truncate">
            {folderStack.length > 0
              ? `Viewing shared contents of "${folderStack[folderStack.length - 1].name}".`
              : "Securely access files shared by others on the blockchain. All access is permission-gated and tamper-proof."
            }
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Illustration cluster */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <Share2 className="w-10 h-10 text-secondary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter + Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shared files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-56 rounded-xl bg-muted/50 border-border text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterPermission}
              onChange={(e) => setFilterPermission(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl border border-border bg-card text-sm text-foreground appearance-none cursor-pointer hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="All">All</option>
              <option value="View">View Only</option>
              <option value="Edit">Editable</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* View Toggle */}
          <div className="flex border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Shared Files Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Shared with Me
          </h2>
          <p className="text-sm text-muted-foreground">
            Files and folders shared by others with you
          </p>
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Share2 className="w-10 h-10 text-secondary-foreground" />
                </div>
                <p className="font-semibold text-foreground text-base">
                  No files shared with you yet
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Files shared by others will appear here once they grant you
                  access.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="p-4 w-10">
                      <Checkbox />
                    </th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Shared By</th>
                    <th className="p-4 font-medium">CID</th>
                    <th className="p-4 font-medium">Size</th>
                    <th className="p-4 font-medium">Shared On</th>
                    <th className="p-4 font-medium">Permissions</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((file, idx) => (
                    <tr
                      key={file._id || file.id}
                      onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                      className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors duration-200 group ${file.type === "folder" ? "cursor-pointer" : ""}`}
                    >
                      <td className="p-4">
                        <Checkbox />
                      </td>

                      {/* Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileIcon type={file.type} />
                          <span className="font-medium text-foreground">
                            {file.name}
                          </span>
                          {file.type === "folder" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
                              Folder
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Shared By */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                              avatarColors[idx % avatarColors.length]
                            }`}
                          >
                            {file.initials || (file.sharedBy ? file.sharedBy.substring(0, 2).toUpperCase() : "??")}
                          </div>
                          <div>
                            <p className="text-foreground font-medium leading-tight">
                              {file.sharedBy || "Unknown User"}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-0.5">
                              {file.owner ? `${file.owner.substring(0, 6)}...${file.owner.substring(38)}` : "0x0...0"}
                              <CheckCircle2 className="w-3 h-3 text-primary ml-0.5" />
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CID */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <code className="text-xs">{file.cid}</code>
                          <button className="hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="p-4 text-muted-foreground">{file.size}</td>

                      {/* Shared On */}
                      <td className="p-4 text-muted-foreground">
                        {file.uploadedAt || "N/A"}
                      </td>

                      {/* Permission */}
                      <td className="p-4">
                        {file.permission === "View" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                            <Eye className="w-3 h-3" />
                            View
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                            <FileText className="w-3 h-3" />
                            Edit
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.cid, file.name);
                            }}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === "grid" && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Share2 className="w-10 h-10 text-secondary-foreground" />
                </div>
                <p className="font-semibold text-foreground text-base">
                  No files shared with you yet
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Files shared by others will appear here once they grant you
                  access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((file, idx) => (
                  <div
                    key={file._id || file.id}
                    onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                    className={`bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all duration-200 hover:bg-accent/30 group ${file.type === "folder" ? "cursor-pointer" : ""}`}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                      <FileIcon type={file.type} />
                    </div>

                    {/* Name */}
                    <p className="font-semibold text-foreground text-sm truncate mb-0.5">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {file.size} · {file.uploadedAt || "N/A"}
                    </p>

                    {/* Shared by */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                          avatarColors[idx % avatarColors.length]
                        }`}
                      >
                        {file.initials || (file.sharedBy ? file.sharedBy.substring(0, 2).toUpperCase() : "??")}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {file.owner ? `${file.owner.substring(0, 6)}...${file.owner.substring(38)}` : "0x0...0"}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {file.permission === "View" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          <Eye className="w-3 h-3" />
                          View
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <FileText className="w-3 h-3" />
                          Edit
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file.cid, file.name);
                          }}
                          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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

export default SharedWithMeContent;
