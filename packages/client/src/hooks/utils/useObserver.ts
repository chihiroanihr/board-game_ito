import React, { useRef, useEffect, RefObject } from 'react';

type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void;

export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): RefObject<HTMLElement> => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // const observer = new IntersectionObserver(
    //   (entries) => {
    //     entries.forEach((entry) => {
    //       if (entry.isIntersecting) {
    //         // If target element is intersecting with the viewport or with an ancestor element, trigger the callback function
    //         callback();
    //       }
    //     });
    //   },
    //   {
    //     ...options,
    //   }
    // );

    const observer = new IntersectionObserver(callback, options);

    // Start observing the target element
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    // Cleanup: disconnect observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
};

/**
 * Here are some of the commonly used properties of the IntersectionObserverEntry object:

    isIntersecting: A Boolean value indicating whether the observed target element is intersecting with the root or root's ancestor.

    intersectionRatio: A value between 0 and 1 representing the ratio of the observed target element's intersection rectangle with the root's intersection rectangle. It indicates how much of the target element is visible within the viewport or ancestor.

    intersectionRect: A DOMRectReadOnly representing the intersection rectangle, or the area where the observed target element intersects with the viewport or ancestor.

    boundingClientRect: A DOMRectReadOnly representing the target element's bounding rectangle, i.e., its size and position relative to the viewport.

    rootBounds: A DOMRectReadOnly representing the bounding rectangle of the root or root's ancestor. This provides information about the size and position of the root element.

    target: The observed target element itself, which can be accessed via the target property of the IntersectionObserverEntry object.
 */
