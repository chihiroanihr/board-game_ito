/**
 * Logs and returns a new Error instance with additional context appended to the original error message.
 * This function is designed to enhance error reporting by including a custom message alongside the original error details.
 *
 * @param {any} error - The original error caught during execution. This can be of any type, but if it's an instance of Error, its message will be used.
 * @param {string | null} [addMessage=null] - An optional message to provide additional context about the error. This message is prepended to the original error's message.
 * @returns {Error} A new Error instance with a message that combines the additional context and the original error's message. This error is also logged to the console.
 */
export const handleServerError = (
  error: any,
  functionName: string | null = null,
  addMessage: string | null = null
): Error => {
  // Create a new error instance with the concatenated error message
  const newError = new Error(
    `[Server Error]: ${addMessage}\n` + functionName &&
      `Error in ${functionName}: \n` +
        `${error instanceof Error ? error.message : String(error)}`
  );

  /** @/debug */
  if (process.env.NODE_ENV !== "production") console.error(newError);

  // In case.
  return newError;
};

/**
 * Enhances and rethrows an DB error with additional context, including the name of the function where the error occurred and an optional additional message.
 *
 * @param {any} error - The original error (from database query execution) that was caught. Can be of any type, but if it's an instance of Error, its message and stack trace will be used.
 * @param {string} functionName - The name of the function where the error occurred. This is used to provide context in the new error message.
 * @param {string | null} [addMessage=null] - An optional additional message to include in the error message for more context.
 * @returns {Error} A new Error instance with an enhanced message that includes the original error's message (if available), the function name, and the optional additional message.
 */
export const handleDBError = (
  error: any,
  functionName: string,
  addMessage: string | null = null
): Error => {
  // Create a new error instance with the concatenated error message
  const newError = new Error(
    `[DB Error]: ${addMessage}\n
    Error in ${functionName}: \n
    ${error instanceof Error ? error.message : String(error)}`
  );

  // Preserve the stack trace of the original error
  newError.stack = error.stack;

  // Return the new error
  return newError;
};
