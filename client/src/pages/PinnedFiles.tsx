import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import PinnedFilesContent from "@/components/PinnedFilesContent";

const PinnedFiles = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Pinned Files" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <PinnedFilesContent />
      </div>
    </div>
  );
};

export default PinnedFiles;
