/**
 * Background location tracking task for Expo.
 * Uses Expo TaskManager and Location APIs to monitor and handle location updates.
 * Tracks distance moved and logs it for debugging or tracking purposes.
 * @module
 */
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as geolib from "geolib";

/**
 * Task name identifier for the background location tracking task.
 * Used to register and reference the background task across the app.
 * @constant {string}
 */
export const LOCATION_TASK_NAME = "background-location-task";

let lastLocation = null;

/**
 * Defines the background task for handling location updates.
 * Processes incoming location data and logs the distance moved from the last recorded location.
 * Utilizes geolib to compute distance deltas.
 *
 * @function
 * @param {Object} param - Task event object
 * @param {Location.LocationData} param.data - Background location data
 * @param {Error} param.error - Error encountered during task execution, if any
 */
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error("Background location error:", error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (!location) return;

    const { latitude, longitude } = location.coords;

    if (lastLocation) {
      const distance = geolib.getDistance(lastLocation, { latitude, longitude });
      console.log(`(BG) Distance delta: ${distance}m`);
    }

    lastLocation = { latitude, longitude };
  }
});