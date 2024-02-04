export const isObjectEmpty = (objectName) => {
  return (
    objectName &&
    Object.keys(objectName).length === 0 &&
    objectName.constructor === Object
  );
};

export const outputServerError = (error, string) => {
  console.error(`[Server Error]: ${string ? " " + string : ""}:`, error);
  alert("Server Error. Please try again later.");
};
