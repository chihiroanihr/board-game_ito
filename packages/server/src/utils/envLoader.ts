// config/envLoader.js
import dotenv from "dotenv";
import path from "path";

function loadEnv(): void {
  // Adjust the path as necessary based on your project structure
  const envPath = path.resolve(__dirname, "../../../../.env");

  const result = dotenv.config({ path: envPath });

  // Error
  if (result.error) {
    throw result.error;
    // process.exit(1); // Optionally exit if the config is critical
  }
}

export default loadEnv;
