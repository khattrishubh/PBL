import {
  FileText,
  FileSpreadsheet,
  FileType,
  Folder,
  Star,
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
  Clock,
  Zap,
  Smartphone,
  MousePointer2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useFiles } from "@/hooks/useFiles";
import { toast } from "sonner";
import { checkAccess } from "@/lib/blockchain";
import { useWallet } from "@/context/WalletContext";


const infoCards = [
  {
    icon: Zap,
    title: "Quick Access",
    desc: "Pinned files stay at the top for instant access",
  },
  {
    icon: Smartphone,
    title: "Always Available",
    desc: "Access pinned files across all your devices",
  },
  {
    icon: MousePointer2,
    title: "Full Control",
    desc: "Pin and unpin files anytime you need",
  },
];

function FileIcon({ type }: { type: string }) {
  if (type === "Folder") return <Folder className="w-4 h-4 text-amber-500" />;
  if (type === "PDF") return <FileType className="w-4 h-4 text-red-500" />;
  if (type === "XLS") return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  if (type === "DOC") return <FileText className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    PDF: "bg-red-50 text-red-600 border-red-100",
    DOC: "bg-blue-50 text-blue-600 border-blue-100",
    XLS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    TXT: "bg-gray-50 text-gray-600 border-gray-100",
    Folder: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <Badge variant="outline" className={`font-medium ${styles[type] || ""}`}>
      {type}
    </Badge>
  );
}

const PinnedFilesContent = () => {
  const { walletAddress } = useWallet();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const { files, isLoading, togglePin } = useFiles(null, true);

  const filtered = useMemo(() => {
    return (files ?? [])
      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const handleUnpin = async (id: string) => {
    await togglePin(id);
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

    // Use the backend redirect
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

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header / Feature Card */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-32 top-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-1">
            <Zap className="w-3 h-3" />
            Quick Access
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Your Pinned Files
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Files you've pinned for quick and easy access. Keep your most important documents right where you need them.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <Star className="w-10 h-10 text-primary fill-primary/20" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter + Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pinned files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border text-sm"
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

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-10 gap-2 border-border text-foreground hover:bg-accent">
            <ChevronDown className="w-4 h-4" />
            Sort by: Newest
          </Button>
          <div className="flex border border-border rounded-xl overflow-hidden bg-card">
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

      {/* Pinned Files Table/Grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-white/50">
          <h3 className="font-semibold text-foreground">Pinned Files</h3>
          <p className="text-xs text-muted-foreground">Quick access to your important files</p>
        </div>

        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                  <th className="p-4 w-10"><Checkbox /></th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">CID</th>
                  <th className="p-4 font-medium">Size</th>
                  <th className="p-4 font-medium">Pinned On</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <tr
                    key={file._id || file.id}
                    className="border-b border-border last:border-0 hover:bg-green-50/50 transition-colors duration-200 group"
                  >
                    <td className="p-4"><Checkbox /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileIcon type={file.type} />
                        <span className="font-medium text-foreground">{file.name}</span>
                        {file.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        <Star className="w-3 h-3 text-primary fill-primary" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground group">
                        <code className="text-xs">{file.cid}</code>
                        <button className="hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{file.size}</td>
                    <td className="p-4 text-muted-foreground font-medium">{file.uploadedAt || "N/A"}</td>
                    <td className="p-4">
                      <TypeBadge type={file.type} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleUnpin((file._id || file.id) as string)}
                          className="p-2 rounded-xl hover:bg-secondary text-primary hover:text-primary-foreground transition-colors"
                          title="Unpin"
                        >
                          <Star className="w-4 h-4 fill-primary" />
                        </button>
                        <button 
                          onClick={() => handleDownload(file.cid, file.name)}
                          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((file) => (
              <div
                key={file._id || file.id}
                className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all duration-200 hover:bg-green-50/30 group relative"
              >
                <div className="absolute top-3 right-3">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <FileIcon type={file.type} />
                </div>
                <p className="font-semibold text-foreground text-sm truncate mb-0.5">{file.name}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-muted-foreground">{file.size}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground">{file.uploadedAt || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between mt-4 overflow-hidden">
                  <TypeBadge type={file.type} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleUnpin((file._id || file.id) as string)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-primary transition-colors"
                      title="Unpin"
                    >
                      <Star className="w-3.5 h-3.5 fill-primary" />
                    </button>
                    <button 
                      onClick={() => handleDownload(file.cid, file.name)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-base">No pinned files yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Pin important files to access them quickly from your dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {infoCards.map((card) => (
          <div
            key={card.title}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <card.icon className="w-5 h-5 text-primary" />
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

export default PinnedFilesContent;
