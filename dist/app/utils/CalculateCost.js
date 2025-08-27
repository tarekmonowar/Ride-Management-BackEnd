"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceInKm = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const haversineDistance_1 = require("./haversineDistance");
const calculateDistanceInKm = async (from, to) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&mode=driving&key=${env_1.envVars.GOOGLE_MAPS_API_KEY}`;
        const { data } = await axios_1.default.get(url);
        if (data.status === "OK" && data.routes.length > 0) {
            const distanceMeters = data.routes[0].legs[0].distance.value;
            return distanceMeters / 1000; // convert meters to km
        }
        // fallback for international routes
        return (0, haversineDistance_1.haversineDistance)(from, to);
    }
    catch (err) {
        console.error("Error calculating distance:", err);
        return (0, haversineDistance_1.haversineDistance)(from, to);
    }
};
exports.calculateDistanceInKm = calculateDistanceInKm;
