import React, {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ForwardRefRenderFunction,
} from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, Box } from '@mui/material';

import {
  type RoomSetting,
  type AvailableThemeLanguageData,
  roomSettingConfig,
  CommunicationMethodEnum,
  LanguageEnum,
} from '@bgi/shared';

import { TextButton, RoomSettingFormContent } from '@/components';
import { convertStringToBoolean, convertStringToNumber, outputServerError } from '@/utils';

interface RoomSettingFormProps {
  roomSetting: RoomSetting;
  onSubmit: (data: RoomSetting) => void;
  isLoading?: boolean;
  isInsideModal?: boolean;
  children?: React.ReactNode;
}

type RoomSettingWithoutLanguage = Omit<RoomSetting, 'language'> & {
  language: LanguageEnum | string;
};

const formDefaultValues: RoomSettingWithoutLanguage = {
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
  const [usedLanguages, setUsedLanguages] = useState<AvailableThemeLanguageData[]>([]);

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

  /**
   * @function handleFormSubmit
   * @description Handle form submit
   * @param data - The data to be submitted
   */
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

  /**
   * Fetch available languages from the server
   */
  useEffect(() => {
    const fetchAvailableLanguages = async () => {
      try {
        // Fetch data
        const response = await fetch(`${import.meta.env.VITE_SERVER_HOST_URL}/api/languages`);
        // ERROR (network response error)
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        // SUCCESS
        const data = await response.json();

        // Update default language value if the original default language value is not in data
        // if (
        //   data[0] &&
        //   data.some(
        //     (lang: { language: LanguageEnum }) => lang.language !== formDefaultValues.language
        //   )
        // ) {
        //   formDefaultValues.language = data[0].language;
        // }

        // // Filter the LanguageEnum entries based on the conditions from data
        // const filteredLanguages = Object.entries(LanguageEnum).filter(([key, value]) => {
        //   // Find a language in data that matches the value and has a count >= 40
        //   const matchedLanguage = data.find(
        //     (lang: AvailableThemeLanguageData) => lang.language === value && lang.count >= 40
        //   );
        //   // If a match is found, include it in the filtered array
        //   return !!matchedLanguage;
        // });

        setUsedLanguages(data);
      } catch (error) {
        // ERROR (server error)
        outputServerError(error);
      }
    };

    fetchAvailableLanguages();
  }, []);

  /**
   * @function filteredLanguages
   * @description Filter the LanguageEnum entries based on the conditions from usedLanguages
   * @returns An array of filtered LanguageEnum entries [key, value]
   */
  const filteredLanguages: [string, LanguageEnum][] = useMemo(() => {
    return Object.entries(LanguageEnum).filter(([, value]) => {
      // Find a language in usedLanguages that matches the value and has a count >= 40
      const matchedLanguage = usedLanguages.find(
        (lang) => lang.language === value && lang.count >= 40
      );
      // If a match is found, include it in the filtered array
      return !!matchedLanguage;
    });
  }, [usedLanguages]);

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
            <RoomSettingFormContent control={control} languageChoices={filteredLanguages} />
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
