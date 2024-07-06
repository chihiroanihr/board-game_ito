import crypto from 'crypto';

import { roomIdConfig, userIdConfig } from '@bgi/shared';

/**
 * Generates a random room ID using predefined configuration limits. The ID length is adjusted to be within 6 to 64 characters,
 * ensuring it follows the constraints set in roomIdConfig. The generated ID is a capitalized hexadecimal string.
 *
 * @returns {string} A string representing the random room ID, formatted as a capitalized hexadecimal string to meet length requirements.
 */
export function generateRandomRoomId(): string {
  // Make sure to have more than 6 letters and less than 64 letters
  let numLetters: number = roomIdConfig.numLetters;
  numLetters = Math.max(6, Math.min(64, numLetters));

  // Generate random string of length given
  const randomBytes: Buffer = crypto.randomBytes(numLetters / 2); // Divide by 2 since the resulting string length will be twice the number of bytes generated
  const randomId: string = randomBytes.toString('hex').toUpperCase(); // .slice(0, numLetters);

  return randomId;
}

/**
 * Creates a random user ID within specified length constraints (6 to 64 characters) as defined in userIdConfig.
 * The function generates a hexadecimal string of the appropriate length to serve as the user ID.
 *
 * @returns {string} A hexadecimal string representing the random user ID, adjusted to specified length constraints.
 */
export function generateRandomUserId(): string {
  // Make sure to have more than 6 letters and less than 64 letters
  let numLetters: number = userIdConfig.numLetters;
  if (numLetters <= 6) {
    numLetters = 6;
  } else if (numLetters >= 64) {
    numLetters = 64;
  }

  // Generate random string of length given
  const randomBytes: Buffer = crypto.randomBytes(numLetters / 2); // Divide by 2 since the resulting string length will be twice the number of bytes generated
  const randomId: string = randomBytes.toString('hex'); // .slice(0, numLetters);

  return randomId;
}

// export function generateRandomRoomId() {
//   const characters = roomIdConfig.characters;

//   // Make sure to have more than 6 letters and less than 64 letters
//   let numLetters = roomIdConfig.numLetters;
//   if (numLetters <= 6) {
//     numLetters = 6;
//   } else if (numLetters >= 64) {
//     numLetters = 64;
//   }

//   // Generate random string of length given
//   let randomId = "";
//   for (let i = 0; i < numLetters; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     randomId += characters.charAt(randomIndex);
//   }

//   return randomId;
// }

// export function generateRandomUserId() {
//   // Function to generate random string
//   const getRandomChar = () => {
//     const characters = userIdConfig.characters;
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     return characters.charAt(randomIndex);
//   };

//   // Make sure to have more than 6 letters and less than 64 letters
//   let numLetters = userIdConfig.numLetters;
//   if (numLetters <= 6) {
//     numLetters = 6;
//   } else if (numLetters >= 64) {
//     numLetters = 64;
//   }

//   // Generate random string of length given
//   const randomString = Array.from({ length: numLetters }, getRandomChar).join(
//     ""
//   );

//   // Divide strings into segments with "-"
//   const numSegLetters = userIdConfig.numSegLetters;
//   const numSegment = Math.ceil(numLetters / numSegLetters);
//   let randomId = "";
//   for (let i = 0; i < randomString.length; i++) {
//     if (i !== 0 && i % numSegment === 0 && i !== randomString.length - 1) {
//       randomId += "-";
//     }
//     randomId += randomString[i];
//   }

//   return randomId;
// }
