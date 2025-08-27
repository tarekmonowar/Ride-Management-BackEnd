import axios from "axios";
import { envVars } from "../config/env";
import { haversineDistance } from "./haversineDistance";

interface LocationInput {
  lat: number;
  lng: number;
}

export const calculateDistanceInKm = async (
  from: LocationInput,
  to: LocationInput,
): Promise<number> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&mode=driving&key=${envVars.GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(url);

    if (data.status === "OK" && data.routes.length > 0) {
      const distanceMeters = data.routes[0].legs[0].distance.value;
      return distanceMeters / 1000; // convert meters to km
    }

    // fallback for international routes
    return haversineDistance(from, to);
  } catch (err) {
    console.error("Error calculating distance:", err);
    return haversineDistance(from, to);
  }
};
