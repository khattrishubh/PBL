import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import SettingsContent from "@/components/SettingsContent.tsx";

const Settings = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Settings" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <SettingsContent />
      </div>
    </div>
  );
};

export default Settings;
