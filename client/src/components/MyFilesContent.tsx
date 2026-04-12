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
  Upload,
  FolderPlus,
  Pin,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useFiles, FileItem } from "@/hooks/useFiles";
import NewFolderDialog from "./NewFolderDialog";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { checkAccess } from "@/lib/blockchain";

// --- Helpers ---
// Removed mock CID generator; real CID is obtained from IPFS after upload

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "folder": return <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />;
    case "pdf": return <FileType className="w-4 h-4 text-red-500" />;
    case "xls": return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    case "doc": return <FileText className="w-4 h-4 text-blue-500" />;
    case "image": return <FileType className="w-4 h-4 text-purple-500" />;
    case "zip": return <FileText className="w-4 h-4 text-orange-500" />;
    default: return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

const MyFilesContent = () => {
  const location = useLocation();
  const [folderStack, setFolderStack] = useState<{ id: string, name: string }[]>(
    location.state?.initialFolder ? [location.state.initialFolder] : []
  );
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;
  const { files, addFile, deleteFile, togglePin, shareFile, isLoading } = useFiles(currentFolderId);
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Filtered Data ---
  const filteredFiles = useMemo(() => {
    const result = files.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort pinned to top
    return result.sort((a, b) => {
      if (a.status === "pinned" && b.status !== "pinned") return -1;
      if (a.status !== "pinned" && b.status === "pinned") return 1;
      return 0;
    });
  }, [files, searchQuery]);

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${uploadedFiles.length} file(s)...`);
    
    try {
      for (const file of Array.from(uploadedFiles)) {
        await addFile(file); // Passing the pure file instance to `useFiles.ts`
      }
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`, { id: toastId });
    } catch (err) {
      toast.error("Failed to upload files", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFolderClick = (id: string, name: string, type: string) => {
    if (type === "folder") {
      setFolderStack([...folderStack, { id, name }]);
    }
  };


  const handleTogglePin = (id: string) => {
    togglePin(id);
  };

  const handleCopyCID = (cid: string) => {
    if (cid === "N/A") return;
    navigator.clipboard.writeText(cid);
    toast.success("CID copied to clipboard");
  };

  const handleDownload = async (cid: string, name: string) => {
    if (!cid || cid === "N/A") {
      toast.error("File download unavailable (no CID)");
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
    
    // Use the backend redirect or direct gateway if possible
    // Setting name via <a> 'download' attribute only works for same-origin
    // Since IPFS gateways are cross-origin, it usually opens in a new tab
    const url = `http://localhost:5001/api/files/download/${cid}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Starting download for ${name}`);
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

  const handleDelete = (id: string) => {
    deleteFile(id);
    toast.error("File removed from storage");
  };

  const shortenCID = (cid: string) => {
    if (cid === "N/A" || cid.length < 10) return cid;
    return `${cid.substring(0, 6)}...${cid.substring(cid.length - 4)}`;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
      {/* Header / Upload Hero */}
      <div className="bg-secondary/40 border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Decentralized Storage
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2 overflow-hidden">
            <button onClick={() => setFolderStack([])} className="hover:text-primary transition-colors shrink-0">My Files</button>
            
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
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed truncate">
            {folderStack.length > 0
              ? `Viewing contents of "${folderStack[folderStack.length - 1].name}". Files are encrypted and decentralized.`
              : "Your files are encrypted and distributed across a decentralized network using IPFS. Security guaranteed by blockchain technology."
            }
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-2xl h-12 px-6 bg-primary hover:bg-green-600 text-primary-foreground gap-2 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
            <span className="text-xs text-muted-foreground font-medium">or drag & drop files here</span>
          </div>
        </div>
        
        <div className="hidden lg:flex w-32 h-32 rounded-[2.5rem] bg-card border border-border shadow-xl items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Database className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-card border-border shadow-sm focus:ring-primary/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

            <NewFolderDialog 
              onAddFolder={addFile} 
              files={files} 
              variant="outline"
              parentId={currentFolderId}
            />

            {currentFolderId && (
              <Button 
                variant="ghost" 
                onClick={() => setFolderStack(folderStack.slice(0, -1))}
                className="rounded-xl h-11 px-4 text-muted-foreground hover:bg-muted"
              >
                Back
              </Button>
            )}
        </div>

        <div className="flex items-center gap-2 bg-card p-1 border border-border rounded-2xl shadow-sm self-end lg:self-auto">
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {filteredFiles.length === 0 ? (
          <div className="bg-card/40 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2rem] bg-secondary flex items-center justify-center mb-6 shadow-inner">
              <FileText className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No files uploaded yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Your IPFS vault is empty. Upload your first document or create a folder to get started.
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 rounded-2xl bg-primary hover:bg-green-600 text-primary-foreground gap-2 font-bold px-8 h-12"
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </Button>
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-black/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="p-5 w-12 font-medium">#</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Name</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">CID</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Size</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">At</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Status</th>
                    <th className="p-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredFiles.map((file, idx) => (
                    <tr 
                      key={file._id || file.id} 
                      className={`group hover:bg-primary/[0.02] transition-colors ${file.type === "folder" ? "cursor-pointer" : ""}`}
                      onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                    >
                      <td className="p-5 text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                            {getFileIcon(file.type)}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground">{file.name}</p>
                            {file.verified && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 group/cid">
                          <code className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">
                            {shortenCID(file.cid)}
                          </code>
                          <button 
                            onClick={() => handleCopyCID(file.cid)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-all opacity-0 group-hover/cid:opacity-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-5 text-muted-foreground font-medium">{file.size}</td>
                      <td className="p-5 text-muted-foreground font-medium">{file.uploadedAt}</td>
                      <td className="p-5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin((file._id || file.id) as string);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            file.isPinned 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "bg-muted/40 text-muted-foreground border border-transparent hover:border-border"
                          }`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${file.isPinned ? "fill-primary" : ""}`} />
                          {file.isPinned ? "Pinned" : "Pin"}
                        </button>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleDownload(file.cid, file.name)}
                            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-90"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare((file._id || file.id) as string, file.name);
                            }}
                            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-90"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(file.id)}
                            className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {filteredFiles.map((file) => (
              <div 
                key={file._id || file.id}
                onClick={() => handleFolderClick((file._id || file.id) as string, file.name, file.type)}
                className={`bg-card/60 backdrop-blur-sm border border-border rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden ${file.type === "folder" ? "cursor-pointer" : ""}`}
              >
                {file.isPinned && (
                  <div className="absolute right-4 top-4">
                    <Pin className="w-3.5 h-3.5 text-primary fill-primary" />
                  </div>
                )}
                
                <div className={`w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                  {getFileIcon(file.type)}
                </div>

                <div className="space-y-1 mb-6">
                  <h4 className="font-bold text-foreground truncate">{file.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{file.type}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[10px] font-bold text-muted-foreground">{file.size}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <code className="text-[10px] text-muted-foreground">{shortenCID(file.cid)}</code>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.cid, file.name);
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare((file._id || file.id) as string, file.name);
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin((file._id || file.id) as string);
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-all"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics / Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
        {[
          { icon: Database, color: "text-blue-500", bg: "bg-blue-50/50", title: "Global Persistence", desc: "Files remain available even if nodes go offline" },
          { icon: Lock, color: "text-emerald-500", bg: "bg-emerald-50/50", title: "End-to-End Encryption", desc: "Only your wallet has the keys to decrypt files" },
          { icon: Globe, color: "text-purple-500", bg: "bg-purple-50/50", title: "Fast Propagation", desc: "Files replicate across nodes for low-latency access" },
        ].map((card, i) => (
          <div key={i} className="flex gap-4 p-6 rounded-[1.5rem] bg-card border border-border/60 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default MyFilesContent;
