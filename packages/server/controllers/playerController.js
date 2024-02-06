export const addPlayerInRoom = async (user, room) => {
  try {
    const updatedRoom = {
      ...room,
      players: [...room.players, user],
    };

    const response = await fetch(`http://localhost:3002/rooms/${room.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedRoom),
    });

    return response.ok;
  } catch (error) {
    throw error;
  }
};

export const deletePlayerFromRoom = async (user, room) => {
  try {
    const updatedRoom = {
      ...room,
      players: room.players.filter((player) => player.id !== user.id),
    };

    const response = await fetch(`http://localhost:3002/rooms/${room.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedRoom),
    });

    return response.ok;
  } catch (error) {
    throw error;
  }
};
