import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { navigateJoinRoom, navigateCreateRoom } from "../utils";

/**
 * Main page for Dashboard
 * @returns
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);

  const joinRoomHandler = () => {
    setLoading(true);
    navigateJoinRoom(navigate);
    setLoading(false);
  };

  const createRoomHandler = () => {
    setLoading(true);
    navigateCreateRoom(navigate);
    setLoading(false);
  };

  return (
    <div>
      {/* Create / Join Room */}
      <h2>Choose an option:</h2>
      <button onClick={joinRoomHandler} disabled={loading}>
        {loading ? "Loading..." : "Join Room"}
      </button>
      <button onClick={createRoomHandler} disabled={loading}>
        {loading ? "Loading..." : "Create Room"}
      </button>
    </div>
  );
}
