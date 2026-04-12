import {
  Clock,
  ArrowUp,
  ArrowDown,
  Link,
  Trash2,
  Star,
  Link2,
  CheckCircle2,
  ShieldAlert,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Eye,
  FileText,
  Activity,
  User,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  MousePointer2,
  Zap,
  X,
} from "lucide-react";
import { ActivityItem, activityIconMap } from "@/lib/activity-data";
import { apiFetch } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/context/WalletContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statsCards = [
  { icon: Activity, label: "Total Actions Today", value: "124", sub: "+18% from yesterday", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Eye, label: "Files Accessed", value: "32", sub: "Last 24 hours", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Link2, label: "Links Generated", value: "12", sub: "Active links", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Zap, label: "Blockchain Transactions", value: "56", sub: "All confirmed", color: "text-purple-500", bg: "bg-purple-50" },
];


const infoCards = [
  {
    icon: ShieldCheck,
    title: "Transparent Tracking",
    desc: "Every action is recorded and visible to you",
  },
  {
    icon: CheckCircle2,
    title: "Blockchain Verified",
    desc: "Critical actions are stored permanently on-chain",
  },
  {
    icon: Activity,
    title: "Real-Time Updates",
    desc: "Monitor file and network activity instantly",
  },
];

const ActivityMonitorContent = () => {
  const { walletAddress } = useWallet();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [activeTab, setActiveTab] = useState("All Activity");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("this-week");
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setIsLoading(true);
      const data = await apiFetch<any[]>(`/activity?user=${walletAddress}`) ?? [];
      
      // Map backend data to ActivityItem format
      const mapped = data.map(item => ({
        ...item,
        id: item._id,
        timestamp: new Date(item.timestamp),
        icon: (activityIconMap as any)[item.actionType] || Activity,
        iconColor: item.actionType === "upload" ? "text-emerald-500" : 
                   item.actionType === "download" ? "text-blue-500" :
                   item.actionType === "delete" ? "text-red-500" : "text-purple-500",
        iconBg: item.actionType === "upload" ? "bg-emerald-50" : 
                item.actionType === "download" ? "bg-blue-50" :
                item.actionType === "delete" ? "bg-red-50" : "bg-purple-50"
      }));
      
      setActivities(mapped);
    } catch (err) {
      console.error("Failed to fetch activity", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchActivities();
    
    // Listen for global refresh signal
    window.addEventListener("refresh-live-data", fetchActivities);
    return () => window.removeEventListener("refresh-live-data", fetchActivities);
  }, [fetchActivities]);

  const filteredData = useMemo(() => {
    return activities.filter((item) => {
      // 1. Tab Filter
      if (activeTab !== "All Activity") {
        const tabMap: Record<string, string[]> = {
          "Uploads": ["upload"],
          "Downloads": ["download"],
          "Sharing": ["share", "link", "revoke"],
          "Blockchain": ["blockchain"],
        };
        if (!tabMap[activeTab]?.includes(item.actionType)) return false;
      }

      // 2. Date Filter
      const now = new Date();
      const itemDate = item.timestamp;
      if (dateRange === "today") {
        if (itemDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === "this-week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < oneWeekAgo) return false;
      } else if (dateRange === "this-month") {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (itemDate < oneMonthAgo) return false;
      }

      // 3. Search Filter (File, User, Action)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          item.file.toLowerCase().includes(query) ||
          item.user.toLowerCase().includes(query) ||
          item.actionLabel.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, dateRange]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const handleOpenTransaction = (txId?: string) => {
    if (!txId) return;
    window.open(`https://etherscan.io/tx/${txId}`, "_blank");
  };

  const handlePreviewFile = (fileName: string) => {
    console.log(`Previewing file: ${fileName}`);
    alert(`Opening preview for ${fileName}...`);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header / Hero Section */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-32 top-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-1">
            <Activity className="w-3 h-3" />
            Live Activity
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Activity Monitor
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Track all file actions and blockchain transactions in real time. Your activity log is encrypted and private.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <Activity className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Side: Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-card border border-border rounded-full w-fit overflow-x-auto no-scrollbar shadow-sm">
          {["All Activity", "Uploads", "Downloads", "Sharing", "Blockchain"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#dcfce7] text-[#166534] font-semibold"
                  : "text-[#6b7280] hover:bg-emerald-50/50 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Side: Search, Date & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-full bg-card border-border text-sm focus:ring-primary/20 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-11 px-4 rounded-full border-border bg-card text-sm text-[#6b7280] font-medium w-[140px] hover:bg-accent transition-all duration-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex p-1 border border-border rounded-full bg-card shadow-sm h-11 items-center">
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-2 rounded-full transition-all duration-200 ${
                viewMode === "timeline"
                  ? "bg-[#dcfce7] text-[#166534]"
                  : "text-[#6b7280] hover:bg-emerald-50/50"
              }`}
            >
              <List className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-full transition-all duration-200 ${
                viewMode === "table"
                  ? "bg-[#dcfce7] text-[#166534]"
                  : "text-[#6b7280] hover:bg-emerald-50/50"
              }`}
            >
              <LayoutGrid className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Activity View */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-white/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Activity Log</h3>
            <p className="text-[10px] text-muted-foreground">Showing real-time actions across BlockDrive</p>
          </div>
          <Button variant="outline" className="h-8 rounded-lg text-[10px] gap-1.5 border-border">
            <Clock className="w-3 h-3" />
            {dateRange === "this-week" ? "This Week" : dateRange === "today" ? "Today" : dateRange === "this-month" ? "This Month" : "All Time"}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>

        {viewMode === "timeline" ? (
          <div className="p-6">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-base">No activity found</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:left-5 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border/60">
                {filteredData.map((item) => (
                  <div key={item.id} className="relative pl-12 group">
                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-full ${item.iconBg} border-2 border-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {item.user === "You" ? <span className="text-primary font-semibold">You</span> : item.user}{" "}
                          <span className="text-muted-foreground font-normal">{item.actionLabel.toLowerCase()}</span>{" "}
                          <span className="text-foreground font-semibold">"{item.file}"</span>
                          {item.recipient && (
                            <span className="text-muted-foreground font-normal"> with <span className="text-foreground font-medium">{item.recipient}</span></span>
                          )}
                          {item.revokedFrom && (
                            <span className="text-muted-foreground font-normal"> from <span className="text-foreground font-medium">{item.revokedFrom}</span></span>
                          )}
                        </p>
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{getTimeAgo(item.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.onChain && (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold py-0 h-4">
                              ON-CHAIN
                            </Badge>
                            <code 
                              onClick={() => handleOpenTransaction(item.txId)}
                              className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-muted/60"
                            >
                              Tx: {item.txId}
                              <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/60" />
                            </code>
                          </div>
                        )}
                        {!item.onChain && item.status && (
                          <Badge variant="outline" className={`text-[9px] font-bold py-0 h-4 ${
                            item.status === "Shared" ? "bg-blue-50 text-blue-600 border-blue-100" :
                            item.status === "Revoked" ? "bg-red-50 text-red-600 border-red-100" :
                            item.status === "Pinned" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-muted/40 text-muted-foreground border-border"
                          }`}>
                            {item.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-muted/10">
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">File</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-green-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                          </div>
                          <span className="font-semibold text-foreground">{item.actionLabel}</span>
                        </div>
                      </td>
                      <td className="p-4 text-foreground font-medium">{item.file}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-muted-foreground">{item.user}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{getTimeAgo(item.timestamp)}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0 h-4 ${
                          item.status === "Success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          item.status === "Revoked" ? "bg-red-50 text-red-600 border-red-100" :
                          item.status === "On-chain" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          item.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                          {item.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.txId && (
                            <code 
                              onClick={() => handleOpenTransaction(item.txId)}
                              className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/60 transition-colors"
                            >
                              {item.txId}
                            </code>
                          )}
                          <button 
                            onClick={() => handlePreviewFile(item.file)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              <p className="font-semibold text-foreground text-sm">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export default ActivityMonitorContent;
