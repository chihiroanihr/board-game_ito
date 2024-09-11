import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FormHelperText, List, Stack, Box, TextField } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

import { type RoomChatMessage } from '@bgi/shared';

import { MessageItem, ScrollController, IconButton } from '@/components';
import { commonIconButtonStyle } from '../../theme';
import { type SendChatFormDataType } from '../../enum';

const CHAT_CORNER_RADIUS = '0.25rem';
const CHAT_MODAL_HEIGHT = '50vh';

interface ChatContentProps {
  allMessages: RoomChatMessage[];
  onSubmit: (data: SendChatFormDataType) => void;
  isButtonLoading: boolean;
  errorMessage: string;
  isInModal?: boolean;
  triggerScroll: RoomChatMessage[] | boolean;
}

const ChatContent: React.FC<ChatContentProps> = ({
  allMessages,
  onSubmit,
  isButtonLoading,
  errorMessage,
  isInModal,
  triggerScroll,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isSubmitSuccessful, isDirty },
  } = useForm<SendChatFormDataType>();

  // If errorMessage available, then assign errorMessage to react-hook-form field error
  if (errorMessage) {
    setError('message', { type: 'required', message: 'Message cannot be empty' });
  }

  const handleFormSubmit = (formData: SendChatFormDataType) => {
    // Call the onSubmit function with submitted data
    onSubmit(formData);

    // If submit successful
    if (isSubmitSuccessful) {
      reset(); // Reset form to default value.
    }
  };

  return (
    <Stack
      direction="column"
      flexGrow={1}
      {...(isInModal
        ? { height: CHAT_MODAL_HEIGHT }
        : {
            border: '2px solid',
            borderColor: 'grey.300',
            borderBottom: 0,
          })}
    >
      <ScrollController triggerScroll={triggerScroll}>
        <List
          id="chat-content_message-list"
          dense={true}
          sx={{
            paddingX: '0.5rem',
            paddingY: '0.25rem',
            wordBreak: 'break-word',
          }}
        >
          {allMessages.map((msgData) => (
            <MessageItem key={msgData.timestamp} {...msgData} />
          ))}
        </List>
      </ScrollController>

      {/* Input Form + Submit Button */}
      <Stack
        id="chat-content_send_wrapper"
        component="form"
        onSubmit={handleSubmit(handleFormSubmit)}
        direction="row"
        {...(!isInModal && {
          border: '1.5px solid',
          borderTop: 0,
          borderColor: 'grey.300',
        })}
      >
        <Controller
          name="message"
          control={control}
          defaultValue=""
          rules={{ required: true }}
          render={({ field, fieldState: { error } }) => (
            <Box position="relative" width="100%">
              <TextField
                {...field}
                variant="outlined"
                label="Type your message"
                InputProps={{
                  sx: {
                    borderRadius: 0,
                    ...(isInModal && { borderBottomLeftRadius: CHAT_CORNER_RADIUS }),
                  },
                }}
                // Validation error or other form error
                error={!!error}
                fullWidth
              />
              {error && (
                <FormHelperText
                  component="span"
                  error={!!error}
                  sx={{ position: 'absolute', top: '-43%', right: 0 }}
                >
                  {error ? error.message : null}
                </FormHelperText>
              )}
            </Box>
          )}
        />

        {/* Submit Button */}
        <IconButton
          type="submit"
          loading={isButtonLoading || isSubmitting}
          disabled={!isDirty} // Disable button when form is not dirty or submitting
          sx={{
            minWidth: isInModal ? '50px' : '60px',
            borderRadius: 0,
            ...(isInModal && { borderBottomRightRadius: CHAT_CORNER_RADIUS }),
            ...commonIconButtonStyle,
          }}
        >
          <SendIcon fontSize={isInModal ? 'medium' : 'large'} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default ChatContent;
