import { outputServerError } from "../utils/utils";
import { isObjectEmpty } from "../utils/utils";

export default function Initialize() {
  const initializeHandler = async () => {
    await fetch(`/initialize`, {
      method: "DELETE",
    })
      // Success
      .then((response) => response.json())
      .then((responseData) => {
        const { rooms, users } = responseData;

        if (
          (rooms || !isObjectEmpty(rooms)) &&
          (users || !isObjectEmpty(users))
        ) {
          alert("[Success]: Successfully initialized json-server database.");
        } else {
          alert(
            "[Error]: Could not initialize database (Return value still has some elements)."
          );
        }
      })
      // Server error
      .catch((error) => {
        outputServerError(error, "Error initializing json-server database");
      });
  };

  return <button onClick={initializeHandler}>Initialize</button>;
}
