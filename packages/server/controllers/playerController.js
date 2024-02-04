export const addPlayerInRoom = async ({ user, roomId }) => {
  try {
    const response = await fetch(`http://localhost:3002/rooms/${roomId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        players: [...user],
      }),
    });
    return response.ok;
  } catch (error) {
    throw error;
  }
};
