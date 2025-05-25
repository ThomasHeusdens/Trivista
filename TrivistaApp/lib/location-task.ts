import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as geolib from "geolib";

export const LOCATION_TASK_NAME = "background-location-task";

let lastLocation = null;

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