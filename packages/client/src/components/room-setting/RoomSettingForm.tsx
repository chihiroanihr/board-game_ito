import React, { forwardRef, type ForwardRefRenderFunction } from 'react';
import { useForm, Controller, type Control } from 'react-hook-form';
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
import { Help, Mic, Chat } from '@mui/icons-material';

import { type RoomSetting, roomSettingConfig, CommunicationMethodEnum } from '@bgi/shared';

import { TextButton, TooltipStyled, TextFieldWithIcon, ToggleButtonWithIcon } from '@/components';
import { convertStringToBoolean, convertStringToNumber } from '@/utils';

interface RoomSettingFormProps {
  roomSetting: RoomSetting;
  onSubmit: (data: RoomSetting) => void;
  isLoading?: boolean;
  isInsideModal?: boolean;
  children?: React.ReactNode;
}

const formDefaultValues: RoomSetting = {
  numRound: roomSettingConfig.numRound.defaultRounds,
  answerThemeTime: roomSettingConfig.answerThemeTime.defaultSeconds,
  answerNumberTime: roomSettingConfig.answerNumberTime.defaultSeconds,
  heartEnabled: true,
  dupNumCard: false,
  communicationMethod: CommunicationMethodEnum.MIC,
};

const RoomSettingForm: ForwardRefRenderFunction<HTMLButtonElement, RoomSettingFormProps> = (
  { roomSetting, onSubmit, isLoading, isInsideModal, children, ...rest },
  btnRef
) => {
  // Prepare react-hook-form
  const {
    control,
    handleSubmit,
    formState,
    reset, // reset input form data
  } = useForm<RoomSetting>({
    mode: 'onChange',
    defaultValues: roomSetting || formDefaultValues,
  });

  const handleFormSubmit = (data: RoomSetting) => {
    // Adjust / clean the type of form inputs
    const roomSettingData: RoomSetting = {
      ...data,
      // Convert string to number
      numRound: convertStringToNumber(data.numRound),
      answerThemeTime: convertStringToNumber(data.answerThemeTime),
      answerNumberTime: convertStringToNumber(data.answerNumberTime),
      // Convert string to boolean
      heartEnabled: convertStringToBoolean(data.heartEnabled),
      dupNumCard: convertStringToBoolean(data.dupNumCard),
    };

    // Call the onSubmit function with submitted data
    onSubmit(roomSettingData);

    // If submit successful
    if (formState.isSubmitSuccessful && !isInsideModal) {
      reset(); // Reset form to default value.
    }
  };

  return (
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      {...rest}
    >
      {!isInsideModal ? (
        // If not inside modal, wrap the form in Card component
        <Card variant="outlined" sx={{ px: '2rem', py: '3rem', borderRadius: '0.8rem' }}>
          <CardContent sx={{ paddingTop: '9px' }}>
            <FormContent control={control} />
          </CardContent>
        </Card>
      ) : (
        // If inside modal, do not wrap the form with anything
        <FormContent control={control} inModal={true} />
      )}

      <TextButton
        ref={btnRef}
        type="submit"
        variant="contained"
        loading={isLoading}
        sx={{ display: isInsideModal ? 'none' : undefined }} // If inside modal, submit button will belong to modal action
      >
        {children}
      </TextButton>
    </Box>
  );
};

interface FormContentProps {
  control: Control<RoomSetting, unknown>;
  inModal?: boolean;
}

const FormContent: React.FC<FormContentProps> = ({ control, inModal }) => {
  const validateNumberInput = (value: { toString: () => string }) => {
    if (!value) return 'Please enter a number.'; // Check if the field is empty
    if (!/^[1-9]\d*$/.test(value.toString())) return 'Please enter a valid number.'; // Check if it's only integer
    return true; // Return true if validation passes
  };

  return (
    <Stack direction="column" spacing={4}>
      {/* Field 1 */}
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

      {/* Field 2 */}
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

      {/* Field 3 */}
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
            {inModal ? (
              <FormHelperText sx={{ margin: 0, lineHeight: 1.4, color: 'warning.light' }}>
                Editing communication methods is disabled in active game waiting rooms.
                <br />
                Please create a new room to modify this setting.
              </FormHelperText>
            ) : (
              <>
                <FormHelperText sx={{ margin: 0 }}>
                  {roomSettingConfig.communicationMethod.label}
                </FormHelperText>
                <FormHelperText sx={{ margin: 0, lineHeight: 1.4, color: 'warning.light' }}>
                  Choose carefully, as this setting cannot be edited after room creation.
                </FormHelperText>
              </>
            )}

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
          </FormLabel>
        </FormControl>
      </Stack>
    </Stack>
  );
};

export default forwardRef(RoomSettingForm);
