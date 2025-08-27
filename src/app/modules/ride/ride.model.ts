import mongoose, { model } from "mongoose";
import { IRide, RideStatus } from "./ride.interface";

const pointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], required: true },
  address: {
    type: String,
    required: false,
  },
});

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickupLocation: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    status: {
      type: String,
      enum: Object.values(RideStatus),
      default: RideStatus.REQUESTED,
    },
    estimatedCost: { type: Number, min: 0 },
    distance: { type: Number, min: 0 },
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    pickedUpAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true },
);

export const Ride = model<IRide>("Ride", rideSchema);
