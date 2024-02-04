import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { roomIdConfig } from "@board-game-ito/shared";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

function JoinRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { roomId: "" },
  });

  // Room ID Submitted
  const onSubmit = async (data) => {
    const roomId = data.roomId;

    if (!data || !roomId) {
      alert("Please enter a valid Room ID.");
      return;
    }

    // Send to socket
    socket.emit("joinRoom", {
      user: user,
      roomId: roomId,
      socketId: socket.id,
    });
  };

  useEffect(() => {
    socket.on("userJoined", async (data) => {
      try {
        const { success, response } = data;
        if (success) {
          const { user, room } = response;
          navigate("/waiting/" + room.id); // Redirect to the waiting room
        } else {
          outputServerError({ error: response });
        }
      } catch (error) {
        outputServerError({
          error: error,
          message: "Returned data is missing from the server",
        });
      }
    });
  }, [socket]);

  return (
    <div>
      <h2>Enter Room ID to Join:</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="roomId">Room ID: </label>

        {/* Input Field */}
        <input
          type="text"
          id="roomId"
          placeholder={roomIdConfig.placeholder}
          // Validate the roomId with react-hook-form
          {...register("roomId", {
            required: "Room ID is required",
            pattern: {
              value: new RegExp(
                `^[${roomIdConfig.letterRegex}]{${roomIdConfig.numberOfLetters}}$`
              ),
              message: roomIdConfig.error_message,
            },
          })}
        />

        {/* Validation Error */}
        {errors.roomId && <p>{errors.roomId.message}</p>}

        {/* Submit Button */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default JoinRoom;
