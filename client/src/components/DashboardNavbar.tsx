import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationDropdown from "./NotificationDropdown";
import WalletButton from "./WalletButton";

const DashboardNavbar = () => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files, folders or CIDs..."
          className="pl-10 h-10 rounded-xl bg-muted/50 border-border text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <NotificationDropdown />

        {/* Wallet */}
        <WalletButton />
      </div>
    </header>
  );
};

export default DashboardNavbar;
