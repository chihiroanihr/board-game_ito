import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stack, Box } from '@mui/material';

import { NewMessageButton } from '@/components';
import { useIntersectionObserver } from '@/hooks';

type TriggerScrollStateType<T = unknown> = T | boolean;

interface ScrollControllerProps<T> {
  triggerScroll: TriggerScrollStateType<T>;
  children: React.ReactNode;
}

// https://blog.bitsrc.io/building-a-scrollable-chat-box-with-react-b3848a4459fc
const ScrollController = <T,>({ triggerScroll, children }: ScrollControllerProps<T>) => {
  const chatOuterDivRef = useRef<HTMLDivElement>(null);
  const chatInnerDivRef = useRef<HTMLDivElement>(null);
  const prevInnerDivHeight = useRef<number | null>(null); // To track the height of the inner div between renders

  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [numNewMessages, setNumNewMessages] = useState<number>(0);

  // Automatically scroll to the bottom of the chat if new message arrived
  useEffect(() => {
    if (chatOuterDivRef.current && chatInnerDivRef.current) {
      const outerDivHeight = chatOuterDivRef.current.clientHeight;
      const innerDivHeight = chatInnerDivRef.current.clientHeight;
      const outerDivScrollTop = chatOuterDivRef.current.scrollTop; // Current scroll position of the messages

      // If new message arrived & inside screen / popover opened
      if (triggerScroll) {
        if (
          !prevInnerDivHeight.current || // If first render
          Math.abs(outerDivScrollTop - (prevInnerDivHeight.current - outerDivHeight)) < 50 // If a user scrolled to the bottom before the new message arrives
          // outerDivScrollTop === prevInnerDivHeight.current - outerDivHeight
        ) {
          // If so, scroll to the bottom of the message
          chatOuterDivRef.current.scrollTo({
            top: innerDivHeight! - outerDivHeight!,
            left: 0,
            // If first render, start the container at the bottom. Otherwise, scroll smoothly on change of children
            behavior: prevInnerDivHeight.current ? 'smooth' : 'auto',
          });
        }
        // If not, don't scroll to the bottom of the message, instead display button "scroll to bottom"
        else {
          setNumNewMessages((prevNum) => prevNum + 1);
          setShowScrollButton(true);
        }
      }
      // If new message arrived & away from screen / popover closed
      else {
        setNumNewMessages(0);
        setShowScrollButton(true);
      }

      prevInnerDivHeight.current = innerDivHeight;
    }
  }, [triggerScroll]);

  // When "scroll to bottom" button clicked then scroll to the bototm of the chat
  const handleScrollButtonClick = useCallback(() => {
    if (chatOuterDivRef.current && chatInnerDivRef.current) {
      const outerDivHeight = chatOuterDivRef.current.clientHeight;
      const innerDivHeight = chatInnerDivRef.current.clientHeight;

      // Scroll to the bottom of the message
      chatOuterDivRef.current.scrollTo({
        top: innerDivHeight! - outerDivHeight!,
        left: 0,
        behavior: 'smooth',
      });

      setShowScrollButton(false);
      setNumNewMessages(0);
    }
  }, []);

  // Define the callback function for intersection observer
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      // If scrolled down to bottom, hide "scroll to bottom" button
      if (entry.isIntersecting) {
        setShowScrollButton(false);
        setNumNewMessages(0);
      }
    });
  };

  // Use the useIntersectionObserver hook with the defined callback function
  const scrolledDivRef = useIntersectionObserver(handleIntersection, { threshold: 1 });

  return (
    <Box position="relative" flexGrow={1} sx={{ overflowY: 'auto' }}>
      <Stack
        ref={chatOuterDivRef}
        direction="column"
        flexGrow={1}
        position="relative"
        height="100%"
        sx={{ overflowY: 'auto' }}
      >
        {/* Content goes here */}
        <Box ref={chatInnerDivRef} position="relative" flexGrow={1} pb="3%">
          {children}
          <div ref={scrolledDivRef} />
        </Box>
      </Stack>

      {/* Display "Scroll bottom" button when new messages arrive */}
      <NewMessageButton
        toggleDisplay={showScrollButton}
        numNewMessages={numNewMessages}
        onClick={handleScrollButtonClick}
      />
    </Box>
  );
};

export default ScrollController;
