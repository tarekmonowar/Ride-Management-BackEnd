import { z } from "zod";
import { RideStatus } from "./ride.interface";
export const createRideZodSchema = z.object({
  pickupLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  vehicleType: z.enum(["bike", "car"]),
});

export const updateRideStatusSchema = z.object({
  status: z.enum(Object.values(RideStatus)).optional(),
  cancellationReason: z.string().optional(),
});
