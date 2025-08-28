"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const driver_service_1 = require("./driver.service");
//*--------------------------------------------------------getAvailableRides--------------------------------------------
const getAvailableRides = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const query = req.query;
    const result = await driver_service_1.DriverService.getAvailableRides(query);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "All Available ride retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
//*--------------------------------------------------------updateAvailability--------------------------------------------
const updateAvailability = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const isAvailable = req.body.isAvailable;
    const result = await driver_service_1.DriverService.updateAvailability(decodeToken.userId, isAvailable);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "All Available ride retrieved successfully",
        data: result,
    });
});
//*--------------------------------------------------------currentRide--------------------------------------------
const currentRide = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const result = await driver_service_1.DriverService.currentRide(decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride retrieved successful",
        data: result,
    });
});
//*--------------------------------------------------------earnings--------------------------------------------
const earnings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const result = await driver_service_1.DriverService.earnings(decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Earnings retrieved successfully",
        data: result,
    });
});
//*--------------------------------------------------------acceptRide--------------------------------------------
const acceptRide = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const decodeToken = req.user;
    const rideId = req.params.id;
    const result = await driver_service_1.DriverService.acceptRide(rideId, decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride accept successful",
        data: result,
    });
});
exports.DriverController = {
    getAvailableRides,
    acceptRide,
    currentRide,
    earnings,
    updateAvailability,
};
