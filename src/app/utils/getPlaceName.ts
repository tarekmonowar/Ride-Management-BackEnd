import axios from "axios";
import { envVars } from "../config/env";

export const getPlaceName = async (
  lat: number,
  lng: number,
): Promise<string> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${envVars.GOOGLE_MAPS_API_KEY}`;
    const { data } = await axios.get(url);
    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else if (data.status !== "OK") {
      console.warn("Geocoding error:", data.status, data.error_message);
    }
    return "Unknown location";
  } catch (err) {
    console.error("Geocoding failed:", err);
    return "Unknown location";
  }
};
