import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

function Home() {
  const { login } = useAuth();
  const { socket } = useSocket();

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "" },
  });

  // Player name submitted
  const onSubmit = async (data) => {
    if (!data || !data.name) {
      alert("Please enter a valid name.");
      return;
    }

    const userName = data.name.trim(); // Trim any start/end spaces

    // Send to socket
    socket.emit("login", {
      userName: userName,
      socketId: socket.id,
    });
  };

  useEffect(() => {
    async function onLoginEvent(data) {
      // "data" type: User or String
      try {
        const { success, result } = data;
        if (success) {
          const { user } = result;
          await login(user);
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

    socket.on("login", onLoginEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("login", onLoginEvent);
    };
  }, [login, socket]);

  return (
    <div>
      <h1>Welcome to ITO Game</h1>

      {/* Name Input */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="name">Enter Your Name: </label>

        {/* Input Field */}
        <input
          type="text"
          id="name"
          placeholder="John Doe"
          // Validate the name with react-hook-form
          {...register("name", {
            required: "Name is required.",
            pattern: {
              value: /^\s*\S[\s\S]*$/,
              message: "Entered value cannot onl contain spaces.",
            },
          })}
        />

        {/* Validation Error */}
        {errors.name && <p>{errors.name.message}</p>}

        {/* Submit Button */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Home;
