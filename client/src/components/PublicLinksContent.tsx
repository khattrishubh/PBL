import {
  Link,
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
  Clock,
  Zap,
  ExternalLink,
  Trash2,
  Check,
  Calendar,
  Activity,
  UserCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useCallback, useMemo } from "react";
import { apiFetch, logActivity } from "@/lib/api";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/context/WalletContext";
import { toast } from "sonner";

// Mock data removed in favor of backend fetching

const infoCards = [
  {
    icon: ShieldCheck,
    title: "Secure Sharing",
    desc: "Links are protected and can be revoked at any time",
  },
  {
    icon: Activity,
    title: "Access Tracking",
    desc: "Monitor how many times your files are accessed",
  },
  {
    icon: Calendar,
    title: "Expiry Control",
    desc: "Set expiration dates for better security control",
  },
];

function FileIcon({ type }: { type: string }) {
  if (type === "folder")
    return <Folder className="w-4 h-4 text-amber-500" />;
  if (type === "pdf")
    return <FileType className="w-4 h-4 text-red-500" />;
  if (type === "xls")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  if (type === "doc")
    return <FileText className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

const PublicLinksContent = () => {
  const { walletAddress } = useWallet();
  const { files } = useFiles();
  const [links, setLinks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedFileId, setSelectedFileId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("View Only");
  const [selectedExpiry, setSelectedExpiry] = useState("7d");

  const fetchLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<any[]>("/links");
      setLinks(data);
    } catch (err) {
      console.error("Failed to fetch links", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleGenerateLink = async () => {
    if (!selectedFileId) {
      toast.error("Please select a file first");
      return;
    }

    const file = files.find(f => (f._id || f.id) === selectedFileId);
    if (!file) return;

    setIsGenerating(true);
    try {
      const randomId = Math.random().toString(36).substring(7);
      const newUrl = `blockdrive.io/file/${randomId}`;
      
      const newLink = await apiFetch<any>("/links", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          cid: file.cid,
          link: newUrl,
          permission: selectedPermission,
          owner: walletAddress || "0x7F3a...c4D2",
          expiry: selectedExpiry === "none" ? null : new Date(Date.now() + (selectedExpiry === "24h" ? 86400000 : 604800000))
        })
      });

      setLinks(prev => [newLink, ...prev]);
      setGeneratedLink(newUrl);
      
      await logActivity({
        actionType: "link",
        actionLabel: "Public link created",
        file: file.name,
        user: "You",
        status: "Success"
      });

      toast.success("Public link generated!");
    } catch (err) {
      console.error("Failed to generate link", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteLink = async (id: string, fileName: string) => {
    try {
      await apiFetch(`/links/${id}`, { method: "DELETE" });
      setLinks(prev => prev.filter(l => l._id !== id));
      
      await logActivity({
        actionType: "revoke",
        actionLabel: "Link revoked",
        file: fileName,
        user: "You",
        status: "Revoked"
      });

      toast.success("Link revoked successfully");
    } catch (err) {
      console.error("Failed to delete link", err);
    }
  };

  const filtered = useMemo(() => 
    links.filter((l) =>
      l.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [links, searchQuery]);

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header / Feature Card */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-32 top-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-1">
            <Lock className="w-3 h-3" />
            Secure Sharing
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Public File Links
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Share your files securely using public access links. All links are encrypted and can be set to expire automatically.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <Link className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Generate Link Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Generate Public Link</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Select File</label>
            <Select value={selectedFileId} onValueChange={setSelectedFileId}>
              <SelectTrigger className="rounded-xl border-border h-11 bg-muted/20">
                <SelectValue placeholder="Select a file..." />
              </SelectTrigger>
              <SelectContent>
                {files.map(f => (
                  <SelectItem key={f._id || f.id} value={(f._id || f.id)!}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Permission</label>
            <Select value={selectedPermission} onValueChange={setSelectedPermission}>
              <SelectTrigger className="rounded-xl border-border h-11 bg-muted/20">
                <SelectValue placeholder="Permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="View Only">View Only</SelectItem>
                <SelectItem value="Download">Download Allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Expiry</label>
            <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
              <SelectTrigger className="rounded-xl border-border h-11 bg-muted/20">
                <SelectValue placeholder="Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="none">No Expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full sm:w-auto">
            {generatedLink ? (
              <div className="relative">
                <Input
                  value={generatedLink}
                  readOnly
                  className="rounded-xl border-primary/30 h-11 bg-primary/5 pr-20 text-sm font-medium"
                />
                <Button
                  onClick={() => handleCopy(generatedLink)}
                  className="absolute right-1 top-1 h-9 px-3 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 transition-all"
                >
                  {copiedLink === generatedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink === generatedLink ? "Copied" : "Copy"}
                </Button>
              </div>
            ) : (
              <div className="h-11 bg-muted/20 rounded-xl border border-border/50 border-dashed flex items-center px-4 text-muted-foreground text-xs italic">
                Link will appear here after generation
              </div>
            )}
          </div>
          <Button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 min-w-[160px] shadow-sm shadow-primary/20 transition-all font-semibold"
          >
            {isGenerating ? "Generating..." : "Generate Link"}
          </Button>
        </div>
      </div>

      {/* Public Links Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Your Public Links</h3>
            <p className="text-xs text-muted-foreground">Manage and track your shared file links</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted/30 border-border text-sm"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 rounded-xl h-10 bg-muted/30 border-border text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Link className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-base">No public links yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Create a link to share your files securely with anyone.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-muted/10">
                  <th className="p-4 w-10"><Checkbox /></th>
                  <th className="p-4 font-medium">File Name</th>
                  <th className="p-4 font-medium">Link</th>
                  <th className="p-4 font-medium">Permissions</th>
                  <th className="p-4 font-medium">Expiry</th>
                  <th className="p-4 font-medium">Access Count</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((link) => (
                  <tr
                    key={link._id}
                    className="border-b border-border last:border-0 hover:bg-green-50/30 transition-colors group"
                  >
                    <td className="p-4"><Checkbox /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileIcon type={link.fileName.split(".").pop() || "doc"} />
                        <span className="font-medium text-foreground">{link.fileName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-muted-foreground truncate max-w-[150px]">{link.link}</code>
                        <button
                          onClick={() => handleCopy(link.link)}
                          className="p-1 hover:text-primary transition-colors text-muted-foreground"
                        >
                          {copiedLink === link.link ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      {link.permission === "View" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          View Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Download
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] ${link.expiry && new Date(link.expiry) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                        {link.expiry ? new Date(link.expiry).toLocaleDateString() : "No expiry"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-foreground">{link.accessCount}</span>
                    </td>
                    <td className="p-4">
                      {(!link.expiry || new Date(link.expiry) > new Date()) ? (
                        <Badge variant="outline" className="bg-green-50 text-emerald-600 border-emerald-100 font-medium text-[10px] px-2 py-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 font-medium text-[10px] px-2 py-0">
                          Expired
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleCopy(link.link)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary" title="Copy Link">
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={link.link.startsWith('http') ? link.link : `https://${link.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteLink(link._id, link.fileName)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500" title="Revoke Link">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary">
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

export default PublicLinksContent;
