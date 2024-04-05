import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  MeetingRoom as MeetingRoomIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { NamespaceEnum, type RoomEditedResponse } from '@bgi/shared';

import {
  IconButtonStyled,
  RoomSettingForm,
  RoomSettingViewer,
  SnackbarRoomEdited,
} from '@/components';
import {
  useSocket,
  useAuth,
  useRoom,
  useAction,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
  useSubmissionStatus,
} from '@/hooks';
import { commonIconButtonStyle } from '../theme';

/**
 * Layout for Dashboard
 * @returns
 */
export default function HeaderLayout() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { room, updateRoom } = useRoom();
  const { isSubmitting } = useSubmissionStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [triggeredButton, setTriggeredButton] = useState<NamespaceEnum>();

  const isAdmin = !!(user?._id === room?.createdBy);

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Dialog open / close handlers
  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const handleSnackbarOpen = () => setSnackbarOpen(true);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = () => {
    snackbarOpen && handleSnackbarClose(); // Make sure to close all snackbars that are opened
  };
  const onError: ErrorCallbackFunction = ({ message }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {
    setTriggeredButton(action); // Set which button was triggered

    // If triggered button is "edit-room" then close dialog
    if (action && action === NamespaceEnum.EDIT_ROOM) {
      handleDialogClose();
      handleSnackbarOpen();
    }
  };

  // Button click handlers
  const { handleEditRoom, handleLeaveRoom, handleLogout, loadingButton } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

  // When room setting is edited by admin
  useEffect(() => {
    async function onRoomEditedEvent({ room }: RoomEditedResponse) {
      updateRoom(room); // Update room in the local storage first
      handleSnackbarOpen(); // Open snackbar to give notification that room has changed
    }

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.ROOM_EDITED, onRoomEditedEvent);
    return () => {
      socket.off(NamespaceEnum.ROOM_EDITED, onRoomEditedEvent);
    };
  }, [socket, updateRoom]);

  if (!user) return null;
  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Leave Game Button */}
          <IconButtonStyled
            onClick={handleLogout}
            loading={loadingButton && triggeredButton === NamespaceEnum.LOGOUT}
            tooltipProps={{ title: 'Exit Game', placement: 'top' }}
            sx={{
              ...commonIconButtonStyle,
              // transform: 'scaleX(-1)',
            }}
          >
            <LogoutIcon />
          </IconButtonStyled>

          {/* Leave Room Button */}
          {room && (
            <IconButtonStyled
              onClick={handleLeaveRoom}
              loading={loadingButton && triggeredButton === NamespaceEnum.LEAVE_ROOM}
              tooltipProps={{ title: 'Leave This Room', placement: 'top' }}
              sx={commonIconButtonStyle}
            >
              <MeetingRoomIcon />
            </IconButtonStyled>
          )}

          <Typography variant="h5" component="h3">
            Hello, <b>{user.name}</b>
          </Typography>
        </Stack>

        {/* Edit Room Button (only admin can configure this) */}
        {room && (
          <>
            <IconButtonStyled
              onClick={handleDialogOpen}
              loading={loadingButton && triggeredButton === NamespaceEnum.EDIT_ROOM}
              tooltipProps={{
                title: isAdmin ? 'Edit Game Room Setting' : 'View Game Room Setting',
                placement: 'top',
                // ...(user._id !== room.createdBy && { bgColor: 'grey.500' }),
              }}
              sx={commonIconButtonStyle}
            >
              {isAdmin ? <SettingsIcon /> : <VisibilityIcon />}
            </IconButtonStyled>

            {/* Form Modal */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} scroll="body">
              <DialogTitle>{isAdmin ? 'Edit Game Room Setting' : 'Game Room Setting'}</DialogTitle>

              <DialogContent sx={{ paddingTop: '20px !important' }}>
                {/* Place RoomSettingForm inside DialogContent */}
                {isAdmin ? (
                  // Admin can edit room setting modal
                  <RoomSettingForm
                    ref={submitBtnRef}
                    roomSetting={room.setting}
                    onSubmit={handleEditRoom}
                    isInsideModal
                  />
                ) : (
                  // Other players can only view room setting modal
                  <RoomSettingViewer roomSetting={room.setting} />
                )}
              </DialogContent>

              {isAdmin && (
                <DialogActions>
                  <Button onClick={handleDialogClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={() => submitBtnRef.current?.click()} disabled={isSubmitting}>
                    Save
                  </Button>
                </DialogActions>
              )}
            </Dialog>
          </>
        )}
      </Stack>

      {/* Room setting modified by admin notification */}
      <SnackbarRoomEdited open={snackbarOpen} onClose={handleSnackbarClose} isAdmin={isAdmin} />
    </>
  );
}
