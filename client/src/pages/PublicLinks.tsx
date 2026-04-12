import BlockDriveSidebar from "@/components/BlockDriveSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import PublicLinksContent from "@/components/PublicLinksContent";

const PublicLinks = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <BlockDriveSidebar activePage="Public Links" />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />
        <PublicLinksContent />
      </div>
    </div>
  );
};

export default PublicLinks;
