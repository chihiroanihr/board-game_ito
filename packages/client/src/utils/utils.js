export const isObjectEmpty = (objectName) => {
  return (
    objectName &&
    Object.keys(objectName).length === 0 &&
    objectName.constructor === Object
  );
};

export const outputServerError = ({ error, message = "" }) => {
  console.error(`[Server Error]: ${message ? " " + message : ""}:`, error);
  alert("Server Error. Please try again later.");
};
