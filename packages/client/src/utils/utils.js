export const isObjectEmpty = (objectName) => {
  return (
    objectName &&
    Object.keys(objectName).length === 0 &&
    objectName.constructor === Object
  );
};

export const outputServerError = ({ error, message = "" }) => {
  console.error(
    `[Server Error]: ${message ? " " + message : ""} \n${error.message}`
  );
  alert("Internal Server Error: Please try again later.");
};

export const outputResponseTimeoutError = () => {
  console.error(
    "[Timeout Error]: The request could not be completed within 5 seconds."
  );
  // alert(
  //   "[Timeout Error]: The request could not be completed within 5 seconds."
  // );
};
