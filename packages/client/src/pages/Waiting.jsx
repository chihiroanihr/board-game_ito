import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSocket } from "../hooks/useSocket";
import { useRoom } from "../hooks/useRoom";

export default function Waiting() {
  const navigate = useNavigate();
  const { room } = useRoom();
  const { socket } = useSocket();

  const [newUser, setNewUser] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!room) {
      navigate("/dashboard");
    }
  }, [navigate, room]);

  useEffect(() => {
    async function onWaitingListEvent(data) {
      const { room, user } = data.result;
      // setUsers((prevUsers) => [...prevUsers, user]);
      setUsers(room.players);
      setNewUser(`${user.id}: ${user.name}`);
    }
    // Runs whenever a socket event is recieved from the server
    socket.on("waitingRoom", onWaitingListEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("waitingRoom", onWaitingListEvent);
    };
  }, [socket]);

  return (
    room && (
      <div>
        <h2>Waiting Room</h2>
        <p>Room ID: {room.id}</p>
        <div>
          <ul>
            {users.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
          {newUser} just joined.
        </div>
      </div>
    )
  );
}
