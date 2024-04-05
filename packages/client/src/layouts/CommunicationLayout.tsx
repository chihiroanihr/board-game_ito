import React, { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

import {
  NamespaceEnum,
  CommunicationMethodEnum,
  type RoomChatMessage,
  type ReceiveChatResponse,
} from '@bgi/shared';

import { VoiceLayout } from '@/layouts';
import { ChatContent, ChatPopover, ChatPopper } from '@/components';
import {
  useRoom,
  useSocket,
  useAction,
  usePageVisibility,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
} from '@/hooks';

const CommunicationLayout = () => {
  const theme = useTheme();
  const { socket } = useSocket();
  const { room } = useRoom();
  const isVisible = usePageVisibility();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg')); // boolean
  const isSmViewport = useMediaQuery(theme.breakpoints.up('sm'));

  const [allMessages, setAllMessages] = useState<RoomChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<RoomChatMessage[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null); // or HTMLElement -> sets if popover / popper is opened or not
  const [isChatButtonLoading, setIsChatButtonLoading] = useState<boolean>(false); // Custom loading button only for chat
  const [triggerScroll, setTriggerScroll] = useState<RoomChatMessage[] | boolean>(allMessages);

  const communicationMethod = room?.setting.communicationMethod;

  // Popper toggle (open / close) handler
  const handleTogglePopper = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Popover open / close handlers
  const handleTogglePopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = () => {
    setIsChatButtonLoading(true);
  };
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {
    setIsChatButtonLoading(false);
  };
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {
    setIsChatButtonLoading(false);
  };

  // Button click handlers
  const { handleSendChat, errorMessage } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

  // Close popper and popover when viewport changes
  useEffect(() => {
    setAnchorEl(null);
  }, [isLgViewport, isSmViewport]);

  /**
   * New chat message arrives
   */
  useEffect(() => {
    async function onReceiveChatEvent(messageData: ReceiveChatResponse) {
      // If user is on the screen / chat popover is opened
      if ((isLgViewport && isVisible) || (Boolean(anchorEl) && isVisible)) {
        setAllMessages((prevMessages) => [...prevMessages, messageData]); // Add to array of messages
        setTriggerScroll(allMessages); // scroll down to message
      }
      // If user is away from screen / chat popover is closed
      else {
        setUnreadMessages((prevMessages) => [...prevMessages, messageData]); // Add to array of unread messages
      }
    }

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.RECEIVE_CHAT, onReceiveChatEvent);
    return () => {
      socket.off(NamespaceEnum.RECEIVE_CHAT, onReceiveChatEvent);
    };
  }, [socket, allMessages, anchorEl, isVisible, isLgViewport]);

  /**
   * Every render
   */
  useEffect(() => {
    // If user on the screen / chat popover is opened
    if ((isLgViewport && isVisible) || (Boolean(anchorEl) && isVisible)) {
      // If there was unread messages
      if (unreadMessages.length > 0) {
        setAllMessages((prevMessages) => [...prevMessages, ...unreadMessages]); // Add all unread messages to read messages
        setUnreadMessages([]); // Empty unread messages (initialize)
        setTriggerScroll(false); // Do not scroll down for unread messages
      }
      // If no new messages meantime
      else {
        setTriggerScroll(allMessages); // If messages exists and not yet scrolled down then scroll down
      }
    }
  }, [allMessages, unreadMessages, anchorEl, isLgViewport, isVisible]);

  return (
    <>
      {/* ------------------------- Chat ------------------------- */}
      {communicationMethod === CommunicationMethodEnum.CHAT &&
        (isLgViewport ? (
          <ChatContent
            allMessages={allMessages}
            onSubmit={handleSendChat}
            errorMessage={errorMessage}
            isButtonLoading={isChatButtonLoading}
            triggerScroll={triggerScroll}
          />
        ) : isSmViewport ? (
          // Popper Button (Screen > sm)
          <ChatPopper
            anchorEl={anchorEl}
            isOpen={Boolean(anchorEl)}
            handleToggle={handleTogglePopper}
          >
            <ChatContent
              allMessages={allMessages}
              onSubmit={handleSendChat}
              errorMessage={errorMessage}
              isButtonLoading={isChatButtonLoading}
              triggerScroll={triggerScroll}
              isInModal={true}
            />
          </ChatPopper>
        ) : (
          // Popover Button (Screen > 0)
          <ChatPopover
            anchorEl={anchorEl}
            isOpen={Boolean(anchorEl)}
            handleToggle={handleTogglePopover}
          >
            <ChatContent
              allMessages={allMessages}
              onSubmit={handleSendChat}
              errorMessage={errorMessage}
              isButtonLoading={isChatButtonLoading}
              triggerScroll={triggerScroll}
              isInModal={true}
            />
          </ChatPopover>
        ))}

      {/* ------------------------- Mic ------------------------- */}
      {communicationMethod === CommunicationMethodEnum.MIC && <VoiceLayout />}
    </>
  );
};

export default CommunicationLayout;

/* <Fab
    component="button"
    color="primary"
    aria-describedby={Boolean(anchorEl) ? 'chat-popover' : undefined}
    aria-label="chat"
    onClick={handleOpenPopover}
  >
    {communicationMethod === CommunicationMethodEnum.CHAT && <ChatIcon />}
    {communicationMethod === CommunicationMethodEnum.MIC && <MicIcon />}
  </Fab> */
