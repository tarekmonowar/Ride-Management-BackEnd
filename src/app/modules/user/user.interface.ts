import { Types } from "mongoose";

export enum Role {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  RIDER = "RIDER",
  DRIVER = "DRIVER",
}

export type VehicleType = "bike" | "car";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  address?: string;
  role: Role;
  isVerified: boolean;
  isBlocked: boolean;
  isApproved?: boolean;
  isAvailable?: boolean;
  cancelledRidesCount?: number;
  auths: IAuthProvider[];
  vehicle?: {
    type: VehicleType;
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  nidPhoto?: string;
  drivingLicensePhoto?: string;
  applicationStatus?: ApplicationStatus;
  rejectionReason?: string;
  rating?: number;
  createdAt?: Date;
}
