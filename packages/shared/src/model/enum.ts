// Enum for player's status
export enum UserStatusEnum {
  IDLE = 'idle',
  PENDING = 'pending',
  PLAYING = 'playing',
}

// Enum for room status
export enum RoomStatusEnum {
  VOID = 'void',
  AVAILABLE = 'available',
  FULL = 'full',
  PLAYING = 'playing',
}

export enum CommunicationMethodEnum {
  MIC = 'mic',
  CHAT = 'chat',
}

export enum GameRoundStatusEnum {
  PENDING = 'pending',
  PLAYING = 'playing',
  SUCCESS = 'success',
  FAIL = 'fail',
}

export enum LanguageEnum {
  ENG = 'English',
  FRA = 'French',
  SPA = 'Spanish',
  GER = 'German',
  ITA = 'Italian',
  CHI = 'Chinese',
  JPN = 'Japanese',
  KOR = 'Korean',
  RUS = 'Russian',
  POR = 'Portuguese',
  ARA = 'Arabic',
  HIN = 'Hindi',
  BEN = 'Bengali',
  TUR = 'Turkish',
  VIE = 'Vietnamese',
  THA = 'Thai',
  DUT = 'Dutch',
  POL = 'Polish',
  HEB = 'Hebrew',
  ZHO = 'Chinese (Simplified)',
  ZHS = 'Chinese (Traditional)',
  // Add more languages as needed
}
