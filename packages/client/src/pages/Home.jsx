import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { isObjectEmpty, outputServerError } from "../utils/utils";

function Home() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { socket } = useSocket();

  // If user already logged-in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

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

    await fetch(`/user`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ userName }),
    })
      .then((response) => response.json())
      .then(async (responseData) => {
        // Response is empty -> Server error
        if (isObjectEmpty(responseData)) {
          throw new Error();
        }
        // Name is registered
        else if (responseData.success) {
          // Send to socket
          socket.emit("login", {
            user: responseData.user,
            socketId: socket.id,
          });
          // Store user ID to local storage
          await login(responseData.user);
        }
        // Name could not been registered
        else {
          alert(
            "The following name could not be registered. Please try a different name."
          );
        }
      })
      // Server error
      .catch((error) => {
        outputServerError(error, "Error registering name");
      });
  };

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
