// ---------------- MEMORY DATABASE ----------------
// Lightweight In-Memory Persistence Layer for BlockDrive Dashboard
// Used when a local MongoDB instance is not detected.

interface FileItem {
  _id: string;
  name: string;
  type: string;
  cid: string;
  size: string;
  owner: string;
  sharedWith?: string[];
  sharedBy?: string;
  status: "pinned" | "normal";
  isPinned: boolean;
  verified: boolean;
  parentId: string | null;
  createdAt: Date;
}

interface ActivityLog {
  _id: string;
  actionType: string;
  actionLabel: string;
  file: string;
  user: string;
  timestamp: Date;
  status: string;
  txId?: string;
  onChain?: boolean;
}

interface NotificationItem {
  _id: string;
  message: string;
  user: string;
  isRead: boolean;
  createdAt: Date;
  actionType?: string;
  file?: string;
}

interface UserPreference {
  walletAddress: string;
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  defaultView: "list" | "grid";
}

interface PublicLinkItem {
  _id: string;
  fileName: string;
  cid: string;
  link: string;
  permission: string;
  expiry?: Date | null;
  accessCount: number;
  owner: string;
}

class MemoryDb {
  private files: FileItem[] = [];
  private activities: ActivityLog[] = [];
  private notifications: NotificationItem[] = [];
  private preferences: UserPreference[] = [];
  private links: PublicLinkItem[] = [];

  constructor() {
    console.log("📂 [MemoryDb] Initializing In-Memory Cloud Mock...");
  }

  // FILES
  getFiles(owner?: string, parentId: string | null = null, pinned: boolean | null = null) {
    let filtered = this.files;

    if (owner) {
      filtered = filtered.filter(f => f.owner === owner);
    }

    if (pinned !== null) {
      filtered = filtered.filter(f => f.isPinned === pinned);
    } else {
      // ✅ Filter by parentId (defaulting to null meant root)
      filtered = filtered.filter(f => f.parentId === parentId);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getFileById(id: string) {
    return this.files.find(f => f._id === id);
  }

  getSharedFiles(wallet: string) {
    return this.files
      .filter(f => f.sharedWith?.includes(wallet))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  addFile(data: any) {
    const newFile: FileItem = {
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      status: "normal",
      isPinned: data.isPinned || false,
      verified: false,
      parentId: data.parentId || null,
      ...data
    };
    this.files.push(newFile);
    return newFile;
  }

  updateFile(id: string, data: any) {
    const idx = this.files.findIndex(f => f._id === id);
    if (idx !== -1) {
      this.files[idx] = { ...this.files[idx], ...data };
      return this.files[idx];
    }
    return null;
  }

  deleteFile(id: string) {
    this.files = this.files.filter(f => f._id !== id);
  }

  shareFile(id: string, targetWallet: string, ownerWallet: string) {
    const file = this.getFileById(id);
    if (!file) throw new Error("File not found");
    if (file.owner !== ownerWallet) throw new Error("Unauthorized to share this file");
    
    // Normalize case
    const target = targetWallet.toLowerCase();

    // Helper to recursively share
    const applyShare = (fId: string) => {
      const f = this.getFileById(fId);
      if (!f) return;
      if (!f.sharedWith) f.sharedWith = [];
      if (!f.sharedWith.includes(target)) {
        f.sharedWith.push(target);
        f.sharedBy = ownerWallet; // Track who shared it
      }
      
      // If it's a folder, recursively share its immediate children
      if (f.type === "folder") {
        const children = this.files.filter(child => child.parentId === f._id);
        children.forEach(child => applyShare(child._id));
      }
    };

    applyShare(id);
    return file;
  }

  // ACTIVITY
  getActivity() {
    return this.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  logActivity(data: any) {
    const log: ActivityLog = {
      _id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...data
    };
    this.activities.push(log);
    return log;
  }

  // NOTIFICATIONS
  getNotifications(user?: string) {
    if (!user) return this.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return this.notifications
      .filter(n => n.user === user)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  addNotification(data: any) {
    const notice: NotificationItem = {
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      isRead: false,
      ...data
    };
    this.notifications.push(notice);
    return notice;
  }

  updateNotification(id: string, data: any) {
    const idx = this.notifications.findIndex(n => n._id === id);
    if (idx !== -1) {
      this.notifications[idx] = { ...this.notifications[idx], ...data };
      return this.notifications[idx];
    }
    return null;
  }

  // PREFERENCES
  getPreferences(wallet: string) {
    let prefs = this.preferences.find(p => p.walletAddress === wallet);
    if (!prefs) {
      prefs = {
        walletAddress: wallet,
        theme: "light",
        notificationsEnabled: true,
        defaultView: "list"
      };
      this.preferences.push(prefs);
    }
    return prefs;
  }

  updatePreferences(wallet: string, data: any) {
    const idx = this.preferences.findIndex(p => p.walletAddress === wallet);
    if (idx !== -1) {
      this.preferences[idx] = { ...this.preferences[idx], ...data };
      return this.preferences[idx];
    } else {
      const newPrefs = { walletAddress: wallet, ...data };
      this.preferences.push(newPrefs);
      return newPrefs;
    }
  }

  // LINKS
  getLinks(owner?: string) {
    if (!owner) return this.links;
    return this.links.filter(l => l.owner === owner);
  }

  addLink(data: any) {
    const link: PublicLinkItem = {
      _id: Math.random().toString(36).substr(2, 9),
      accessCount: 0,
      ...data
    };
    this.links.push(link);
    return link;
  }

  deleteLink(id: string) {
    this.links = this.links.filter(l => l._id !== id);
  }
}

export const memoryDb = new MemoryDb();
