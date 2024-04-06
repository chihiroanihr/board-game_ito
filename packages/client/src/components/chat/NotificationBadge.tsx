import React from 'react';
import { type BadgeProps } from '@mui/material';

import { NotificationBadgeStyled } from '@/components';

interface NotificationBadgeProps extends BadgeProps {
  children?: React.ReactNode;
  color?: BadgeProps['color'];
  badgeContent?: BadgeProps['badgeContent']; // Type of badgeContent from BadgeProps
  max?: BadgeProps['max']; // Type of max from BadgeProps
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  children,
  color = 'info', // Default value for color
  badgeContent = 0, // Default value for badgeContent
  max = 999, // Default value for max
  ...props
}) => {
  return (
    <NotificationBadgeStyled color={color} badgeContent={badgeContent} max={max} {...props}>
      {children}
    </NotificationBadgeStyled>
  );
};

export default NotificationBadge;
