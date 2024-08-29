import React, { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

import {
  type RoomChatMessage,
  type SendChatResponse,
  type ReceiveChatResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { ChatContent, ChatPopover, ChatPopper, VoiceButton } from '@/components';
import { useSocket, useAuth, usePreFormSubmission, usePageVisibility } from '@/hooks';
import { outputServerError, outputResponseTimeoutError } from '@/utils';
import { type SendChatFormDataType } from '../enum.js';

const ChatLayout = () => {
  const theme = useTheme();
  const { socket } = useSocket();
  const { user } = useAuth();
  const isVisible = usePageVisibility();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg')); // boolean
  const isSmViewport = useMediaQuery(theme.breakpoints.up('sm'));

  const [allMessages, setAllMessages] = useState<RoomChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<RoomChatMessage[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null); // or HTMLElement -> sets if popover / popper is opened or not
  const [isChatButtonLoading, setIsChatButtonLoading] = useState<boolean>(false); // Custom loading button only for chat
  const [triggerScroll, setTriggerScroll] = useState<RoomChatMessage[] | boolean>(allMessages);

  // Popper toggle (open / close) handler
  const handleTogglePopper = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Popover open / close handlers
  const handleTogglePopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Button click handlers
  const { formErrorMessage, setFormErrorMessage, processPreFormSubmission } =
    usePreFormSubmission();

  /**
   * Handler for sending chat message.
   * (NO SHARED LOADING BUTTON)
   * @param data
   * @returns
   */
  const handleSendChat = (data: SendChatFormDataType) => {
    setFormErrorMessage(''); // Reset error message
    setIsChatButtonLoading(true);

    const message = data.message.trim(); // Trim any start/end spaces
    // ERROR
    if (!message) {
      setFormErrorMessage('Please enter a message.');
      setIsChatButtonLoading(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      outputResponseTimeoutError();
      // ERROR
      setIsChatButtonLoading(false);
    }, 5000);

    const chatData: RoomChatMessage = {
      fromUser: user,
      message: message,
      timestamp: Date.now(),
    };

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.SEND_CHAT, chatData, async ({ error }: SendChatResponse) => {
      clearTimeout(timeoutId);

      // ERROR
      if (error) {
        outputServerError(error);
        setIsChatButtonLoading(false);
      }
      // SUCCESS
      else {
        setIsChatButtonLoading(false);
      }

      processPreFormSubmission(false);
    });
  };

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

    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.RECEIVE_CHAT, onReceiveChatEvent);
    return () => {
      socket.off(NamespaceEnum.RECEIVE_CHAT, onReceiveChatEvent);
    };
  }, [allMessages, anchorEl, isLgViewport, isVisible, socket]);

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
  }, [allMessages, anchorEl, isLgViewport, isVisible, unreadMessages]);

  return isLgViewport ? (
    <ChatContent
      allMessages={allMessages}
      onSubmit={handleSendChat}
      errorMessage={formErrorMessage}
      isButtonLoading={isChatButtonLoading}
      triggerScroll={triggerScroll}
    />
  ) : isSmViewport ? (
    // Popper Button (Screen > sm)
    <ChatPopper
      numNotif={unreadMessages.length}
      anchorEl={anchorEl}
      isOpen={Boolean(anchorEl)}
      handleToggle={handleTogglePopper}
    >
      <ChatContent
        allMessages={allMessages}
        onSubmit={handleSendChat}
        errorMessage={formErrorMessage}
        isButtonLoading={isChatButtonLoading}
        triggerScroll={triggerScroll}
        isInModal={true}
      />
    </ChatPopper>
  ) : (
    // Popover Button (Screen > 0)
    <ChatPopover
      numNotif={unreadMessages.length}
      anchorEl={anchorEl}
      isOpen={Boolean(anchorEl)}
      handleToggle={handleTogglePopover}
    >
      <ChatContent
        allMessages={allMessages}
        onSubmit={handleSendChat}
        errorMessage={formErrorMessage}
        isButtonLoading={isChatButtonLoading}
        triggerScroll={triggerScroll}
        isInModal={true}
      />
    </ChatPopover>
  );
};

export default ChatLayout;
