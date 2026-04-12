import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFileToIPFS } from "./lib/ipfs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import {
  FileModel,
  ActivityModel,
  NotificationModel,
  PublicLinkModel,
  UserPreferenceModel
} from "./models/schemas";
import mongoose from "mongoose";
import { memoryDb } from "./lib/memoryDb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
let isConnected = false;

// ---------------- DB CONFIG ----------------
mongoose.set("bufferCommands", false);

const startServer = async () => {
  try {
    isConnected = await connectDB();
  } catch (err) {
    console.error("❌ MongoDB Error:", (err as Error).message);
    isConnected = false;
  }

  if (!isConnected) {
    console.warn("⚠️ Running in MOCK DB mode");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: ["http://localhost:8080", "https://khattrishubh.github.io"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ Multer config (IMPORTANT)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ---------------- ROUTES ----------------

// HEALTH CHECK
app.get("/", (req: Request, res: Response) => {
  res.send("API is running");
});

// ---------------- FILE UPLOAD ----------------

// ✅ MAIN FIXED UPLOAD ROUTE
app.post("/api/files", upload.single("file"), async (req: Request, res: Response) => {
  try {
    console.log("📥 Upload request received");
    
    // Handle Folder Creation
    if (req.body && req.body.type === "folder") {
      console.log("📁 Folder creation request:", req.body.name);
      
      const payload = {
        name: req.body.name,
        type: "folder",
        cid: "N/A",
        size: "0 KB",
        owner: req.body.owner || "anonymous",
        status: "normal",
        isPinned: false,
        parentId: req.body.parentId === "null" ? null : (req.body.parentId || null)
      };

      let file;
      if (isConnected) {
        file = new FileModel(payload);
        await file.save();
      } else {
        file = memoryDb.addFile(payload);
      }

      const activity = {
        actionType: "create_folder",
        actionLabel: "Created Folder",
        file: file.name,
        user: file.owner,
        status: "Success",
        timestamp: new Date()
      };

      const notification = {
        user: file.owner,
        message: `Folder "${file.name}" created successfully.`,
        actionType: "create_folder",
        file: file.name
      };

      if (isConnected) {
        await new ActivityModel(activity).save();
        await new NotificationModel(notification).save();
      } else {
        memoryDb.logActivity(activity);
        memoryDb.addNotification(notification);
      }

      return res.status(201).json(file);
    }

    if (!req.file) {
      console.error("❌ No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("✅ File received:", req.file.originalname);

    // Upload to IPFS
    const cid = await uploadFileToIPFS(req.file);

    if (!cid) {
      console.error("❌ IPFS upload failed");
      return res.status(500).json({ error: "IPFS upload failed" });
    }

    console.log("✅ CID:", cid);

    const payload = {
      name: req.file.originalname,
      type: path.extname(req.file.originalname).substring(1) || "txt",
      cid,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      owner: req.body.owner || "anonymous",
      status: "normal",
      isPinned: false,
      parentId: req.body.parentId === "null" ? null : (req.body.parentId || null)
    };

    let file;

    if (isConnected) {
      file = new FileModel(payload);
      await file.save();
    } else {
      file = memoryDb.addFile(payload);
    }

    // Activity
    const activity = {
      actionType: "upload",
      actionLabel: "Uploaded",
      file: file.name,
      user: file.owner,
      status: "Success",
      timestamp: new Date()
    };

    // Notification
    const notification = {
      user: file.owner,
      message: `File "${file.name}" uploaded successfully.`,
      actionType: "upload",
      file: file.name
    };

    if (isConnected) {
      await new ActivityModel(activity).save();
      await new NotificationModel(notification).save();
    } else {
      memoryDb.logActivity(activity);
      memoryDb.addNotification(notification);
    }

    return res.status(201).json(file);

  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- FILE ROUTES ----------------

app.get("/api/files", async (req: Request, res: Response) => {
  try {
    const { owner, parentId, pinned } = req.query;
    
    if (isConnected) {
      let filter: any = {};
      if (owner) filter.owner = owner;
      
      if (pinned === 'true') {
        filter.isPinned = true;
      } else {
        filter.parentId = parentId === "null" ? null : parentId;
      }
      
      const files = await FileModel.find(filter).sort({ createdAt: -1 });
      res.json(files);
    } else {
      const files = memoryDb.getFiles(
        owner as string, 
        parentId === "null" ? null : (parentId as string) || null,
        pinned === 'true' ? true : null
      );
      res.json(files);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/files/shared", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: "Wallet address is required" });

    const targetWallet = (wallet as string).toLowerCase();

    if (isConnected) {
      const files = await FileModel.find({ sharedWith: targetWallet }).sort({ createdAt: -1 });
      res.json(files);
    } else {
      res.json(memoryDb.getSharedFiles(targetWallet));
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch("/api/files/:id/share", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetWallet, ownerWallet } = req.body;

    if (!targetWallet || !ownerWallet) {
      return res.status(400).json({ error: "Missing required wallet parameters" });
    }

    const tWallet = targetWallet.toLowerCase();
    
    if (tWallet === ownerWallet.toLowerCase()) {
      return res.status(400).json({ error: "You cannot share a file with yourself" });
    }

    if (isConnected) {
      const file = await FileModel.findById(id);
      if (!file) return res.status(404).json({ error: "File not found" });
      if (file.owner !== ownerWallet) return res.status(403).json({ error: "Unauthorized to share this file" });
      
      // Recursive sharing for MongoDB
      const applyShareMongo = async (fId: string) => {
        const f = await FileModel.findById(fId);
        if (!f) return;
        
        if (!f.sharedWith.includes(tWallet)) {
          f.sharedWith.push(tWallet);
          f.sharedBy = ownerWallet;
          await f.save();
        }

        if (f.type === "folder") {
          const children = await FileModel.find({ parentId: f._id });
          for (const child of children) {
            await applyShareMongo(child._id.toString());
          }
        }
      };

      await applyShareMongo(id);
      const updatedFile = await FileModel.findById(id);
      res.json(updatedFile);
    } else {
      const updatedFile = memoryDb.shareFile(id, targetWallet, ownerWallet);
      res.json(updatedFile);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/files/download/:cid", (req: Request, res: Response) => {
  const { cid } = req.params;

  if (!cid || cid === "N/A") {
    return res.status(400).json({ error: "Invalid CID" });
  }

  return res.redirect(`https://ipfs.io/ipfs/${cid}`);
});

app.delete("/api/files/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isConnected) {
      await FileModel.findByIdAndDelete(id);
    } else {
      memoryDb.deleteFile(id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch("/api/files/:id/pin", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let file;
    if (isConnected) {
      file = await FileModel.findById(id);
      if (file) {
        file.isPinned = !file.isPinned;
        file.status = file.isPinned ? "pinned" : "normal";
        await file.save();
      }
    } else {
      file = memoryDb.getFileById(id);
      if (file) {
        memoryDb.updateFile(id, { 
          isPinned: !file.isPinned, 
          status: !file.isPinned ? "pinned" : "normal" 
        });
        file = memoryDb.getFileById(id);
      }
    }
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- PREFERENCES ----------------
app.get("/api/preferences/:wallet", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    if (isConnected) {
      let prefs = await UserPreferenceModel.findOne({ walletAddress: wallet });
      if (!prefs) {
        prefs = await new UserPreferenceModel({ walletAddress: wallet }).save();
      }
      res.json(prefs);
    } else {
      res.json(memoryDb.getPreferences(wallet));
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/preferences/:wallet", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    if (isConnected) {
      const prefs = await UserPreferenceModel.findOneAndUpdate(
        { walletAddress: wallet },
        req.body,
        { new: true, upsert: true }
      );
      res.json(prefs);
    } else {
      res.json(memoryDb.updatePreferences(wallet, req.body));
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- PUBLIC LINKS ----------------
app.get("/api/links", async (req: Request, res: Response) => {
  try {
    const { owner } = req.query;
    if (isConnected) {
      const query = owner ? { owner } : {};
      const links = await PublicLinkModel.find(query).sort({ _id: -1 });
      res.json(links);
    } else {
      res.json(memoryDb.getLinks(owner as string));
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/links", async (req: Request, res: Response) => {
  try {
    if (isConnected) {
      const link = await new PublicLinkModel(req.body).save();
      res.status(201).json(link);
    } else {
      const link = memoryDb.addLink(req.body);
      res.status(201).json(link);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/links/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isConnected) {
      await PublicLinkModel.findByIdAndDelete(id);
    } else {
      memoryDb.deleteLink(id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- NOTIFICATIONS ----------------
app.get("/api/notifications", async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    if (isConnected) {
      const query = user ? { user } : {};
      const notifications = await NotificationModel.find(query).sort({ createdAt: -1 });
      res.json(notifications);
    } else {
      res.json(memoryDb.getNotifications(user as string));
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- ACTIVITY ----------------
app.get("/api/activity", async (req: Request, res: Response) => {
  try {
    if (isConnected) {
      const activity = await ActivityModel.find().sort({ timestamp: -1 });
      res.json(activity);
    } else {
      res.json(memoryDb.getActivity());
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/activity", async (req: Request, res: Response) => {
  try {
    if (isConnected) {
      const activity = await new ActivityModel(req.body).save();
      res.status(201).json(activity);
    } else {
      const activity = memoryDb.logActivity(req.body);
      res.status(201).json(activity);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------- GLOBAL ERROR HANDLING ----------------
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

// ---------------- START SERVER ----------------
startServer();

//API Key: b3bd378e2a700bb2d952
//API Secret: 7271afe9038ea1daa904787585b966841644a636057d840bcf5fa22af0d639c9
//JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0NGQ5NzRlMi1mYTY3LTQxMjgtOTIyNC05YjZlMzNhZDJlYmUiLCJlbWFpbCI6ImZvcm1haWx1c2VlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiM2JkMzc4ZTJhNzAwYmIyZDk1MiIsInNjb3BlZEtleVNlY3JldCI6IjcyNzFhZmU5MDM4ZWExZGFhOTA0Nzg3NTg1Yjk2Njg0MTY0NGE2MzYwNTdkODQwYmNmNWZhMjJhZjBkNjM5YzkiLCJleHAiOjE4MDcxNzIxODF9.fQhjUDEI7PtaG_WPHPCqpgXoihTFjA2ZIZnUCgzRhzI