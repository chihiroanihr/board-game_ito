import React, { createContext, useState, useContext, useMemo } from 'react';

// Create a context
interface SubmissionStatusContextType {
  isSubmitting: boolean;
  setIsSubmitting: (status: boolean) => void;
}

const SubmissionStatusContext = createContext<SubmissionStatusContextType | undefined>(undefined);

// Define a Provider component
interface SubmissionStatusProviderProps {
  children: React.ReactNode;
}

export const SubmissionStatusProvider: React.FC<SubmissionStatusProviderProps> = ({ children }) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ isSubmitting, setIsSubmitting }), [isSubmitting]);

  return (
    <SubmissionStatusContext.Provider value={contextValue}>
      {children}
    </SubmissionStatusContext.Provider>
  );
};

// Custom hook to use submission status
export const useSubmissionStatus = (): SubmissionStatusContextType => {
  const context = useContext(SubmissionStatusContext);
  if (!context) {
    /** @todo - Handle error */
    throw new Error(
      'useSubmissionStatus() hook must be used within a <SubmissionStatusProvider />.'
    );
  }

  return context;
};
