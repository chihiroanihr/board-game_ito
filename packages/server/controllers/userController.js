export const getUserInfo = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3002/users/${userId}`, {
      method: "GET",
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

export const addNewUser = async (newUser) => {
  try {
    const response = await fetch(`http://localhost:3002/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });
    return response.ok;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (user) => {
  try {
    const response = await fetch(`http://localhost:3002/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return response.ok;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3002/users/${userId}`, {
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

export const getAllUsers = async () => {
  try {
    const response = await fetch("http://localhost:3002/users");
    return response.ok ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

export const deleteAllUsers = async () => {
  try {
    // Get all users
    const users = await getAllUsers();

    // Iterate and delete each users
    if (users) {
      const userArray = users.map((user) => user.id);
      await Promise.all(userArray.map(async (id) => await deleteUser(id)));
      return userArray;
    }
    // If users data returns empty
    else {
      return null;
    }

    // await fetch("http://localhost:3002/users", {
    //   method: "DELETE",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
  } catch (error) {
    throw error;
  }
};
