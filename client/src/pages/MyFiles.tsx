import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import MyFilesContent from "@/components/MyFilesContent";

const MyFiles = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="My Files" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <MyFilesContent />
      </div>
    </div>
  );
};

export default MyFiles;
