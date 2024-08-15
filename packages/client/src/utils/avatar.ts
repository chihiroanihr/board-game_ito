export const userNameToColor = (string: string, opacity?: number) => {
  let hash = 0;
  let i;

  // Generate the hash from the string
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  // Generate the color from the hash
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  // If opacity is defined, append it to the color string
  if (opacity !== undefined) {
    opacity = Math.max(0, Math.min(1, opacity)); // Clamp the opacity value between 0 and 1
    color += Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
  }

  return color;
};

export const getAvatarProps = (name: string) => {
  return {
    // background color
    sx: {
      bgcolor: userNameToColor(name),
    },
    // name as initial
    children: `${name[0]}${name[1]}`,
  };
};

export const getUserTextColor = (name: string) => {
  return {
    sx: {
      color: userNameToColor(name),
    },
  };
};
