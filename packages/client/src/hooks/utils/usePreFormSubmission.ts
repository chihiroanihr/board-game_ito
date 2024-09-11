import { useState } from 'react';

import { useSubmissionStatus } from '@/hooks';

export default function usePreFormSubmission() {
  const { setIsSubmitting } = useSubmissionStatus();

  const [loadingButton, setLoadingButton] = useState<boolean | undefined>();
  const [formErrorMessage, setFormErrorMessage] = useState<string>('');

  const processPreFormSubmission = (status: boolean) => {
    setLoadingButton(status);
    setIsSubmitting(status);
  };

  return {
    loadingButton,
    formErrorMessage,
    setFormErrorMessage,
    processPreFormSubmission,
  };
}
