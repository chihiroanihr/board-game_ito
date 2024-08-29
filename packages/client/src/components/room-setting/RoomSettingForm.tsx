import React, { forwardRef, type ForwardRefRenderFunction } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, Box } from '@mui/material';

import { type RoomSetting, roomSettingConfig, CommunicationMethodEnum } from '@bgi/shared';

import { TextButton, RoomSettingFormContent } from '@/components';
import { convertStringToBoolean, convertStringToNumber } from '@/utils';

interface RoomSettingFormProps {
  roomSetting: RoomSetting;
  onSubmit: (data: RoomSetting) => void;
  isLoading?: boolean;
  isInsideModal?: boolean;
  children?: React.ReactNode;
}

const formDefaultValues: RoomSetting = {
  /** @todo - dynamically set language based on user's application locale. If locale not supported, set English as default. */
  language: roomSettingConfig.language.defaultLanguage,
  numRound: roomSettingConfig.numRound.defaultRounds,
  answerThemeTime: roomSettingConfig.answerThemeTime.defaultSeconds,
  answerNumberTime: roomSettingConfig.answerNumberTime.defaultSeconds,
  heartEnabled: true,
  dupNumCard: false,
  communicationMethod: CommunicationMethodEnum.MIC,
};

/**
 * @function RoomSettingForm
 * @description This component is used to display and handle room setting form.
 * @param roomSetting - The initial room setting data.
 * @param onSubmit - The function to call when the form is submitted.
 * @param isLoading - If true, the submit button will be in loading state.
 * @param isInsideModal - If true, the form will be wrapped in a Card component (modal).
 * @param children - The content of the submit button. Default is "Submit".
 * @param rest - Other props to be passed to the form element.
 * @returns React component
 */
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
            <RoomSettingFormContent control={control} />
          </CardContent>
        </Card>
      ) : (
        // If inside modal, do not wrap the form with anything
        <RoomSettingFormContent control={control} inModal={true} />
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

export default forwardRef(RoomSettingForm);
