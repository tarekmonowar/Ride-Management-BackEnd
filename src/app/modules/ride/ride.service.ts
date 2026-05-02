import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
  CreateRideInput,
  RideStatus,
  UpdateRideStatusInput,
} from "./ride.interface";
import { Ride } from "./ride.model";
import { envVars } from "../../config/env";
import { calculateDistanceInKm } from "../../utils/CalculateCost";
import { Role } from "../user/user.interface";
import { QueryBuilder } from "../../utils/queryBuilder";
import mongoose from "mongoose";
import { getPlaceName } from "../../utils/getPlaceName";

//*-----------------------------------------------------------------create ride------------------------------------------
const createRide = async (payload: CreateRideInput, userId: string) => {
  const rider = await User.findById(userId);
  if (!rider || rider.isBlocked) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid rider account");
  }

  // Step 0: Check if rider already has an active ride
  const activeRide = await Ride.findOne({
    rider: userId,
    status: {
      $in: [
        RideStatus.REQUESTED,
        RideStatus.ACCEPTED,
        RideStatus.PICKED_UP,
        RideStatus.IN_TRANSIT,
      ],
    },
  });

  if (activeRide) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have an active ride. Please complete or cancel it before creating a new one.",
    );
  }

  const PER_KM_COST = Number(envVars.PER_KM_COST);
  // Step 1: Calculate distance using Directions API
  const distance = await calculateDistanceInKm(
    payload.pickupLocation,
    payload.destination,
  );
  const formattedDistance = Number(distance.toFixed(2));

  // Step 2: Calculate estimated cost based on vehicle type
  const vehicleMultiplier = payload.vehicleType === "bike" ? 0.6 : 1;
  const estimatedCost = Number(
    (distance * PER_KM_COST * vehicleMultiplier).toFixed(2),
  );

  // Step 3: Get addresses
  const pickupAddress = await getPlaceName(
    payload.pickupLocation.lat,
    payload.pickupLocation.lng,
  );
  const destinationAddress = await getPlaceName(
    payload.destination.lat,
    payload.destination.lng,
  );

  const ride = await Ride.create({
    rider: userId,
    pickupLocation: {
      type: "Point",
      coordinates: [payload.pickupLocation.lng, payload.pickupLocation.lat],
      address: pickupAddress,
    },
    destination: {
      type: "Point",
      coordinates: [payload.destination.lng, payload.destination.lat],
      address: destinationAddress,
    },
    status: RideStatus.REQUESTED,
    estimatedCost: estimatedCost,
    distance: formattedDistance,
    vehicleType: payload.vehicleType,
  });

  return ride;
};

//*-----------------------------------------------------------------activeRide------------------------------------------
const activeRide = async (userId: string) => {
  const ride = await Ride.findOne({
    rider: userId,
    status: {
      $in: [
        RideStatus.REQUESTED,
        RideStatus.ACCEPTED,
        RideStatus.PICKED_UP,
        RideStatus.IN_TRANSIT,
      ],
    },
  });

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "You do not have any active ride");
  }

  return ride;
};

//*-----------------------------------------------------------------cancel ride------------------------------------------
const cancelRide = async (
  rideId: string,
  userId: string,
  payload: UpdateRideStatusInput,
) => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  const rider = await User.findById(userId);
  if (!rider || rider.isBlocked) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid rider account");
  }

  //Rider/Driver cannot cancel other ride
  if (rider.role === Role.RIDER || rider.role === Role.DRIVER) {
    if (!ride.rider.equals(userId)) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot cancel this ride");
    }
  }

  // Ride can be cancelled only if still in REQUESTED status
  if (ride.status !== RideStatus.REQUESTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel ride after it has been ${ride.status.toLowerCase()}`,
    );
  }

  // Cancel ride
  ride.status = RideStatus.CANCELLED;
  ride.cancelledAt = new Date();
  ride.cancellationReason = payload.cancellationReason || "Cancelled";

  await ride.save();

  return ride;
};

//*-----------------------------------------------------------------getRideHistory------------------------------------------
const getRideHistory = async (
  userId: string,
  query: Record<string, string>,
) => {
  const baseQuery = Ride.find({ rider: userId });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const rideData = queryBuilder.filter().fields().sort().paginate();

  const [data, meta] = await Promise.all([
    rideData.build().populate("driver", "name email").lean(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

//*-----------------------------------------------------------------get all rides admin------------------------------------------
const getAllRides = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Ride.find(), query);
  const rideData = queryBuilder.filter().fields().sort().paginate();

  const [data, meta] = await Promise.all([
    rideData.build().populate("rider driver", "_id name email").lean(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

//*-----------------------------------------------------------------get all driver history------------------------------------------

const driverHistory = async (userId: string, query: Record<string, string>) => {
  // Aggregate total earning
  const totalEarningResult = await Ride.aggregate([
    {
      $match: {
        driver: new mongoose.Types.ObjectId(userId),
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$estimatedCost" },
      },
    },
  ]);
  const totalEarning = totalEarningResult[0]?.total || 0;

  const baseQuery = Ride.find({ driver: userId });
  const queryBuilder = new QueryBuilder(baseQuery, query);
  const rideData = queryBuilder.filter().fields().sort().paginate();

  const [data, meta] = await Promise.all([
    rideData.build().populate("rider").lean(),
    queryBuilder.getMeta(),
  ]);

  return {
    totalEarning,
    rides: data,
    meta,
  };
};

//*-----------------------------------------------------------------Driver accept ride and update status------------------------------------------

const updateRideStatus = async (
  userId: string,
  rideId: string,
  updateData: { status: RideStatus; cancellationReason?: string },
) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new Error("Ride not found");
  }

  const driver = await User.findById(userId);

  if (!driver) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid driver account");
  }

  if (!driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid driver account");
  }

  if (!driver.isAvailable) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are currently unavailable");
  }

  if (driver.role !== Role.DRIVER) {
    throw new Error("You are not driver");
  }
  if (ride.driver?.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  const validTransitions: Record<RideStatus, RideStatus[]> = {
    [RideStatus.REQUESTED]: [], //only accepted ride driver can update /accept route driver already accepted
    [RideStatus.ACCEPTED]: [RideStatus.PICKED_UP, RideStatus.CANCELLED],
    [RideStatus.PICKED_UP]: [RideStatus.IN_TRANSIT],
    [RideStatus.IN_TRANSIT]: [RideStatus.COMPLETED],
    [RideStatus.COMPLETED]: [],
    [RideStatus.CANCELLED]: [],
  };

  if (!updateData.status) {
    throw new AppError(httpStatus.BAD_REQUEST, "Status is required");
  }

  const nextStatuses = validTransitions[ride.status];
  if (
    !nextStatuses ||
    !nextStatuses.includes(updateData.status as RideStatus)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid status transition from ${ride.status} to ${updateData.status}`,
    );
  }

  ride.status = updateData.status as RideStatus;

  switch (updateData.status) {
    case RideStatus.PICKED_UP:
      ride.pickedUpAt = new Date();
      break;
    case RideStatus.COMPLETED:
      ride.completedAt = new Date();
      ride.paymentStatus = "pending";
      break;
    case RideStatus.CANCELLED:
      ride.cancellationReason = updateData.cancellationReason;
      ride.cancelledAt = new Date();
      driver.cancelledRidesCount! += 1;
      await driver.save();
      break;
  }

  const UpdateRide = await ride.save();

  return UpdateRide;
};

export const RideService = {
  createRide,
  activeRide,
  cancelRide,
  getRideHistory,
  getAllRides,
  driverHistory,
  updateRideStatus,
};
