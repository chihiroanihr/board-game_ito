interface RoomIdConfig {
  numLetters: number;
  letterRegex: string;
  // characters: string;
  placeholder: string;
  error_message: string;
}

export const roomIdConfig: RoomIdConfig = {
  numLetters: 8,
  letterRegex: "A-Z0-9", // or A-Za-z, or A-Za-z0-9
  // characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  placeholder: "ABCDEFGH",
  error_message: "Invalid Room ID. Must be 8 characters.",
};
