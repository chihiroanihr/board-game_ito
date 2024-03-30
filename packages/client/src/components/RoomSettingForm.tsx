import React, { forwardRef, type ForwardRefRenderFunction } from 'react';
import {
  useForm,
  Controller,
  type UseFormRegister,
  type FieldErrors,
  type Control,
} from 'react-hook-form';
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

import {
  TextButtonStyled,
  TooltipStyled,
  TextFieldWithIcon,
  ToggleButtonWithIcon,
} from '@/components';
import { useRoom } from '@/hooks';

const formDefaultValues: RoomSetting = {
  numRound: roomSettingConfig.numRound.defaultRounds,
  answerThemeTime: roomSettingConfig.answerThemeTime.defaultSeconds,
  answerNumberTime: roomSettingConfig.answerNumberTime.defaultSeconds,
  heartEnabled: true,
  dupNumCard: false,
  communicationMethod: CommunicationMethodEnum.MIC,
};

interface RoomSettingFormProps {
  onSubmit: (data: RoomSetting) => void;
  isLoading?: boolean;
  isInsideModal?: boolean;
  children?: React.ReactNode;
}

const RoomSettingForm: ForwardRefRenderFunction<HTMLButtonElement, RoomSettingFormProps> = (
  { onSubmit, isLoading, isInsideModal, children },
  btnRef
) => {
  const { room } = useRoom();

  // Prepare react-hook-form
  const {
    register,
    control,
    handleSubmit,
    formState,
    formState: { errors },
    reset, // reset input form data
  } = useForm<RoomSetting>({
    defaultValues: room?.setting || formDefaultValues,
  });

  const handleFormSubmit = (data: RoomSetting) => {
    // Adjust / clean the type of form inputs
    const roomSettingData: RoomSetting = {
      ...data,
      // Convert string to boolean
      heartEnabled:
        typeof data.heartEnabled === 'boolean' ? data.heartEnabled : data.heartEnabled === 'true',
      dupNumCard:
        typeof data.dupNumCard === 'boolean' ? data.dupNumCard : data.dupNumCard === 'true',
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
    >
      {!isInsideModal ? (
        // If not inside modal, wrap the form in Card component
        <Card variant="outlined" sx={{ px: '2rem', py: '3rem', borderRadius: '0.8rem' }}>
          <CardContent sx={{ paddingTop: '9px' }}>
            <FormContent register={register} control={control} errors={errors} />
          </CardContent>
        </Card>
      ) : (
        // If inside modal, do not wrap the form with anything
        <FormContent register={register} control={control} errors={errors} />
      )}

      <TextButtonStyled
        ref={btnRef}
        type="submit"
        variant="contained"
        loading={isLoading}
        sx={{ display: isInsideModal && 'none' }} // If inside modal, submit button will belong to modal action
      >
        {children}
      </TextButtonStyled>
    </Box>
  );
};

interface FormContentProps {
  register: UseFormRegister<RoomSetting>;
  control: Control<RoomSetting, unknown>;
  errors: FieldErrors<RoomSetting>;
}

const FormContent: React.FC<FormContentProps> = ({ register, control, errors }) => {
  const validateNumberInput = (value: { toString: () => string }) => {
    if (!value) return 'Please enter a number.'; // Check if the field is empty
    if (!/^[1-9]\d*$/.test(value.toString())) return 'Please enter a valid number.'; // Check if it's only integer
    return true; // Return true if validation passes
  };

  return (
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
                <Help fontSize="small" />
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
              <TooltipStyled title={roomSettingConfig.answerThemeTime.helperText} placement="right">
                <Help fontSize="small" />
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
                <Help fontSize="small" />
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
          </FormLabel>
        </FormControl>

        {/* Radio Buttons 2 */}
        <FormControl>
          <FormLabel>
            <FormHelperText sx={{ margin: 0 }}>{roomSettingConfig.dupNumCard.label}</FormHelperText>

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
          </FormLabel>
        </FormControl>

        {/* Toggle Button 1 */}
        <FormControl>
          <FormLabel>
            <FormHelperText sx={{ margin: 0 }}>
              {roomSettingConfig.communicationMethod.label}
            </FormHelperText>

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
