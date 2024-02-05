import { useState } from "react";

// To maintain the user’s state even after a page refresh
// This hook synchronizes the state value with the browser’s local storage.

export const useLocalStorage = (keyName, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // If key already exists in local storage
      const value = window.localStorage.getItem(keyName);
      if (value) {
        return JSON.parse(value); // store existing value
      }
      // If key does not exist in local storage
      else {
        window.localStorage.setItem(keyName, JSON.stringify(defaultValue)); // store key value
        window.dispatchEvent(new Event("storage")); // fire an storage event after value change
        return defaultValue;
      }
    } catch (error) {
      // Error storing to local storage
      console.log(error);
      return defaultValue;
    }
  });

  // Handler to modify state value
  const handleSetValue = (newValue) => {
    try {
      // Set new key to local storage
      window.localStorage.setItem(keyName, JSON.stringify(newValue)); // store key value
    } catch (error) {
      // Error storing to local storage
      console.log(error);
    }
    // Store it as state
    setStoredValue(newValue);
  };

  // Return state variable + handler to modify state
  return [storedValue, handleSetValue];
};
