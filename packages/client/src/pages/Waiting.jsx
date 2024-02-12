import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";

export default function Waiting() {
  const navigate = useNavigate();
  const { room } = useRoom();
  const { socket } = useSocket();

  const [newUser, setNewUser] = useState("");
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState({ id: null, name: null });

  useEffect(() => {
    if (!room) {
      navigate("/dashboard");
    }
  }, [navigate, room]);

  useEffect(() => {
    async function onWaitingListEvent(result) {
      const { room, user } = result;
      // setUsers((prevUsers) => [...prevUsers, user]);
      setAdmin({ id: room.createdBy.id, name: room.createdBy.name });
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
            {users.map((user) =>
              admin.id && admin.id === user.id ? (
                <li key={user.id}>{user.name} (admin)</li>
              ) : (
                <li key={user.id}>{user.name}</li>
              )
            )}
          </ul>
          <p>{newUser} just joined.</p>
        </div>
      </div>
    )
  );
}
