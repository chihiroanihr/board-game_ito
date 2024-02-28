import { styled } from '@mui/material';

const AnimateTextThreeDots = styled('span')`
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;

  /* Animation keyframes */
  @keyframes bounce {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
    75% {
      content: '';
    } /* Disappear */
    100% {
      content: '.';
    }
  }

  /* Apply animation to the ::after pseudo-element */
  &::after {
    content: '.';
    animation: bounce 2s infinite;
  }
`;

export default AnimateTextThreeDots;
