import React from 'react';
import { Controller, type Control } from 'react-hook-form';
import {
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  RadioGroup,
  Radio,
  ToggleButtonGroup,
  Box,
} from '@mui/material';
import { Help, Mic, Chat } from '@mui/icons-material';

import {
  type RoomSetting,
  roomSettingConfig,
  CommunicationMethodEnum,
  LanguageEnum,
} from '@bgi/shared';

import { TooltipStyled, TextFieldWithIcon, ToggleButtonWithIcon } from '@/components';

interface RoomSettingFormContentProps {
  control: Control<RoomSetting, unknown>;
  languageChoices: [string, LanguageEnum][];
  inModal?: boolean;
}

/**
 * @function RoomSettingFormContent
 * @description Form content for RoomSettingForm
 * @param control - react-hook-form
 * @param languageChoices - available languages for the game, used in language select option
 * @param inModal - whether the form is inside modal
 * @returns React component
 */
const RoomSettingFormContent: React.FC<RoomSettingFormContentProps> = ({
  control,
  languageChoices,
  inModal,
}) => {
  /**
   * @function validateNumberInput
   * @description Validate the number input
   * @param value - The value to be validated
   * @returns The error message if validation fails, or true if validation passes
   */
  const validateNumberInput = (value: { toString: () => string }) => {
    if (!value) return 'Please enter a number.'; // Check if the field is empty
    if (!/^[1-9]\d*$/.test(value.toString())) return 'Please enter a valid number.'; // Check if it's only integer
    return true; // Return true if validation passes
  };

  /* ---------------------------- JSX ---------------------------- */

  const GameLanguageLabel = () => (
    <Box display="flex" justifyContent="center" alignItems="center">
      Game language
      <TooltipStyled title={roomSettingConfig.language.helperText} placement="right">
        <Help fontSize="small" sx={{ ml: 0.5 }} />
      </TooltipStyled>
    </Box>
  );

  return (
    <Stack direction="column" spacing={4}>
      {/* Select Option */}
      <FormControl>
        <InputLabel id="language-label">
          <GameLanguageLabel />
        </InputLabel>
        <Controller
          name="language"
          control={control}
          rules={{
            required: true,
            //   validate: {
            //     isSupportedLocale: (value) =>
            //       isSupportedLocale(value) || 'Selected language is not supported.',
            //   },
          }}
          render={({ field, fieldState: { error } }) => (
            <>
              <Select
                {...field}
                labelId="language-label"
                id="language"
                label={<GameLanguageLabel />}
                error={!!error}
                disabled={inModal}
                fullWidth
                size="small"
                {...(inModal && { value: field.value })}
                // MenuProps={MenuProps}
              >
                {inModal ? (
                  <MenuItem value={field.value}>{field.value}</MenuItem>
                ) : (
                  languageChoices?.map(([key, value]) => (
                    <MenuItem
                      key={key}
                      value={value}
                      sx={{ fontWeight: field.value === value ? 'bold' : 'normal' }}
                    >
                      {value}
                    </MenuItem>
                  ))
                )}
              </Select>
              {error && (
                <FormHelperText
                  style={{
                    marginTop: '4px',
                    marginLeft: '14px',
                    marginRight: '14px',
                  }}
                  sx={{ color: 'error.main' }}
                >
                  {error.message}
                </FormHelperText>
              )}
            </>
          )}
        />
        {inModal ? (
          <FormHelperText sx={{ m: 0, mt: 1, lineHeight: 1.4, color: 'warning.light' }}>
            Editing game language is disabled in active game waiting rooms.
            <br />
            Please create a new room to modify this setting.
          </FormHelperText>
        ) : (
          <FormHelperText sx={{ m: 0, mt: 1, lineHeight: 1.4, color: 'warning.light' }}>
            Choose carefully, as this setting cannot be edited after room creation.
          </FormHelperText>
        )}
      </FormControl>

      {/* Text Field 1 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="numRound"
          control={control}
          rules={{
            validate: validateNumberInput,
            min: {
              value: roomSettingConfig.numRound.minRounds,
              message: roomSettingConfig.numRound.minRoundsErrorMessage,
            },
            max: {
              value: roomSettingConfig.numRound.maxRounds,
              message: roomSettingConfig.numRound.maxRoundsErrorMessage,
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextFieldWithIcon
              {...field}
              id="numRound"
              type="number"
              label={
                <>
                  Number of Rounds
                  <TooltipStyled title={roomSettingConfig.numRound.helperText} placement="right">
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error ? error.message : null}
              fullWidth
              size="small"
            />
          )}
        />
        {/** @todo: Mobile version form helper text: <FormHelperText>{roomSettingConfig.numRound.helperText}</FormHelperText> */}
      </Stack>

      {/* Text Field 2 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="answerThemeTime"
          control={control}
          rules={{
            validate: validateNumberInput,
            min: {
              value: roomSettingConfig.answerThemeTime.minSeconds,
              message: roomSettingConfig.answerThemeTime.minSecondsErrorMessage,
            },
            max: {
              value: roomSettingConfig.answerThemeTime.maxSeconds,
              message: roomSettingConfig.answerThemeTime.maxSecondsErrorMessage,
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextFieldWithIcon
              {...field}
              id="answerThemeTime"
              type="number"
              label={
                <>
                  Answer Theme Time
                  <TooltipStyled
                    title={roomSettingConfig.answerThemeTime.helperText}
                    placement="right"
                  >
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error ? error.message : null}
              fullWidth
              size="small"
            />
          )}
        />
      </Stack>

      {/* Text Field 3 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="answerNumberTime"
          control={control}
          rules={{
            validate: validateNumberInput,
            min: {
              value: roomSettingConfig.answerNumberTime.minSeconds,
              message: roomSettingConfig.answerNumberTime.minSecondsErrorMessage,
            },
            max: {
              value: roomSettingConfig.answerNumberTime.maxSeconds,
              message: roomSettingConfig.answerNumberTime.maxSecondsErrorMessage,
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextFieldWithIcon
              {...field}
              id="answerNumberTime"
              type="number"
              label={
                <>
                  Answer Number Time
                  <TooltipStyled
                    title={roomSettingConfig.answerNumberTime.helperText}
                    placement="right"
                  >
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error ? error.message : null}
              fullWidth
              size="small"
            />
          )}
        />
      </Stack>

      <Stack direction="column" spacing={2}>
        {/* Radio Buttons 1 */}
        <FormControl>
          <FormLabel id="heartEnabled_radio-buttons-group">
            <FormHelperText sx={{ margin: 0 }}>
              {roomSettingConfig.heartEnabled.label}
            </FormHelperText>

            <Controller
              name="heartEnabled"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} aria-labelledby="heartEnabled_radio-buttons-group" row>
                  <FormControlLabel
                    value={true}
                    label={roomSettingConfig.heartEnabled.radioTrue} // "Enabled"
                    control={<Radio size="small" />}
                  />
                  <FormControlLabel
                    value={false}
                    label={roomSettingConfig.heartEnabled.radioFalse} // "Disabled"
                    control={<Radio size="small" />}
                  />
                </RadioGroup>
              )}
            />
          </FormLabel>
        </FormControl>

        {/* Radio Buttons 2 */}
        <FormControl>
          <FormLabel id="dupNumCard_radio-buttons-group">
            <FormHelperText sx={{ margin: 0 }}>{roomSettingConfig.dupNumCard.label}</FormHelperText>

            <Controller
              name="dupNumCard"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} aria-labelledby="dupNumCard_radio-buttons-group" row>
                  <FormControlLabel
                    value={true}
                    label={roomSettingConfig.dupNumCard.radioTrue} // "Enabled"
                    control={<Radio size="small" />}
                  />
                  <FormControlLabel
                    value={false}
                    label={roomSettingConfig.dupNumCard.radioFalse} // "Disabled"
                    control={<Radio size="small" />}
                  />
                </RadioGroup>
              )}
            />
          </FormLabel>
        </FormControl>

        {/* Toggle Button 1 */}
        <FormControl>
          <FormLabel id="communicationMethod_toggle-buttons-group">
            <FormHelperText sx={{ m: 0 }}>
              {roomSettingConfig.communicationMethod.label}
            </FormHelperText>
            <Controller
              name="communicationMethod"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  {...field}
                  aria-labelledby="communicationMethod_toggle-buttons-group"
                  exclusive
                  disabled={inModal} // Disable this form if inModal === true
                  size="small"
                  fullWidth
                  sx={{ marginTop: '9px' }}
                >
                  <ToggleButtonWithIcon value={CommunicationMethodEnum.MIC}>
                    <Mic fontSize="small" />
                    {roomSettingConfig.communicationMethod.radioMic}
                  </ToggleButtonWithIcon>
                  <ToggleButtonWithIcon value={CommunicationMethodEnum.CHAT}>
                    <Chat fontSize="small" />
                    {roomSettingConfig.communicationMethod.radioChat}
                  </ToggleButtonWithIcon>
                </ToggleButtonGroup>
              )}
            />
            {inModal ? (
              <FormHelperText sx={{ m: 0, mt: 1, lineHeight: 1.4, color: 'warning.light' }}>
                Editing communication methods is disabled in active game waiting rooms.
                <br />
                Please create a new room to modify this setting.
              </FormHelperText>
            ) : (
              <FormHelperText sx={{ m: 0, mt: 1, lineHeight: 1.4, color: 'warning.light' }}>
                Choose carefully, as this setting cannot be edited after room creation.
              </FormHelperText>
            )}
          </FormLabel>
        </FormControl>
      </Stack>
    </Stack>
  );
};

export default RoomSettingFormContent;
