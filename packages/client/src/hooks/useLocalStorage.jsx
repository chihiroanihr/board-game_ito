import { useState } from "react";

// To maintain the user’s state even after a page refresh
// This hook synchronizes the state value with the browser’s local storage.

export const useLocalStorage = (keyName, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
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
        window.localStorage.setItem(keyName, JSON.stringify(defaultValue)); // store newß key value

        /** @todo - When local storage manually changes */
        // window.dispatchEvent(new Event("storage")); // fire an storage event after value change

        // [2] Return the stored value as state variable
        return defaultValue;
      }
    } catch (error) {
      console.log(error);
      return defaultValue; // No local storage, only store as state variable
    }
  });

  // Handler (setter) to modify state value
  const handleSetValue = (newValue) => {
    try {
      // [1] Set new value to local storage
      window.localStorage.setItem(keyName, JSON.stringify(newValue));
    } catch (error) {
      console.log(error);
    }

    // [2] Store it as state variable
    setStoredValue(newValue);
  };

  // Return state variable + handler to modify state
  return [storedValue, handleSetValue];
};
