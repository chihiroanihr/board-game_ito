import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { RoomStatusEnum } from "@board-game-ito/shared";
import { roomIdConfig } from "@board-game-ito/shared";

function JoinRoom() {
  const navigate = useNavigate();

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
    if (!data || !data.roomId) {
      alert("Please enter a valid Room ID.");
      return;
    }

    // Get room info availability
    await fetch(`/join/${data.roomId}`)
      .then((response) => response.json())
      .then((responseData) => {
        // Check if responseData is null or undefined
        if (!responseData) {
          alert("Server returned invalid data. Please try again later.");
          return;
        }

        // Get room status
        const { roomStatus } = responseData;

        switch (roomStatus) {
          case RoomStatusEnum.AVAILABLE:
            navigate("/waiting/" + data.roomId); // Room ID is valid, redirect to the waiting room
            break;
          case RoomStatusEnum.PLAYING:
            alert("This Room is currently playing. Please try other rooms.");
            break;
          case RoomStatusEnum.FULL:
            alert("This Room is currently full. Please try other rooms.");
            break;
          default:
            alert("This Room does not exist. Please try other rooms.");
        }
      })
      .catch((error) => {
        console.error("[Server Error]: Error validating Room ID:", error);
        alert("Server Error. Please try again later.");
      });
  };

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
