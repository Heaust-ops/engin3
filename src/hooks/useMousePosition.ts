import { useEffect, useState } from "react";

export interface MousePosition {
    x: number;
    y: number;
  }

const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  const updateMousePosition = (ev: MouseEvent) => {
    setMousePosition({ x: ev.clientX, y: ev.clientY });
  };
  const updateTouchPosition = (ev: TouchEvent) => {
    setMousePosition({ x: ev.touches[0].clientX, y: ev.touches[0].clientY });
  };

  useEffect(() => {
    if (isTouchDevice()) {
      window.addEventListener("touchmove", updateTouchPosition);
    } else {
      window.addEventListener("mousemove", updateMousePosition);
    }

    return () => {
      if (isTouchDevice()) {
        window.removeEventListener("touchmove", updateTouchPosition);
      } else {
        window.removeEventListener("mousemove", updateMousePosition);
      }
    };
  }, []);

  return mousePosition;
};
