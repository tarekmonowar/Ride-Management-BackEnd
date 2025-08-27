"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const ride_service_1 = require("./ride.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
//*--------------------------------------------------------createRide--------------------------------------------
const createRide = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const payload = req.body;
    const decodeToken = req.user;
    const result = await ride_service_1.RideService.createRide(payload, decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 201,
        success: true,
        message: "Ride created successfully",
        data: result,
    });
});
//*--------------------------------------------------------activeRide--------------------------------------------
const activeRide = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const result = await ride_service_1.RideService.activeRide(decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Ride retrieved successfully",
        data: result,
    });
});
//*--------------------------------------------------------cancelRide--------------------------------------------
const cancelRide = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const payload = req.body;
    const decodeToken = req.user;
    const rideId = req.params.id;
    const result = await ride_service_1.RideService.cancelRide(rideId, decodeToken.userId, payload);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Ride canceled successfully",
        data: result,
    });
});
//*--------------------------------------------------------get rider ride history--------------------------------------------
const getRideHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const query = req.query;
    const result = await ride_service_1.RideService.getRideHistory(decodeToken.userId, query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Ride history retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
//*--------------------------------------------------------get all ride admin--------------------------------------------
const getAllRides = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const query = req.query;
    const result = await ride_service_1.RideService.getAllRides(query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All ride retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
//*--------------------------------------------------------Driver ride history--------------------------------------------
const driverHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const query = req.query;
    const decodeToken = req.user;
    const result = await ride_service_1.RideService.driverHistory(decodeToken.userId, query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All history retrieved successfully",
        data: {
            totalEarning: result.totalEarning,
            rides: result.rides,
        },
        meta: result.meta,
    });
});
//*--------------------------------------------------------Driver accept ride and update status--------------------------------------------
const updateRideStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const rideId = req.params.id;
    const updateData = req.body;
    const result = await ride_service_1.RideService.updateRideStatus(decodeToken.userId, rideId, updateData);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Ride status updated successfully",
        data: result,
    });
});
exports.RideController = {
    createRide,
    activeRide,
    cancelRide,
    getRideHistory,
    getAllRides,
    driverHistory,
    updateRideStatus,
};
