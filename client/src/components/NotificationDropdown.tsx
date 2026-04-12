import { useState, useMemo, useEffect, useCallback } from "react";
import { Bell, Check, ArrowUpRight, Clock, Activity } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activityIconMap } from "@/lib/activity-data";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setIsLoading(true);
      const data = await apiFetch<any[]>(`/notifications?user=${walletAddress}`) ?? [];
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchNotifications();
      
      // Listen for global refresh signal
      window.addEventListener("refresh-live-data", fetchNotifications);
      
      const interval = setInterval(fetchNotifications, 30000); // Keep fallback polling
      return () => {
        window.removeEventListener("refresh-live-data", fetchNotifications);
        clearInterval(interval);
      };
    }
  }, [fetchNotifications, walletAddress]);

  const unreadCount = useMemo(() => 
    (notifications ?? []).filter(n => !n.isRead).length
  , [notifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}`, { method: "PATCH" });
      setNotifications(prev => 
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notifications.filter(n => !n.isRead)) {
      await handleMarkAsRead(n._id);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/activity");
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors group">
          <Bell className="w-[18px] h-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background flex items-center justify-center animate-in zoom-in duration-300">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl border-border shadow-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-primary hover:text-green-600 transition-colors uppercase tracking-wider"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-medium text-foreground">No notifications yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">We'll alert you when something happens.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((item) => {
                const isUnread = !item.isRead;
                const Icon = (activityIconMap as any)[item.actionType || "upload"] || Activity;
                return (
                  <div 
                    key={item._id}
                    onClick={() => handleMarkAsRead(item._id)}
                    className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-accent/50 ${isUnread ? "bg-primary/[0.02]" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 text-primary`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-foreground leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{getTimeAgo(new Date(item.createdAt))}</span>
                        {isUnread && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <button 
          onClick={handleViewAll}
          className="w-full p-3 bg-muted/10 border-t border-border flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all group"
        >
          View All Activity
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
