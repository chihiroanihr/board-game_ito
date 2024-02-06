import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const joinRoomHandler = () => {
    navigate("/join-room");
  };

  const createRoomHandler = () => {
    navigate("/create-room");
  };

  return (
    <div>
      {/* Create / Join Room */}
      <h2>Choose an option:</h2>
      <button onClick={joinRoomHandler}>Join Room</button>
      <button onClick={createRoomHandler}>Create Room</button>
    </div>
  );
}
