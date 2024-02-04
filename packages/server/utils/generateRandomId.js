import { roomIdConfig } from "@board-game-ito/shared";
import { userIdConfig } from "@board-game-ito/shared";

/**
 * @function - generate random room ID.
 * @returns - randomId: String
 */
export function generateRandomRoomId() {
  const characters = roomIdConfig.characters;

  // Make sure to have more than 6 letters and less than 64 letters
  let numLetters = roomIdConfig.numLetters;
  if (numLetters <= 6) {
    numLetters = 6;
  } else if (numLetters >= 64) {
    numLetters = 64;
  }

  // Generate random string of length given
  let randomId = "";
  for (let i = 0; i < numLetters; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters.charAt(randomIndex);
  }

  return randomId;
}

/**
 * @function - generate random user ID.
 * @returns - randomId: String
 */
export function generateRandomUserId() {
  // Function to generate random string
  const getRandomChar = () => {
    const characters = userIdConfig.characters;
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters.charAt(randomIndex);
  };

  // Make sure to have more than 6 letters and less than 64 letters
  let numLetters = userIdConfig.numLetters;
  if (numLetters <= 6) {
    numLetters = 6;
  } else if (numLetters >= 64) {
    numLetters = 64;
  }

  // Generate random string of length given
  const randomString = Array.from({ length: numLetters }, getRandomChar).join(
    ""
  );

  // Divide strings into segments with "-"
  const numSegLetters = userIdConfig.numSegLetters;
  const numSegment = Math.ceil(numLetters / numSegLetters);
  let randomId = "";
  for (let i = 0; i < randomString.length; i++) {
    if (i !== 0 && i % numSegment === 0 && i !== randomString.length - 1) {
      randomId += "-";
    }
    randomId += randomString[i];
  }

  return randomId;
}
