import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

import type { LogoutResponse, LeaveRoomResponse, EditRoomResponse, RoomSetting } from '@bgi/shared';

import { IconButtonStyled, RoomSettingForm } from '@/components';
import { useAuth, useRoom, useSocket, useSubmissionStatus } from '@/hooks';
import {
  navigateHome,
  navigateDashboard,
  outputServerError,
  outputResponseTimeoutError,
} from '@/utils';

const commonButtonStyle = {
  bgcolor: 'primary.main',
  color: 'background.default',
  '&:hover': {
    bgcolor: 'primary.dark', // Background color on hover
  },
};

const enum ButtonIdEnum {
  EDIT_ROOM = 'editRoomButton',
  LEAVE_ROOM = 'leaveRoomButton',
  LOGOUT = 'logoutButton',
}

/**
 * Layout for Dashboard
 * @returns
 */
export default function HeaderLayout() {
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { user, discardUser } = useAuth();
  const { room, updateRoom, discardRoom } = useRoom();
  const { isSubmitting, setIsSubmitting } = useSubmissionStatus();

  const [loadingButton, setLoadingButton] = useState<ButtonIdEnum | undefined>(); // Track the active (clicked) button
  const [dialogOpen, setDialogOpen] = useState(false);

  const submitBtnRef = useRef<HTMLButtonElement>();

  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const processButtonStatus = (status: boolean, buttonId?: ButtonIdEnum) => {
    setLoadingButton(buttonId);
    setIsSubmitting(status);
  };

  const handleEditRoom = (formData: RoomSetting) => {
    processButtonStatus(true, ButtonIdEnum.EDIT_ROOM); // Disable all buttons and make target button loading

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false); // Set submitting to false when error happens
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('edit-room', formData, async ({ error, room }: EditRoomResponse) => {
      clearTimeout(timeoutId); // Clear the timeout as response is received before timeout

      if (error) {
        // setErrorMessage('Internal Server Error: Please try again.');
        outputServerError({ error });
      } else {
        updateRoom(room ? room : null); // Update room info to local storage
        setDialogOpen(false); // Close dialog
      }

      processButtonStatus(false); // Set submitting to false when the response or error is received
    });
  };

  const handleLeaveRoom = () => {
    processButtonStatus(true, ButtonIdEnum.LEAVE_ROOM); // Set submitting to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false); // Set submitting to false when error happens
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('leave-room', async ({ error }: LeaveRoomResponse) => {
      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        discardRoom();
        navigateDashboard(navigate);
      }

      processButtonStatus(false); // Set submitting to false when the response or error is received
    });
  };

  const handleLogout = () => {
    processButtonStatus(true, ButtonIdEnum.LOGOUT); // Set submitting to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false); // Set submitting to false when error happens
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('logout', async ({ error }: LogoutResponse) => {
      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate
      }

      processButtonStatus(false); // Set submitting to false when the response or error is received
    });
  };

  if (!user) return null;
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Leave Game Button */}
        <IconButtonStyled
          onClick={handleLogout}
          loading={loadingButton === ButtonIdEnum.LOGOUT}
          tooltipProps={{ title: 'Exit Game', placement: 'top' }}
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
            loading={loadingButton === ButtonIdEnum.LEAVE_ROOM}
            tooltipProps={{ title: 'Leave This Room', placement: 'top' }}
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
            loading={loadingButton === ButtonIdEnum.EDIT_ROOM}
            tooltipProps={{ title: 'Edit Room Configuration', placement: 'top' }}
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
