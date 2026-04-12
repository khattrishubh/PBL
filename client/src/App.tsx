import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import MyFiles from "./pages/MyFiles.tsx";
import SharedWithMe from "./pages/SharedWithMe.tsx";
import PinnedFiles from "./pages/PinnedFiles.tsx";
import PublicLinks from "./pages/PublicLinks.tsx";
import ActivityMonitor from "./pages/ActivityMonitor.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

import { WalletProvider } from "./context/WalletContext.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />

          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-files" element={<MyFiles />} />
            <Route path="/my-files/:folderId" element={<MyFiles />} />
            <Route path="/shared-with-me" element={<SharedWithMe />} />
            <Route path="/pinned" element={<PinnedFiles />} />
            <Route path="/public-links" element={<PublicLinks />} />
            <Route path="/activity" element={<ActivityMonitor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;