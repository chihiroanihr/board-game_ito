export const userIdConfig = {
  numLetters: 12,
  // numSegLetters: 3,
  // characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
};

export const userNameConfig = {
  regex: new RegExp(String.raw`^\s*\S[\s\S]*$`),
  regexErrorMessage: 'Entered value cannot only contain spaces.',
  minLength: 2,
  minLengthErrorMessage: 'Name must be at least 2 characters long.',
  maxLength: 20,
  maxLengthErrorMessage: 'Name must be at most 20 characters long.',
};
