import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { outputServerError, outputResponseTimeoutError } from "../utils";

/**
 * Main page for Home
 * @returns
 */
function Home() {
  const { login } = useAuth();
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
    defaultValues: { name: "" },
  });

  // Player name submitted
  const onSubmit = (data) => {
    setLoading(true); // Set loading to true when the request is initiated
    setErrorMessage(""); // Reset error message

    // Trim any start/end spaces
    const userName = data.name.trim();

    if (!userName) {
      setErrorMessage("Please enter a valid name.");
      setLoading(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit("login", userName, async (error, userResponse) => {
      // socket.emit("logout", userName);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        setErrorMessage("Internal Server Error: Please try again.");
        outputServerError({ error });
      } else {
        login(userResponse); // Login and save user info to local storage
        reset(); // Optionally reset form fields
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  // useEffect(() => {
  //   async function onLoginSuccessEvent(data) {
  //     try {
  //       // "data" type: User
  //       if (data) {
  //         login(data);
  //       } else {
  //         throw new Error("Returned data is missing from the server.");
  //       }
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("login_success", onLoginSuccessEvent);

  //   // Cleanup the socket event listener when the component unmounts
  //   return () => {
  //     socket.off("login_success", onLoginSuccessEvent);
  //   };
  // }, [login, socket]);

  // useEffect(() => {
  //   async function onLoginErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("login_error", onLoginErrorEvent);

  //   return () => {
  //     socket.off("login_error", onLoginErrorEvent);
  //   };
  // });

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
              message: "Entered value cannot only contain spaces.",
            },
          })}
        />

        {/* Validation Error */}
        {errors.name && <p className="error">{errors.name.message}</p>}

        {/* Form Request Error */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default Home;
