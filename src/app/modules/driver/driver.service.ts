import { QueryBuilder } from "../../utils/queryBuilder";
import { RideStatus } from "../ride/ride.interface";
import { Ride } from "../ride/ride.model";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Types } from "mongoose";
import { envVars } from "../../config/env";

//*-----------------------------------------------------------------getAvailableRides------------------------------------------

const getAvailableRides = async (
  query: Record<string, string>,
  driverId: string,
) => {
  // Find the driver to get their vehicle type
  const driver = await User.findById(driverId);
  if (!driver || !driver.isApproved) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Driver Not Found or Not Approved",
    );
  }

  const driverVehicleType = driver.vehicle?.type;

  const baseFilter: any = { status: RideStatus.REQUESTED };
  if (driverVehicleType) {
    baseFilter.vehicleType = driverVehicleType;
  }

  const forcedQuery = { ...query, status: RideStatus.REQUESTED };
  const queryBuilder = new QueryBuilder(Ride.find(baseFilter), forcedQuery);

  const rideData = queryBuilder.filter().fields().sort().paginate();

  const [data, meta] = await Promise.all([
    rideData.build().populate("rider").lean(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

//*-----------------------------------------------------------------updateAvailability------------------------------------------

const updateAvailability = async (driverId: string, isAvailable: boolean) => {
  const driver = await User.findById(driverId);
  if (!driver || !driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found");
  }
  driver.isAvailable = isAvailable;
  await driver.save();
  return driver;
};

//*-----------------------------------------------------------------currentRide------------------------------------------

const currentRide = async (driverId: string) => {
  const driver = await User.findById(driverId);
  if (!driver || !driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found");
  }
  const ongoingRide = await Ride.findOne({
    driver: driverId,
    status: {
      $in: [RideStatus.ACCEPTED, RideStatus.PICKED_UP, RideStatus.IN_TRANSIT],
    },
  });

  if (!ongoingRide) {
    throw new AppError(httpStatus.BAD_REQUEST, "You have not ongoing ride");
  }
  return ongoingRide;
};
//-----------------------------------------------------------------earnings------------------------------------------

const earnings = async (driverId: string) => {
  // Check driver
  const driver = await User.findById(driverId);
  if (!driver || !driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found");
  }

  // Get all completed rides for this driver
  const completedRides = await Ride.find({
    driver: driverId,
    status: RideStatus.COMPLETED,
  });

  if (!completedRides.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have not completed any rides",
    );
  }

  // Calculate total earnings
  const totalEarnings = completedRides.reduce(
    (sum, ride) => sum + (ride.estimatedCost || 0),
    0,
  );

  return {
    totalEarnings,
    totalRides: completedRides.length,
    rides: completedRides,
  };
};

//*-----------------------------------------------------------------acceptRide------------------------------------------

const acceptRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);
  const MAX_CANCEL_LIMIT = Number(envVars.MAX_CANCEL_LIMIT);

  if (!ride || ride.status !== RideStatus.REQUESTED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Ride Not Available");
  }
  const driver = await User.findById(driverId);

  if (!driver) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Available");
  }
  if (!driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Approved by admin");
  }

  if (!driver.isAvailable) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are currently unavailable");
  }

  // Validate driver's vehicle type matches ride's vehicleType
  if (
    ride.vehicleType &&
    driver.vehicle?.type &&
    ride.vehicleType !== driver.vehicle.type
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your vehicle type (${driver.vehicle.type}) does not match the ride's required vehicle type (${ride.vehicleType})`,
    );
  }

  if (driver.cancelledRidesCount! >= MAX_CANCEL_LIMIT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Driver not available due to too many cancellations.",
    );
  }

  const activeRider = await Ride.findOne({
    driver: new Types.ObjectId(driverId),
    status: {
      $in: [RideStatus.ACCEPTED, RideStatus.PICKED_UP, RideStatus.IN_TRANSIT],
    },
  });
  if (activeRider) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have an active ride. Finish it before accepting a new one.",
    );
  }

  ride.driver = new Types.ObjectId(driverId);
  ride.status = RideStatus.ACCEPTED;
  ride.acceptedAt = new Date();

  await driver.save();
  await ride.save();

  return ride;
};

export const DriverService = {
  getAvailableRides,
  acceptRide,
  currentRide,
  earnings,
  updateAvailability,
};
