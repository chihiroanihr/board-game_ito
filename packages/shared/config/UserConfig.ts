interface UserIdConfig {
  numLetters: number;
  numSegLetters: number;
  characters: string;
}

export const userIdConfig: UserIdConfig = {
  numLetters: 12,
  numSegLetters: 3,
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
};
