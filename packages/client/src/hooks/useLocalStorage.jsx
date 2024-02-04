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
        window.localStorage.setItem(keyName, JSON.stringify(defaultValue));
        return defaultValue; // store original param's value
      }
    } catch (err) {
      return defaultValue; // store original param's value
    }
  });

  // Handler to modify state value
  const handleSetValue = (newValue) => {
    try {
      // Set new key to local storage
      window.localStorage.setItem(keyName, JSON.stringify(newValue));
    } catch (err) {
      console.log(err);
    }

    // Store it as state
    setStoredValue(newValue);
  };

  // Return state variable + handler to modify state
  return [storedValue, handleSetValue];
};
