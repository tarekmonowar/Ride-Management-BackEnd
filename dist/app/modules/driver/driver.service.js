"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const queryBuilder_1 = require("../../utils/queryBuilder");
const ride_interface_1 = require("../ride/ride.interface");
const ride_model_1 = require("../ride/ride.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const mongoose_1 = require("mongoose");
const env_1 = require("../../config/env");
//*-----------------------------------------------------------------getAvailableRides------------------------------------------
const getAvailableRides = async (query) => {
    const forcedQuery = { ...query, status: ride_interface_1.RideStatus.REQUESTED };
    const queryBuilder = new queryBuilder_1.QueryBuilder(ride_model_1.Ride.find(), forcedQuery);
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
const updateAvailability = async (driverId, isAvailable) => {
    const driver = await user_model_1.User.findById(driverId);
    if (!driver || !driver.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver Not Found");
    }
    driver.isAvailable = isAvailable;
    await driver.save();
    return driver;
};
//*-----------------------------------------------------------------currentRide------------------------------------------
const currentRide = async (driverId) => {
    const driver = await user_model_1.User.findById(driverId);
    if (!driver || !driver.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver Not Found");
    }
    const ongoingRide = await ride_model_1.Ride.findOne({
        driver: driverId,
        status: {
            $in: [ride_interface_1.RideStatus.ACCEPTED, ride_interface_1.RideStatus.PICKED_UP, ride_interface_1.RideStatus.IN_TRANSIT],
        },
    });
    if (!ongoingRide) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You have not ongoing ride");
    }
    return ongoingRide;
};
//-----------------------------------------------------------------earnings------------------------------------------
const earnings = async (driverId) => {
    // Check driver
    const driver = await user_model_1.User.findById(driverId);
    if (!driver || !driver.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver Not Found");
    }
    // Get all completed rides for this driver
    const completedRides = await ride_model_1.Ride.find({
        driver: driverId,
        status: ride_interface_1.RideStatus.COMPLETED,
    });
    if (!completedRides.length) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You have not completed any rides");
    }
    // Calculate total earnings
    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.estimatedCost || 0), 0);
    return {
        totalEarnings,
        totalRides: completedRides.length,
        rides: completedRides,
    };
};
//*-----------------------------------------------------------------acceptRide------------------------------------------
const acceptRide = async (rideId, driverId) => {
    const ride = await ride_model_1.Ride.findById(rideId);
    const MAX_CANCEL_LIMIT = Number(env_1.envVars.MAX_CANCEL_LIMIT);
    if (!ride || ride.status !== ride_interface_1.RideStatus.REQUESTED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Ride Not Available");
    }
    const driver = await user_model_1.User.findById(driverId);
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver Not Available");
    }
    if (!driver.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver Not Approved by admin");
    }
    if (!driver.isAvailable) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are currently unavailable");
    }
    if (driver.cancelledRidesCount >= MAX_CANCEL_LIMIT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver not available due to too many cancellations.");
    }
    const activeRider = await ride_model_1.Ride.findOne({
        driver: new mongoose_1.Types.ObjectId(driverId),
        status: {
            $in: [ride_interface_1.RideStatus.ACCEPTED, ride_interface_1.RideStatus.PICKED_UP, ride_interface_1.RideStatus.IN_TRANSIT],
        },
    });
    if (activeRider) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You already have an active ride. Finish it before accepting a new one.");
    }
    ride.driver = new mongoose_1.Types.ObjectId(driverId);
    ride.status = ride_interface_1.RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    await driver.save();
    await ride.save();
    return ride;
};
exports.DriverService = {
    getAvailableRides,
    acceptRide,
    currentRide,
    earnings,
    updateAvailability,
};
