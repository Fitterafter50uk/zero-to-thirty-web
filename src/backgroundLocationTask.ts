import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const BACKGROUND_LOCATION_TASK =
  'zero-to-thirty-background-location';

const GPS_STATE_KEY =
  'zero_to_thirty_background_gps_state';

type GpsState = {
  active: boolean;
  counting: boolean;
  distanceKm: number;
  lastLatitude: number | null;
  lastLongitude: number | null;
};

function calculateDistanceKm(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number
) {
  const earthRadiusKm = 6371;

  const lat1 =
    (firstLatitude * Math.PI) / 180;

  const lat2 =
    (secondLatitude * Math.PI) / 180;

  const deltaLat =
    ((secondLatitude - firstLatitude) *
      Math.PI) /
    180;

  const deltaLon =
    ((secondLongitude - firstLongitude) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.log(
        'BACKGROUND GPS ERROR:',
        error
      );
      return;
    }

    if (!data) {
      return;
    }

    try {
      const savedState =
        await AsyncStorage.getItem(
          GPS_STATE_KEY
        );

      if (!savedState) {
        return;
      }

      const state: GpsState =
        JSON.parse(savedState);

      if (!state.active) {
        return;
      }

      const locations =
        (
          data as {
            locations?: Location.LocationObject[];
          }
        ).locations;

      if (
        !locations ||
        locations.length === 0
      ) {
        return;
      }

      for (const location of locations) {
        const accuracy =
          location.coords.accuracy;

        if (
          accuracy !== null &&
          accuracy > 50
        ) {
          continue;
        }

        const latitude =
          location.coords.latitude;

        const longitude =
          location.coords.longitude;

        /*
         * We only add distance while the
         * current programme interval is RUN.
         */
        if (!state.counting) {
          state.lastLatitude = null;
          state.lastLongitude = null;
          continue;
        }

        if (
          state.lastLatitude === null ||
          state.lastLongitude === null
        ) {
          state.lastLatitude = latitude;
          state.lastLongitude = longitude;
          continue;
        }

        const segmentKm =
          calculateDistanceKm(
            state.lastLatitude,
            state.lastLongitude,
            latitude,
            longitude
          );

        if (
          segmentKm > 0 &&
          segmentKm <= 0.2
        ) {
          state.distanceKm +=
            segmentKm;
        }

        state.lastLatitude = latitude;
        state.lastLongitude = longitude;
      }

      await AsyncStorage.setItem(
        GPS_STATE_KEY,
        JSON.stringify(state)
      );
    } catch (taskError) {
      console.log(
        'Could not process background GPS:',
        taskError
      );
    }
  }
);