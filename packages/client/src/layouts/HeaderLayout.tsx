import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
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

import {
  type RoomSetting,
  type RoomEditedResponse,
  type LogoutResponse,
  type EditRoomResponse,
  type LeaveRoomResponse,
  type AdminChangedResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { IconButton, RoomSettingForm, RoomSettingViewer, SnackbarRoomEdited } from '@/components';
import {
  useSocket,
  useAuth,
  useRoom,
  useGame,
  usePreFormSubmission,
  useSubmissionStatus,
} from '@/hooks';
import {
  navigateHome,
  navigateDashboard,
  outputServerError,
  outputResponseTimeoutError,
} from '@/utils';
import { RoomEditedActionEnum, type SnackbarRoomEditedInfoType } from '../enum';
import { commonIconButtonStyle } from '../theme';

/**
 * Layout for Dashboard
 * @returns
 */
export default function HeaderLayout() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, discardUser } = useAuth();
  const { room, updateRoom, discardRoom } = useRoom();
  const { game, discardGame } = useGame();
  const { isSubmitting } = useSubmissionStatus();
  const { loadingButton, processPreFormSubmission } = usePreFormSubmission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [triggeredButton, setTriggeredButton] = useState<NamespaceEnum>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarRoomEditedInfo, setSnackbarRoomEditedInfo] =
    useState<SnackbarRoomEditedInfoType>(undefined);
  const [snackbars, setSnackbars] = React.useState<readonly SnackbarRoomEditedInfoType[]>([]);

  // When back button pressed (https://reactrouter.com/en/6.22.3/hooks/use-blocker)
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP');

  const isAdmin = !!(user?._id === room?.roomAdmin);

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Dialog open / close handlers
  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  // Snackbar handlers
  const handleSnackbarOpen = () => setSnackbarOpen(true);
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleSnackbarExited = () => setSnackbarRoomEditedInfo(undefined);

  // Consecutive snackbars (multiple snackbars without stacking them): (https://mui.com/material-ui/react-snackbar/#consecutive-snackbars)
  useEffect(() => {
    // Set a new snack when we don't have an active one
    if (snackbars.length && !snackbarRoomEditedInfo) {
      setSnackbarRoomEditedInfo(snackbars[0]);
      setSnackbars((prev) => prev.slice(1));
      handleSnackbarOpen();
    }
    // Close an active snack when a new one is added
    else if (snackbars.length && snackbarRoomEditedInfo && snackbarOpen) {
      handleSnackbarClose();
    }
  }, [snackbarOpen, snackbarRoomEditedInfo, snackbars]);

  /**
   * Handler for editing room setting (inside game waiting room).
   * @param formData
   */
  const handleEditRoom = (formData: RoomSetting) => {
    processPreFormSubmission(true);
    snackbarOpen && handleSnackbarClose(); // Make sure to close all snackbars that are opened

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.EDIT_ROOM,
      formData,
      async ({ error, room: updatedRoom }: EditRoomResponse) => {
        clearTimeout(timeoutId);

        // ERROR
        if (error) {
          outputServerError({ error });
        }
        // SUCCESS
        else {
          setTriggeredButton(NamespaceEnum.EDIT_ROOM); // Set which button was triggered
          updateRoom(updatedRoom ? updatedRoom : null); // Update room info to local storage
          handleDialogClose(); // close dialog
          // Store snackbar info for snackbar notification + Add to snackbar queue
          setSnackbars((prev) => [
            ...prev,
            {
              key: new Date().getTime(),
              // player: undefined,
              status: RoomEditedActionEnum.EDIT,
            },
          ]);
        }

        processPreFormSubmission(false);
      }
    );
  };

  /**
   * Handler for leaving game room.
   */
  const handleLeaveRoom = () => {
    processPreFormSubmission(true);
    snackbarOpen && handleSnackbarClose(); // Make sure to close all snackbars that are opened

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LEAVE_ROOM, async ({ error }: LeaveRoomResponse) => {
      clearTimeout(timeoutId);

      // ERROR
      if (error) {
        outputServerError({ error });
      }
      // SUCCESS
      else {
        setTriggeredButton(NamespaceEnum.LEAVE_ROOM); // Set which button was triggered
        game && discardGame();
        room && discardRoom();
        navigateDashboard(navigate);
      }

      processPreFormSubmission(false);
    });
  };

  /**
   * Handler for user logging out of the game.
   */
  const handleLogout = () => {
    processPreFormSubmission(true); // Set submitting to true when the request is initiated
    snackbarOpen && handleSnackbarClose(); // Make sure to close all snackbars that are opened

    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LOGOUT, async ({ error }: LogoutResponse) => {
      clearTimeout(timeoutId);

      // ERROR
      if (error) {
        outputServerError({ error });
      }
      // SUCCESS
      else {
        setTriggeredButton(NamespaceEnum.LOGOUT); // Set which button was triggered
        game && discardGame();
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate
      }

      processPreFormSubmission(false);
    });
  };

  // When room setting is edited by admin
  useEffect(() => {
    async function onRoomEditedEvent({ room }: RoomEditedResponse) {
      updateRoom(room); // Update room in the local storage first
      // Store snackbar info for snackbar notification + Add to snackbar queue
      setSnackbars((prev) => [
        ...prev,
        {
          key: new Date().getTime(),
          // player: undefined,
          status: RoomEditedActionEnum.EDIT,
        },
      ]);
    }

    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.ROOM_EDITED, onRoomEditedEvent);
    return () => {
      socket.off(NamespaceEnum.ROOM_EDITED, onRoomEditedEvent);
    };
  }, [socket, updateRoom]);

  // When room admin is changed by previous room admin
  useEffect(() => {
    async function onAdminChangedEvent({ user, room }: AdminChangedResponse) {
      updateRoom(room); // Update room in the local storage first
      // Store new admin and snackbar info for snackbar notification + Add to snackbar queue
      setSnackbars((prev) => [
        ...prev,
        {
          key: new Date().getTime(),
          player: user,
          status: RoomEditedActionEnum.ADMIN,
        },
      ]);
    }

    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.ADMIN_CHANGED, onAdminChangedEvent);
    return () => {
      socket.off(NamespaceEnum.ADMIN_CHANGED, onAdminChangedEvent);
    };
  }, [socket, updateRoom]);

  if (!user) return null;
  return (
    <>
      <Stack direction="row" flexGrow={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={{ xs: '0.75rem', md: '1rem' }}>
          {/* Leave Game Button */}
          <IconButton
            onClick={handleLogout}
            loading={loadingButton && triggeredButton === NamespaceEnum.LOGOUT}
            tooltipProps={{ title: 'Exit Game', placement: 'top' }}
            sx={{
              ...commonIconButtonStyle,
              // transform: 'scaleX(-1)',
            }}
          >
            <LogoutIcon />
          </IconButton>

          {/* Leave Room Button */}
          {room && (
            <IconButton
              onClick={handleLeaveRoom}
              loading={loadingButton && triggeredButton === NamespaceEnum.LEAVE_ROOM}
              tooltipProps={{ title: 'Leave This Room', placement: 'top' }}
              sx={commonIconButtonStyle}
            >
              <MeetingRoomIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div">
            Hello, <b>{user.name}</b>
          </Typography>
        </Stack>

        {/* Edit Room Button (only admin can configure this) */}
        {room && (
          <>
            <IconButton
              onClick={handleDialogOpen}
              loading={loadingButton && triggeredButton === NamespaceEnum.EDIT_ROOM}
              tooltipProps={{
                title: isAdmin ? 'Edit Game Room Setting' : 'View Game Room Setting',
                placement: 'top',
                // ...(user._id !== room.roomAdmin && { bgColor: 'grey.500' }),
              }}
              sx={commonIconButtonStyle}
            >
              {isAdmin ? <SettingsIcon /> : <VisibilityIcon />}
            </IconButton>

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
                  <Button
                    sx={{ fontWeight: 600 }}
                    onClick={handleDialogClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    sx={{ fontWeight: 600 }}
                    variant="contained"
                    disableElevation
                    onClick={() => submitBtnRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </DialogActions>
              )}
            </Dialog>
          </>
        )}
      </Stack>

      {/* Room setting modified by admin notification */}
      <SnackbarRoomEdited
        open={snackbarOpen}
        isAdmin={isAdmin}
        snackbarInfo={snackbarRoomEditedInfo}
        onClose={handleSnackbarClose}
        onExited={handleSnackbarExited}
      />

      {/* Dialog before leaving (press back button) */}
      <Dialog id="waiting_before-leave_dialog" open={blocker.state === 'blocked'}>
        <DialogTitle>Are you sure you want to leave?</DialogTitle>
        <DialogActions>
          {/* No need of blocker.proceed?.() as handleLeaveRoom() automatically redirects */}
          <Button onClick={() => blocker.reset?.()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleLeaveRoom} disabled={isSubmitting}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
