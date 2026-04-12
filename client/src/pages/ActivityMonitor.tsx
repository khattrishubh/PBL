import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import ActivityMonitorContent from "@/components/ActivityMonitorContent";

const ActivityMonitor = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Activity" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <ActivityMonitorContent />
      </div>
    </div>
  );
};

export default ActivityMonitor;
