import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const navigate = useNavigate();

  const [room, setRoom] = useLocalStorage("room", null);

  // Call this function when you want to authenticate the user
  const join = useCallback(
    async (data) => {
      setRoom(data);
      navigate("/waiting", { replace: true });
    },
    [navigate, setRoom]
  );

  // call this function to sign out logged in user
  const leave = useCallback(async () => {
    setRoom(null);
    navigate("/dashboard", { replace: true });
  }, [navigate, setRoom]);

  const value = useMemo(
    () => ({
      room,
      join,
      leave,
    }),
    [join, leave, room]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoom = () => {
  return useContext(RoomContext);
};
