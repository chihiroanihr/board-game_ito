import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";
import { navigateDashboard, navigateWaiting } from "../utils";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const navigate = useNavigate();

  const [room, setRoom] = useLocalStorage("room", null);

  // Call this function to join the room
  const joinRoom = useCallback(
    (data) => {
      setRoom(data);
      navigateWaiting(navigate);
    },
    [navigate, setRoom]
  );

  // call this function to leave from the room
  const leaveRoom = useCallback(() => {
    setRoom(null);
    navigateDashboard(navigate);
  }, [navigate, setRoom]);

  const updateRoom = useCallback(
    (value) => {
      setRoom(value);
    },
    [setRoom]
  );

  const value = useMemo(
    () => ({
      room,
      joinRoom,
      leaveRoom,
      updateRoom,
    }),
    [joinRoom, leaveRoom, room, updateRoom]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoom = () => {
  return useContext(RoomContext);
};
