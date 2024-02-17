/**
 * Directly navigates to Home "/".
 * @param {Function} navigate - The navigate function obtained from useNavigate hook.
 */
export const navigateHome = (navigate) => {
  navigate("/", { replace: true });
};

/**
 * Directly navigates to Dashboard "/dashboard".
 * @param {Function} navigate - The navigate function obtained from useNavigate hook.
 */
export const navigateDashboard = (navigate) => {
  navigate("/dashboard", { replace: true });
};

/**
 * Directly navigates to Create Room "/create-room".
 * @param {Function} navigate - The navigate function obtained from useNavigate hook.
 */
export const navigateCreateRoom = (navigate) => {
  navigate("/create-room");
};

/**
 * Directly navigates to Join Room "/join-room".
 * @param {Function} navigate - The navigate function obtained from useNavigate hook.
 */
export const navigateJoinRoom = (navigate) => {
  navigate("/join-room");
};

/**
 * Directly navigates to Waiting Room "/waiting".
 * @param {Function} navigate - The navigate function obtained from useNavigate hook.
 */
export const navigateWaiting = (navigate) => {
  navigate("/waiting", { replace: true });
};
