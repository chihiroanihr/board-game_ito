import { useParams } from "react-router-dom";

export default function Waiting() {
  const params = useParams();
  return (
    <div>
      <h2>Waiting Room</h2>
      <p>Room ID: {params.roomId}</p>
    </div>
  );
}
