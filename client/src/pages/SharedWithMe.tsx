import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import SharedWithMeContent from "@/components/SharedWithMeContent";

const SharedWithMe = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Shared with Me" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <SharedWithMeContent />
      </div>
    </div>
  );
};

export default SharedWithMe;
