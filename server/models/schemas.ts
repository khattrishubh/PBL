import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // pdf, doc, xls, txt, folder, image, zip
  cid: { type: String, default: "N/A" }, // IPFS hash
  size: { type: String, default: "--" },
  owner: { type: String, required: true }, // wallet address
  sharedWith: [String],
  sharedBy: String,
  status: { type: String, enum: ["pinned", "normal"], default: "normal" },
  isPinned: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  parentId: { type: Schema.Types.ObjectId, ref: "File", default: null },
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new Schema({
  actionType: { type: String, required: true }, // upload, download, share, revoke, pin, blockchain
  actionLabel: { type: String, required: true },
  file: { type: String, required: true },
  user: { type: String, required: true }, // wallet address or "You"
  timestamp: { type: Date, default: Date.now },
  status: { type: String, required: true },
  txId: { type: String },
  onChain: { type: Boolean, default: false }
});

const notificationSchema = new Schema({
  message: { type: String, required: true },
  user: { type: String, required: true }, // target wallet address
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  actionType: { type: String },
  file: { type: String }
});

const publicLinkSchema = new Schema({
  fileName: { type: String, required: true },
  cid: { type: String, required: true },
  link: { type: String, required: true, unique: true },
  permission: { type: String, required: true }, // View Only, Download
  expiry: { type: Date },
  accessCount: { type: Number, default: 0 },
  owner: { type: String, required: true }
});

const userPreferenceSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  notificationsEnabled: { type: Boolean, default: true },
  defaultView: { type: String, enum: ["list", "grid"], default: "list" }
});

export const FileModel = model("File", fileSchema);
export const ActivityModel = model("Activity", activitySchema);
export const NotificationModel = model("Notification", notificationSchema);
export const PublicLinkModel = model("PublicLink", publicLinkSchema);
export const UserPreferenceModel = model("UserPreference", userPreferenceSchema);
