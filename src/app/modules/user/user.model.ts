import mongoose, { model, Schema } from "mongoose";
import { IAuthProvider, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  },
);

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      required: true,
      enum: Object.values(Role),
      default: Role.RIDER,
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    cancelledRidesCount: { type: Number, default: 0 },
    auths: [authProviderSchema],
    vehicle: {
      type: { type: String, enum: ["bike", "car"] },
      make: String,
      model: String,
      color: String,
      licensePlate: String,
    },
    nidPhoto: { type: String },
    drivingLicensePhoto: { type: String },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
