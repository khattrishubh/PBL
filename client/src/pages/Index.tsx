import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardContent from "@/components/DashboardContent";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Dashboard" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <DashboardContent />
      </div>
    </div>
  );
};

export default Index;
