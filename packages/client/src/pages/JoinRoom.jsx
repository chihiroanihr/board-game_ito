import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { roomIdConfig } from "@board-game-ito/shared";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

function JoinRoom() {
  const { user } = useAuth();
  const { join } = useRoom();
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
    async function onJoinRoomEvent(data) {
      try {
        const { success, result } = data;
        if (success) {
          const { room } = result;
          join(room); // Local Storage & Navigate
        } else {
          outputServerError({ error: result });
        }
      } catch (error) {
        outputServerError({
          error: error,
          message: "Returned data is missing from the server",
        });
      }
    }

    socket.on("joinRoom", onJoinRoomEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("joinRoom", onJoinRoomEvent);
    };
  }, [join, socket]);

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
                `^[${roomIdConfig.letterRegex}]{${roomIdConfig.numLetters}}$`
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
