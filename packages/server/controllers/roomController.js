export const getRoomInfo = async (roomId) => {
  try {
    const response = await fetch(`http://localhost:3002/rooms/${roomId}`, {
      method: "GET",
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

export const addNewRoom = async (newRoom) => {
  try {
    const response = await fetch(`http://localhost:3002/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newRoom),
    });
    return response.ok;
  } catch (error) {
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const response = await fetch(`http://localhost:3002/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    throw error;
  }
};

export const getAllRooms = async () => {
  try {
    const response = await fetch(`http://localhost:3002/rooms`, {
      method: "GET",
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

export const cleanUpIdleRooms = () => {};

export const deleteAllRooms = async () => {
  try {
    // Get all rooms
    const rooms = await getAllRooms();

    // Iterate and delete each rooms
    if (rooms) {
      const roomArray = rooms.map((room) => room.id);
      await Promise.all(roomArray.map(async (id) => await deleteRoom(id)));
      return roomArray;
    }
    // If rooms data returns empty
    else {
      return null;
    }

    // await fetch("http://localhost:3002/rooms", {
    //   method: "DELETE",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
  } catch (error) {
    throw error;
  }
};
