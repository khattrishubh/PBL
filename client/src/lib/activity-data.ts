import {
  ArrowUp,
  ArrowDown,
  Link,
  Eye,
  Link2,
  ShieldAlert,
  Star,
  LucideIcon,
} from "lucide-react";

export interface ActivityItem {
  id: number;
  actionType: "upload" | "download" | "share" | "view" | "link" | "revoke" | "pin" | "blockchain";
  actionLabel: string;
  file: string;
  user: string;
  timestamp: Date;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  onChain?: boolean;
  txId?: string;
  status: string;
  recipient?: string;
  revokedFrom?: string;
}

export const activityData: ActivityItem[] = [
  {
    id: 1,
    actionType: "upload",
    actionLabel: "Uploaded",
    file: "SmartContract.sol",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
    icon: ArrowUp,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    onChain: true,
    txId: "0x7a3...91b",
    status: "Success",
  },
  {
    id: 2,
    actionType: "share",
    actionLabel: "Shared",
    file: "UI_Design.fig",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    icon: Link2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    recipient: "Alice",
    status: "Shared",
  },
  {
    id: 3,
    actionType: "view",
    actionLabel: "Viewed",
    file: "Blockchain_Report.docx",
    user: "Alice Johnson",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    icon: Eye,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-50/50",
    status: "Success",
  },
  {
    id: 4,
    actionType: "link",
    actionLabel: "Public link created",
    file: "Budget_2024.xlsx",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    icon: Link,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    status: "Active",
  },
  {
    id: 5,
    actionType: "revoke",
    actionLabel: "Access revoked",
    file: "Project_Assets",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    icon: ShieldAlert,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    revokedFrom: "Bob Smith",
    status: "Revoked",
  },
  {
    id: 6,
    actionType: "pin",
    actionLabel: "File pinned",
    file: "Resume_2025.pdf",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    icon: Star,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-50",
    status: "Pinned",
  },
  {
    id: 7,
    actionType: "blockchain",
    actionLabel: "Transaction confirmed",
    file: "Metadata update",
    user: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    icon: Link2,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    onChain: true,
    txId: "0x8b2...42c",
    status: "On-chain",
  },
  {
    id: 8,
    actionType: "download",
    actionLabel: "Downloaded",
    file: "Design_Assets.zip",
    user: "You",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    icon: ArrowDown,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    status: "Success",
  },
];

export const activityIconMap: Record<string, LucideIcon> = {
  upload: ArrowUp,
  download: ArrowDown,
  share: Link2,
  view: Eye,
  link: Link,
  revoke: ShieldAlert,
  pin: Star,
  blockchain: Link2,
};
