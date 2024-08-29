/**
 * Checks if a given object is empty.
 *
 * The function checks if the object has no keys and if its constructor is Object,
 * which means it's a plain JavaScript object.
 *
 * An object is considered empty if it has no own enumerable properties and its constructor is `Object`.
 * This function does not consider properties in the object's prototype chain.
 *
 * [Note]: Record<string, any> is a TypeScript type that represents an object with string keys and values of any type.
 *
 * @param {Record<string, unknown>} obj - The object to check for emptiness. It should be a plain JavaScript object.
 * @returns {boolean} - `true` if the object is empty, `false` otherwise.
 */
export const isObjectEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

export const convertStringToNumber = (value: string | number) => {
  if (typeof value === 'number') return value;
  return parseInt(value);
};

export const convertStringToBoolean = (value: string | boolean) => {
  if (typeof value === 'boolean') return value;
  return value === 'true';
};

export const computeRelativeTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();

  // Get the time components of the given timestamp
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Calculate the time difference in milliseconds
  const timeDifference = now.getTime() - date.getTime();
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);

  // Convert the time to a relative format based on the time difference
  if (timeDifferenceInMinutes < 60) {
    // Less than an hour ago
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  } else if (timeDifferenceInMinutes < 24 * 60) {
    // Less than a day ago
    return `Yesterday, ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  } else {
    // More than a day ago
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}, ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  }
};

/**
 * Logs a server error to the console and displays an alert to the user.
 *
 * This function is intended to be used when an error is returned to a client which is caught
 * during server communication or any operation that could result in a server error.
 * It logs a detailed error message to the console and displays a generic error alert to the user.
 *
 * @param {unknown} error - The error object caught during the operation. It should contain an error message.
 * @param {string | undefined} message - An optional custom message to provide additional context about the error. Default is an empty string.
 */
export const outputServerError = (error: unknown, message?: string): void => {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error(
    `[Server Error]: ${message ? ` ${message}` : ''}${errorMessage ? `\n${errorMessage}` : ''}`
  );
  /** @todo - no alert */
  alert('Internal Server Error: Please try again later.');
};

/**
 * Logs a timeout error to the console and displays an alert to the user.
 *
 * This function should be used when a request fails to complete within a specified timeout period.
 * It serves to inform the developer and the user that a request has taken too long to respond,
 * indicating potential issues with the server or network.
 */
export const outputResponseTimeoutError = (): void => {
  console.error('[Timeout Error]: The request could not be completed within 5 seconds.');
  alert('[Timeout Error]: The request could not be completed within 5 seconds.');
};
