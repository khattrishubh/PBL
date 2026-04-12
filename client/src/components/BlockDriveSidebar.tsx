import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Pin,
  Link,
  Activity,
  Settings,
  HardDrive,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderOpen, label: "My Files", href: "/my-files" },
  { icon: Users, label: "Shared with Me", href: "/shared-with-me" },
  { icon: Pin, label: "Pinned Files", href: "/pinned" },
  { icon: Link, label: "Public Links", href: "/public-links" },
  { icon: Activity, label: "Activity", href: "/activity" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface BlockDriveSidebarProps {
  activePage?: string;
}

const BlockDriveSidebar = ({ activePage = "Dashboard" }: BlockDriveSidebarProps) => {
  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground tracking-tight">
          BlockDrive
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.label === activePage;
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Storage Card */}
      <div className="p-4 mx-3 mb-4 rounded-2xl bg-secondary/60 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Storage Used</span>
        </div>
        <div className="text-sm font-semibold text-foreground mb-1">32.4 GB <span className="text-muted-foreground font-normal">of 100 GB</span></div>
        <Progress value={32.4} className="h-2 mb-3 [&>div]:bg-primary" />
        <Button className="w-full rounded-xl text-xs h-9 bg-primary hover:bg-green-600 text-primary-foreground">
          Upgrade Plan
        </Button>
      </div>
    </aside>
  );
};

export default BlockDriveSidebar;
