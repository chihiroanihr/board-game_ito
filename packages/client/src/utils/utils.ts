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
 * @param {Record<string, any>} obj - The object to check for emptiness. It should be a plain JavaScript object.
 * @returns {boolean} - `true` if the object is empty, `false` otherwise.
 */
export const isObjectEmpty = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Logs a server error to the console and displays an alert to the user.
 *
 * This function is intended to be used when an error is returned to a client which is caught
 * during server communication or any operation that could result in a server error.
 * It logs a detailed error message to the console and displays a generic error alert to the user.
 *
 * @param {any} error - The error object caught during the operation. It should contain an error message.
 * @param {string | undefined} message - An optional custom message to provide additional context about the error. Default is an empty string.
 */
export const outputServerError = (error: unknown, message?: string): void => {
  console.error(`[Server Error]: ${message ? ` ${message}` : ''} \n${error.message}`);
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
