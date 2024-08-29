import { useCallback, useState } from 'react';

// To maintain the user’s state even after a page refresh
// This hook synchronizes the state value with the browser’s local storage.
export default function useLocalStorage<T>(
  keyName: string,
  defaultValue: T
): [T, (newValue: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // * If key already exists in local storage

      // [1] Retrieve value from local storage
      const value = window.localStorage.getItem(keyName);
      // [2] Return the stored value as state variable
      if (value) {
        return JSON.parse(value);
      }

      // * If key does not exist in local storage
      else {
        // [1] Store new key-value pairs to local storage
        window.localStorage.setItem(keyName, JSON.stringify(defaultValue)); // store new key value
        // [2] Return the stored value as state variable
        return defaultValue;
      }
    } catch (error) {
      /** @/debug */
      console.error(
        `Failed to read from / write to local storage: ${
          error instanceof Error ? error.message : error
        }`
      );

      return defaultValue; // No local storage, only store as state variable
    }
  });

  // Handler (setter) to modify state value
  const handleSetValue = useCallback(
    (newValue: T) => {
      try {
        // [1] Set new value to local storage
        window.localStorage.setItem(keyName, JSON.stringify(newValue));
        // [2] Store it as state variable
        setStoredValue(newValue);
      } catch (error) {
        /** @/debug */
        console.error(
          `Failed to read write to local storage: ${error instanceof Error ? error.message : error}`
        );
      }
    },
    [keyName]
  );

  // Return state variable + handler to modify state
  return [storedValue, handleSetValue];
}
