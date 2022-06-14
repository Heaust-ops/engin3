export interface MousePosition {
  x: number;
  y: number;
}

export const mousePosition = { x: -1, y: -1 } as MousePosition;
export const ndcMousePosition = { x: -1, y: -1 } as MousePosition;

/**
 * Keeps the Mouse Position on heap fresh.
 * @param mouseMoveEvent Mouse Move Event
 */
export const keepTrackOfCursor = (mouseMoveEvent: MouseEvent) => {
  if (document.pointerLockElement) {
    /**
     * If the pointer is locked, update by using movement.
     */
    const radius = 20;
    const { width, height } = document.getElementById(
      "three-canvas"
    ) as HTMLCanvasElement;
    mousePosition.x += mouseMoveEvent.movementX;
    mousePosition.y += mouseMoveEvent.movementY;
    if (mousePosition.x > width + radius) {
      mousePosition.x = -radius;
    }
    if (mousePosition.y > height + radius) {
      mousePosition.y = -radius;
    }
    if (mousePosition.x < -radius) {
      mousePosition.x = width + radius;
    }
    if (mousePosition.y < -radius) {
      mousePosition.y = height + radius;
    }
  } else {
    /**
     * Update Normally
     */
    mousePosition.x = mouseMoveEvent.pageX;
    mousePosition.y = mouseMoveEvent.pageY;
  }
};
