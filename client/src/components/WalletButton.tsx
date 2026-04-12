import { useState } from "react";
import { Wallet, Copy, LogOut, ChevronDown, Check, Globe } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const WalletButton = () => {
  const { walletAddress, isConnected, network, connect, disconnect } = useWallet();
  const [isCopied, setIsCopied] = useState(false);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="h-10 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-10 px-4 rounded-xl border-2 border-primary/30 bg-secondary/50 flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:bg-secondary transition-all active:scale-95">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <Wallet className="w-4 h-4" />
          <span className="font-mono">{shortenAddress(walletAddress!)}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 rounded-2xl border-border shadow-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Connected Wallet
            </span>
            {network && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase">
                <Globe className="w-2.5 h-2.5" />
                {network}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-background border border-border p-2 rounded-xl">
            <p className="text-[11px] font-mono text-foreground truncate flex-1">
              {walletAddress}
            </p>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-2">
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            Disconnect Wallet
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/5 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground">
            BlockDrive · Decentralized Storage Identity
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WalletButton;
