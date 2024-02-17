import { useState } from "react";
import { useForm } from "react-hook-form";
import { roomIdConfig } from "@board-game-ito/shared";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError, outputResponseTimeoutError } from "../utils";

/**
 * Subpage for Dashboard
 * @returns
 */
function JoinRoom() {
  const { updateUser } = useAuth();
  const { joinRoom } = useRoom();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { roomId: "" },
  });

  // Room ID Submitted
  const onSubmit = (data) => {
    setLoading(true);
    setErrorMessage(""); // Reset error message

    const roomId = data.roomId.trim();

    if (!roomId) {
      setErrorMessage("Please enter a valid Room ID.");
      setLoading(false);
      return;
    }

    /** @socket_send - Send to socket & receive response */
    socket.emit("join-room", roomId, async (error, response) => {
      // socket.emit("join-room", roomId);

      // Clear the timeout as response is received before timeout
      clearTimeout(
        // Create a timeout to check if the response is received
        setTimeout(() => {
          setLoading(false);
          outputResponseTimeoutError();
        }, 5000)
      );

      if (error) {
        setErrorMessage("Internal Server Error: Please try again.");
        outputServerError({ error });
      } else {
        // User can join room
        if (typeof response === "object") {
          const { user, room } = response;

          updateUser(user); // Store updated user info to local storage
          joinRoom(room); // Save room info to local storage and navigate
        }
        // User cannot join room
        else {
          setErrorMessage(response);
        }

        reset(); // Optionally reset form fields
      }

      setLoading(false);
    });
  };

  // useEffect(() => {
  //   async function onJoinRoomSuccessEvent(data) {
  //     try {
  //       // User can join room
  //       if (typeof data === "object") {
  //         const { user, room } = data;

  //         if (user && room) {
  //           joinRoom(room); // Save room info to local storage and navigate
  //         } else {
  //           throw new Error("Returned data is missing from the server.");
  //         }
  //       }
  //       // User cannot join room
  //       else {
  //         setErrorMessage(data);
  //       }
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("join-room_success", onJoinRoomSuccessEvent);

  //   // Cleanup the socket event listener when the component unmounts
  //   return () => {
  //     socket.off("join-room_success", onJoinRoomSuccessEvent);
  //   };
  // }, [joinRoom, socket]);

  // useEffect(() => {
  //   async function onJoinRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("join-room_error", onJoinRoomErrorEvent);

  //   return () => {
  //     socket.off("join-room_error", onJoinRoomErrorEvent);
  //   };
  // }, [joinRoom, socket]);

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

        {/* Form Request Error */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Join Room"}
        </button>
      </form>
    </div>
  );
}

export default JoinRoom;
