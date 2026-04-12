import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { FileItem } from "@/hooks/useFiles";

interface NewFolderDialogProps {
  onAddFolder: (folder: FileItem) => void;
  files: FileItem[];
  variant?: "default" | "outline";
  parentId?: string | null;
}

const NewFolderDialog = ({ onAddFolder, files, variant = "outline", parentId = null }: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = () => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast.error("Folder name cannot be empty");
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("A folder or file with this name already exists");
      return;
    }

    const newFolder: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: trimmedName,
      type: "folder",
      cid: "N/A",
      size: "--",
      uploadedAt: "Just now",
      status: "normal",
      owner: "Me",
      parentId: parentId
    };

    onAddFolder(newFolder);
    setFolderName("");
    setIsOpen(false);
    toast.success(`Folder "${trimmedName}" created!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          className="rounded-xl gap-2 border-primary/30 text-secondary-foreground hover:bg-secondary h-11"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight text-foreground">
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="folderName" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              Folder Name
            </label>
            <Input
              id="folderName"
              placeholder="e.g. Project Delta"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="h-12 rounded-2xl bg-muted/30 border-border focus:ring-primary/20 transition-all font-medium"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
            Folders allow you to organize your decentralized files more efficiently. 
            Created folders are private to your wallet identity.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl h-11 font-bold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            className="rounded-xl h-11 px-8 bg-primary hover:bg-green-600 text-primary-foreground font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderDialog;
