import React, { useState, useRef } from 'react';
import {
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Logout, MeetingRoom, Settings } from '@mui/icons-material';

import { NamespaceEnum } from '@bgi/shared';

import { IconButtonStyled, RoomSettingForm } from '@/components';
import {
  useAuth,
  useRoom,
  useAction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
  useSubmissionStatus,
} from '@/hooks';

const commonButtonStyle = {
  bgcolor: 'primary.main',
  color: 'background.default',
  '&:hover': {
    bgcolor: 'primary.dark', // Background color on hover
  },
};

/**
 * Layout for Dashboard
 * @returns
 */
export default function HeaderLayout() {
  const { user } = useAuth();
  const { room } = useRoom();
  const { isSubmitting } = useSubmissionStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [triggeredButton, setTriggeredButton] = useState<NamespaceEnum>();

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Dialog open / close handlers
  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  // Callback for button click handlers
  const onError: ErrorCallbackFunction = ({ message }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {
    setTriggeredButton(action); // Set which button was triggered

    // If triggered button is "edit-room" then close dialog
    if (action && action === NamespaceEnum.EDIT_ROOM) {
      dialogOpen && handleDialogClose();
    }
  };

  // Button click handlers
  const { handleEditRoom, handleLeaveRoom, handleLogout, loadingButton } = useAction({
    onSuccess,
    onError,
  });

  if (!user) return null;
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Leave Game Button */}
        <IconButtonStyled
          onClick={handleLogout}
          loading={loadingButton && triggeredButton === NamespaceEnum.LOGOUT}
          tooltipTitle="Exit Game"
          tooltipProps={{ placement: 'top' }}
          sx={{
            ...commonButtonStyle,
            // transform: 'scaleX(-1)',
          }}
        >
          <Logout />
        </IconButtonStyled>

        {/* Leave Room Button */}
        {room && (
          <IconButtonStyled
            onClick={handleLeaveRoom}
            loading={loadingButton && triggeredButton === NamespaceEnum.LEAVE_ROOM}
            tooltipTitle="Leave This Room"
            tooltipProps={{ placement: 'top' }}
            sx={commonButtonStyle}
          >
            <MeetingRoom />
          </IconButtonStyled>
        )}

        <Typography variant="h5" component="h3">
          Hello, <b>{user.name}</b>
        </Typography>
      </Stack>

      {/* Edit Room Button */}
      {room && (
        <>
          <IconButtonStyled
            onClick={handleDialogOpen}
            loading={loadingButton && triggeredButton === NamespaceEnum.EDIT_ROOM}
            tooltipTitle="Edit Room Configuration"
            tooltipProps={{ placement: 'top' }}
            sx={commonButtonStyle}
          >
            <Settings />
          </IconButtonStyled>

          {/* Form Modal */}
          <Dialog open={dialogOpen} onClose={handleDialogClose} scroll="body">
            <DialogTitle>Edit Game Room Setting</DialogTitle>

            <DialogContent sx={{ paddingTop: '20px !important' }}>
              {/* Place RoomSettingForm inside DialogContent */}
              <RoomSettingForm ref={submitBtnRef} onSubmit={handleEditRoom} isInsideModal />
            </DialogContent>

            <DialogActions>
              <Button onClick={handleDialogClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={() => submitBtnRef.current?.click()} disabled={isSubmitting}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  );
}
