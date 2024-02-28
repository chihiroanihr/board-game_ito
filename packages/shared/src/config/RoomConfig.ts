export const roomIdConfig = {
  numLetters: 8,
  regex: new RegExp(`^[A-Za-z0-9]{${8}}$`), // or A-Za-z, or A-Za-z0-9
  placeholder: 'ABCDEFGH',
  errorMessage: 'Invalid Room ID. Must be 8 characters.'
};

export const roomSettingConfig = {
  numRound: {
    helperText: 'Enter desired number of rounds.',
    defaultRounds: 10,
    minRounds: 4,
    minRoundsErrorMessage: `Must have at least ${4} game rounds.`,
    maxRounds: 10,
    maxRoundsErrorMessage: `Cannot exceed more than ${10} game rounds.`
  },
  thinkTimeTitle: {
    helperText: 'Enter thinking time for answering to the title card (in seconds).',
    defaultSeconds: 60,
    minSeconds: 30,
    minSecondsErrorMessage: `Must have at least ${30} seconds.`,
    maxSeconds: 90,
    maxSecondsErrorMessage: `Cannot exceed more than ${90} seconds.`
  },
  thinkTimePlayers: {
    helperText: 'Enter thinking time for players to direct placement of the card (in seconds).',
    defaultSeconds: 20,
    minSeconds: 10,
    minSecondsErrorMessage: `Must have at least ${10} seconds.`,
    maxSeconds: 30,
    maxSecondsErrorMessage: `Cannot exceed more than ${30} seconds.`
  },
  dupNumCard: {
    label: 'Allow score card duplicate between rounds:',
    radioTrue: 'Enabled',
    radioFalse: 'Disabled'
  }
};
