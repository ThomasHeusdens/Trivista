/**
 * A platform-agnostic hook to persist and retrieve values from secure or local storage,
 * designed to work seamlessly across web and mobile environments in a React Native + Expo app.
 * 
 * On iOS/Android: Uses Expo's SecureStore to store sensitive data securely.
 * 
 * @returns A tuple:
 *    - [boolean, value]: The first value indicates loading status.
 *    - A setter function to update the stored value.
 */
import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { Platform } from "react-native";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

/**
 * useAsyncState is a small utility hook that wraps a reducer to simulate
 * async state loading behavior. It returns a tuple of [isLoading, value].
 *
 * @template T Type of the stored value
 * @param initialValue Initial loading state and value
 * @returns [isLoading, value] tuple
 */
function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null]
): UseStateHook<T> {
  return React.useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null
    ): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

/**
 * Persists a value to the appropriate storage method depending on platform.
 *
 * @param key The key under which the value is stored
 * @param value The string value to store, or null to remove it
 */
export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

/**
 * useStorageState retrieves a value from persistent storage (SecureStore or localStorage)
 * and gives you a setter function to update it. Automatically handles platform differences.
 *
 * @param key Key used to identify the stored value
 * @returns [isLoading, value], setValue — similar to useState but with async storage sync
 */
export function useStorageState(key: string): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  React.useEffect(() => {
    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          setState(localStorage.getItem(key));
        }
      } catch (e) {
        console.error("Local storage is unavailable:", e);
      }
    } else {
      SecureStore.getItemAsync(key).then((value) => {
        setState(value);
      });
    }
  }, [key]);

  // Set
  const setValue = React.useCallback(
    (value: string | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key]
  );

  return [state, setValue];
}