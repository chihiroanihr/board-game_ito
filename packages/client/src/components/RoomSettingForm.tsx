import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  RadioGroup,
  Radio,
  ToggleButtonGroup,
  Box,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';

import { type RoomSetting, roomSettingConfig, CommunicationMethodEnum } from '@bgi/shared';

import { SubmitButton, TooltipStyled, TextFieldWithIcon, ToggleButtonWithIcon } from '@/components';

interface RoomSettingFormProps {
  onsubmit: (data: RoomSetting) => void;
  loading: boolean;
}

const formDefaultValues: RoomSetting = {
  numRound: roomSettingConfig.numRound.defaultRounds,
  answerThemeTime: roomSettingConfig.answerThemeTime.defaultSeconds,
  answerNumberTime: roomSettingConfig.answerNumberTime.defaultSeconds,
  heartEnabled: true,
  dupNumCard: false,
  communicationMethod: CommunicationMethodEnum.MIC,
};

const RoomSettingForm: React.FC<RoomSettingFormProps> = ({ onsubmit, loading }) => {
  // Prepare react-hook-form
  const {
    register,
    control,
    handleSubmit,
    formState,
    formState: { errors },
    reset,
  } = useForm<RoomSetting>({
    defaultValues: formDefaultValues,
  });

  // Reset form if submit successful
  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      reset();
    }
  }, [formState, reset]);

  const validateNumberInput = (value: { toString: () => string }) => {
    if (!value) return 'Please enter a number.'; // Check if the field is empty
    if (!/^[1-9]\d*$/.test(value.toString())) return 'Please enter a valid number.'; // Check if it's only integer
    return true; // Return true if validation passes
  };

  return (
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(onsubmit)}
      noValidate
    >
      <Card variant="outlined" sx={{ px: '2rem', py: '3rem', borderRadius: '0.8rem' }}>
        <CardContent sx={{ paddingTop: '9px' }}>
          <Stack direction="column" spacing={4}>
            {/* Field 1 */}
            <Stack direction="column" spacing={1}>
              <TextFieldWithIcon
                fullWidth
                id="numRound"
                type="number"
                label={
                  <>
                    Number of Rounds
                    <TooltipStyled title={roomSettingConfig.numRound.helperText} placement="right">
                      <HelpIcon fontSize="small" />
                    </TooltipStyled>
                  </>
                }
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                {...register('numRound', {
                  valueAsNumber: true,
                  validate: validateNumberInput,
                  min: {
                    value: roomSettingConfig.numRound.minRounds,
                    message: roomSettingConfig.numRound.minRoundsErrorMessage,
                  },
                  max: {
                    value: roomSettingConfig.numRound.maxRounds,
                    message: roomSettingConfig.numRound.maxRoundsErrorMessage,
                  },
                })}
                // Validation Error
                error={Boolean(errors.numRound)}
                helperText={errors.numRound?.message || ''}
              />
              {/** @todo: Mobile version form helper text: <FormHelperText>{roomSettingConfig.numRound.helperText}</FormHelperText> */}
            </Stack>

            {/* Field 2 */}
            <Stack direction="column" spacing={1}>
              <TextFieldWithIcon
                fullWidth
                id="answerThemeTime"
                type="number"
                label={
                  <>
                    Answer Theme Time
                    <TooltipStyled
                      title={roomSettingConfig.answerThemeTime.helperText}
                      placement="right"
                    >
                      <HelpIcon fontSize="small" />
                    </TooltipStyled>
                  </>
                }
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                {...register('answerThemeTime', {
                  valueAsNumber: true,
                  validate: validateNumberInput,
                  min: {
                    value: roomSettingConfig.answerThemeTime.minSeconds,
                    message: roomSettingConfig.answerThemeTime.minSecondsErrorMessage,
                  },
                  max: {
                    value: roomSettingConfig.answerThemeTime.maxSeconds,
                    message: roomSettingConfig.answerThemeTime.maxSecondsErrorMessage,
                  },
                })}
                // Validation Error
                error={Boolean(errors.answerThemeTime)}
                helperText={errors.answerThemeTime?.message || ''}
              />
            </Stack>

            {/* Field 3 */}
            <Stack direction="column" spacing={1}>
              <TextFieldWithIcon
                fullWidth
                id="answerNumberTime"
                type="number"
                label={
                  <>
                    Answer Number Time
                    <TooltipStyled
                      title={roomSettingConfig.answerNumberTime.helperText}
                      placement="right"
                    >
                      <HelpIcon fontSize="small" />
                    </TooltipStyled>
                  </>
                }
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                {...register('answerNumberTime', {
                  valueAsNumber: true,
                  validate: validateNumberInput,
                  min: {
                    value: roomSettingConfig.answerNumberTime.minSeconds,
                    message: roomSettingConfig.answerNumberTime.minSecondsErrorMessage,
                  },
                  max: {
                    value: roomSettingConfig.answerNumberTime.maxSeconds,
                    message: roomSettingConfig.answerNumberTime.maxSecondsErrorMessage,
                  },
                })}
                // Validation Error
                error={Boolean(errors.answerNumberTime)}
                helperText={errors.answerNumberTime?.message || ''}
              />
            </Stack>

            <Stack direction="column" spacing={2}>
              {/* Radio Buttons 1 */}
              <FormControl>
                <FormLabel>
                  <FormHelperText sx={{ margin: 0 }}>
                    {roomSettingConfig.heartEnabled.label}
                  </FormHelperText>
                </FormLabel>
                <Controller
                  name="heartEnabled"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field} row>
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
              </FormControl>

              {/* Radio Buttons 2 */}
              <FormControl>
                <FormLabel>
                  <FormHelperText sx={{ margin: 0 }}>
                    {roomSettingConfig.dupNumCard.label}
                  </FormHelperText>
                </FormLabel>
                <Controller
                  name="dupNumCard"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field} row>
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
              </FormControl>

              {/* Toggle Button 1 */}
              <FormControl>
                <FormLabel>
                  <FormHelperText sx={{ margin: 0 }}>
                    {roomSettingConfig.communicationMethod.label}
                  </FormHelperText>
                </FormLabel>
                <Controller
                  name="communicationMethod"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      {...field}
                      size="small"
                      fullWidth
                      exclusive
                      sx={{ marginTop: '9px' }}
                    >
                      <ToggleButtonWithIcon value={CommunicationMethodEnum.MIC}>
                        <MicIcon fontSize="small" />
                        {roomSettingConfig.communicationMethod.radioMic}
                      </ToggleButtonWithIcon>
                      <ToggleButtonWithIcon value={CommunicationMethodEnum.CHAT}>
                        <ChatIcon fontSize="small" />
                        {roomSettingConfig.communicationMethod.radioChat}
                      </ToggleButtonWithIcon>
                    </ToggleButtonGroup>
                  )}
                />
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <SubmitButton type="submit" variant="contained" loading={loading}>
        Create Room
      </SubmitButton>
    </Box>
  );
};

export default RoomSettingForm;
