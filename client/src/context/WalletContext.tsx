import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  network: string | null;
  preferences: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  updatePreferences: (newPrefs: any) => Promise<void>;
}

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    theme: "light",
    notificationsEnabled: true,
    defaultView: "list",
  });

  // ✅ SAFE ethereum getter
  const getEthereum = (): EthereumProvider | null => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        return (window as any).ethereum;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchPreferences = useCallback(async (address: string) => {
    try {
      const data = await apiFetch<any>(`/preferences/${address}`);
      setPreferences(data);

      if (data.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (err) {
      console.error("Preferences fetch failed (ignored)", err);
    }
  }, []);

  const updatePreferences = async (newPrefs: any) => {
    try {
      const updated = await apiFetch<any>("/preferences", {
        method: "POST",
        body: JSON.stringify({ walletAddress, ...newPrefs }),
      });

      setPreferences(updated);

      if (newPrefs.theme) {
        document.documentElement.classList.toggle(
          "dark",
          newPrefs.theme === "dark"
        );
      }

      toast.success("Preferences saved");
    } catch {
      toast.error("Preferences update failed");
    }
  };

  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case "0x1":
        return "Ethereum Mainnet";
      case "0x89":
        return "Polygon";
      case "0x13881":
        return "Mumbai Testnet";
      default:
        return "Unknown Network";
    }
  };

  const detectNetwork = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setNetwork("Offline Mode");
      return;
    }

    try {
      const chainId = await ethereum.request({ method: "eth_chainId" });
      setNetwork(getNetworkName(chainId));
    } catch {
      setNetwork("Unknown");
    }
  }, []);

  // ✅ SAFE INIT (NO CRASH)
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem("blockdrive_wallet");
      if (savedAddress) {
        setWalletAddress(savedAddress);
        setIsConnected(true);
        detectNetwork();
        fetchPreferences(savedAddress);
      }
    } catch (e) {
      console.warn("Init skipped");
    }
  }, [detectNetwork, fetchPreferences]);

  // ❌ REMOVE metamask listeners (they cause crash on GH pages)
  // (INTENTIONALLY REMOVED)

  const connect = async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      toast.error("No wallet detected (demo mode)");
      return;
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      localStorage.setItem("blockdrive_wallet", address);

      await detectNetwork();
      await fetchPreferences(address);

      toast.success("Wallet connected");
    } catch (error: any) {
      toast.error("Wallet connection failed");
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setNetwork(null);
    localStorage.removeItem("blockdrive_wallet");
    toast.info("Disconnected");
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected,
        network,
        preferences,
        connect,
        disconnect,
        updatePreferences,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
