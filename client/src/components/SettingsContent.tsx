import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  User,
  Shield,
  Bell,
  HardDrive,
  Settings as SettingsIcon,
  CreditCard,
  Mail,
  Wallet,
  Check,
  ChevronRight,
  LogOut,
  Smartphone,
  Globe,
  LayoutGrid,
  List,
  Moon,
  Sun,
  Camera,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getProvider, deployContract, getContractAddress, setContractAddress } from "@/lib/blockchain";

const SettingsContent = () => {
  const { walletAddress, preferences, updatePreferences } = useWallet();
  const [activeTab, setActiveTab] = useState("Profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [contractAddress, setLocalContractAddress] = useState(getContractAddress() || "");

  // State for different sections
  const [profile, setProfile] = useState({
    name: "Shubh Khattri",
    email: "shubh@blockdrive.io",
    wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    avatar: "https://github.com/shadcn.png",
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
  });

  const [notifications, setNotifications] = useState({
    fileShared: true,
    fileAccessed: false,
    publicLinkActivity: true,
    blockchainUpdates: true,
  });

  const [preferences_local, setPreferencesLocal] = useState({
    theme: preferences.theme || "light",
    view: preferences.defaultView || "grid",
    language: "english",
  });

  useEffect(() => {
    setPreferencesLocal({
      theme: preferences.theme || "light",
      view: preferences.defaultView || "grid",
      language: "english",
    });
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    
    await updatePreferences({
      theme: preferences_local.theme,
      defaultView: preferences_local.view,
    });

    setIsSaving(false);
  };

  const tabs = [
    { id: "Profile", icon: User, label: "Profile" },
    { id: "Account", icon: CreditCard, label: "Account" },
    { id: "Security", icon: Shield, label: "Security" },
    { id: "Notifications", icon: Bell, label: "Notifications" },
    { id: "Storage", icon: HardDrive, label: "Storage" },
    { id: "Preferences", icon: SettingsIcon, label: "Preferences" },
    { id: "Web3", icon: Database, label: "Web3 Layer" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-6 pb-6 border-b border-border">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-background shadow-sm">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    SK
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-green-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  Personal Profile
                </h3>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and profile picture.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="wallet" className="text-sm font-semibold">
                  Connected Wallet
                </Label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="wallet"
                    value={walletAddress || "Not Connected"}
                    readOnly
                    className="pl-10 h-11 rounded-xl bg-muted/30 border-border text-muted-foreground cursor-not-allowed italic"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                    VERIFIED
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 px-1">
                  This wallet is linked to your decentralized storage vault and cannot be changed here.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl px-8 h-11 bg-primary hover:bg-green-600 text-primary-foreground min-w-[140px] shadow-sm font-semibold"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        );

      case "Account":
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Account Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account subscription and billing details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Pro Plan</p>
                    <p className="text-xs text-muted-foreground">$12.99 / Month • Next billing May 5, 2026</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl h-10 border-primary text-primary hover:bg-primary/5">
                  Change Plan
                </Button>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h4 className="font-semibold text-sm mb-4">Account Usage</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[13px] font-medium text-muted-foreground">Encryption Nodes</span>
                    <span className="text-sm font-bold">12 / 24 Active</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        );

      case "Security":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Security & Access</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Secure your files with advanced authentication and encryption control.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Add an extra layer of security to your account by requiring a code from your mobile device.
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={security.twoFactor} 
                  onCheckedChange={(val) => setSecurity({...security, twoFactor: val})} 
                />
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Active Sessions</h4>
                  <Button variant="ghost" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50">Log out all sessions</Button>
                </div>
                <div className="space-y-4">
                  {[
                    { device: "MacBook Pro M3", location: "San Francisco, US", status: "Current Session", icon: Globe },
                    { device: "iPhone 15 Pro", location: "San Francisco, US", status: "Active 2h ago", icon: Smartphone },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                      <div className="flex items-center gap-3">
                        <session.icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[13px] font-bold text-foreground">{session.device}</p>
                          <p className="text-[11px] text-muted-foreground">{session.location}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${session.status === "Current Session" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "text-muted-foreground"}`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-red-100 bg-red-50/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-red-700">Dangerous Area</p>
                  <p className="text-xs text-red-600/70">Disconnect your Web3 wallet and clear all local cache.</p>
                </div>
                <Button variant="destructive" className="rounded-xl h-10 px-6 font-semibold shadow-sm">
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          </div>
        );

      case "Notifications":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Control how and when you want to be notified.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/20 border-b border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">File Activity</h4>
              </div>
              <div className="divide-y divide-border">
                {[
                  { id: "fileShared", label: "File shared with me", desc: "Notify when someone shares a new file with your wallet address.", checked: notifications.fileShared },
                  { id: "fileAccessed", label: "File accessed", desc: "Get notified every time one of your files is accessed via a private link.", checked: notifications.fileAccessed },
                  { id: "publicLinkActivity", label: "Public link activity", desc: "Alerts for downloads or views on your generated public links.", checked: notifications.publicLinkActivity },
                  { id: "blockchainUpdates", label: "Blockchain transaction updates", desc: "Status updates for your on-chain file operations and smart contracts.", checked: notifications.blockchainUpdates },
                ].map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground max-w-md">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={item.checked} 
                      onCheckedChange={(val) => setNotifications({...notifications, [item.id]: val})} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "Storage":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Storage Management</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor your decentralized storage capacity and optimize usage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full" />
                
                <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground tracking-tight uppercase">Current Usage</p>
                    <p className="text-4xl font-black text-foreground">32.4 <span className="text-lg font-normal text-muted-foreground">/ 100 GB</span></p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <HardDrive className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-primary uppercase tracking-wider">32% Completed</span>
                    <span className="text-muted-foreground">67.6 GB Available</span>
                  </div>
                  <Progress value={32.4} className="h-3 [&>div]:bg-primary" />
                </div>

                <div className="flex gap-3 pt-2 relative z-10">
                  <Button className="rounded-xl h-11 px-8 bg-primary hover:bg-green-600 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                    Upgrade to Enterprise
                  </Button>
                  <Button variant="outline" className="rounded-xl h-11 px-8 border-border hover:bg-accent font-semibold">
                    Usage History
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">Clear Cache</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">Free up space by removing older thumbnails and temporary vault files.</p>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">Optimize Vault</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">Compress metadata and re-index your blockchain storage pointers.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Preferences":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Global Preferences</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your BlockDrive experience according to your workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" /> Interface Theme
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPreferencesLocal({...preferences_local, theme: "light"})}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium text-sm ${preferences_local.theme === "light" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button 
                    onClick={() => setPreferencesLocal({...preferences_local, theme: "dark"})}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium text-sm ${preferences_local.theme === "dark" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent hover:border-primary/20"}`}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-500" /> Default View
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPreferencesLocal({...preferences_local, view: "grid"})}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium text-sm ${preferences_local.view === "grid" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                  >
                    <LayoutGrid className="w-4 h-4" /> Grid
                  </button>
                  <button 
                    onClick={() => setPreferencesLocal({...preferences_local, view: "list"})}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all font-medium text-sm ${preferences_local.view === "list" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                  >
                    <List className="w-4 h-4" /> List
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" /> Display Language
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Select your preferred language for the interface.</p>
                  </div>
                  <Select value={preferences_local.language} onValueChange={(val) => setPreferencesLocal({...preferences_local, language: val})}>
                    <SelectTrigger className="w-48 h-11 rounded-xl border-border bg-card font-medium">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="english">English (US)</SelectItem>
                      <SelectItem value="spanish">Español</SelectItem>
                      <SelectItem value="french">Français</SelectItem>
                      <SelectItem value="german">Deutsch</SelectItem>
                      <SelectItem value="japanese">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl px-10 h-11 bg-primary hover:bg-green-600 text-primary-foreground font-bold shadow-lg shadow-primary/20"
              >
                {isSaving ? "Applying..." : "Apply Preferences"}
              </Button>
            </div>
          </div>
        );

      case "Web3":
        const handleDeploy = async () => {
          if (!walletAddress) {
            toast.error("Please connect your wallet first");
            return;
          }
          try {
            setIsDeploying(true);
            toast.info("Deploying BlockDrive contract. Please approve in MetaMask...");
            const provider = await getProvider();
            const signer = await provider.getSigner();
            const address = await deployContract(signer);
            setLocalContractAddress(address);
            toast.success("Contract successfully deployed! " + address);
          } catch (err: any) {
            console.error("Deploy failed:", err);
            toast.error("Failed to deploy contract: " + err.message);
          } finally {
            setIsDeploying(false);
          }
        };

        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="pb-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Web3 Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage the underlying blockchain smart contract that handles file access.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
               <div>
                  <h4 className="font-bold text-sm">Smart Contract</h4>
                  <p className="text-xs text-muted-foreground mb-4">Deploy your decentralized ownership layer.</p>
                  <div className="flex gap-4 items-center">
                    <Input 
                      placeholder="Contract not deployed" 
                      value={contractAddress} 
                      readOnly 
                      className="font-mono text-sm bg-muted/50" 
                    />
                    <Button 
                      onClick={handleDeploy} 
                      disabled={isDeploying || contractAddress !== ""}
                      className="shrink-0"
                    >
                      {isDeploying ? "Deploying..." : (contractAddress ? "Deployed" : "Deploy Logic")}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setContractAddress("");
                        setLocalContractAddress("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background/50">
      <div className="max-w-[1200px] mx-auto p-8 lg:p-12">
        <header className="mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            Configuration
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl font-medium">
            Manage your decentralized storage ecosystem, security parameters, and interface preferences globally.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Navigation Tabs - Left Column */}
          <nav className="flex flex-col gap-1.5 p-2 bg-card/60 backdrop-blur-xl border border-border rounded-[2rem] shadow-sm sticky top-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-primary"}`} />
                  {tab.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
                </button>
              );
            })}
            
            <div className="mt-8 border-t border-border pt-4 px-2 pb-2">
              <button className="flex items-center gap-3.5 px-5 py-4 w-full rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </nav>

          {/* Content Panel - Right Column */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/60 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-black/[0.02] min-h-[600px] flex flex-col">
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsContent;
