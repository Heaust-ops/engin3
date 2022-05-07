import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect } from "react";
import { viewportInit } from "./three/viewport";
import { viewportMenu } from "./contextMenus/viewport";
import { useMousePosition } from "./hooks/useMousePosition";

export interface MousePosition {
  x: number;
  y: number;
}
declare global {
  interface Window {
    scene: THREE.Scene;
    selectedItem: THREE.Object3D | null;
    mousePosition: MousePosition;
  }
}

var mousePosition = { x: -1, y: -1 };
window.mousePosition = mousePosition;

const keepTrackOfCursor = (mouseMoveEvent: MouseEvent) => {
  window.mousePosition.x = mouseMoveEvent.pageX;
  window.mousePosition.y = mouseMoveEvent.pageY;
};

function App() {
  useEffect(() => {
    viewportInit();
    document.addEventListener("mousemove", keepTrackOfCursor, false);

    return () =>
      document.removeEventListener("mousemove", keepTrackOfCursor, false);
  }, []);

  return (
    <div className={`App ${styles.App}`}>
      {/* Header Menu */}
      <div className={`${styles.headerMenu}`}></div>

      {/* Viewport */}
      <ContextMenuWrapperDiv
        contextMenuItems={viewportMenu}
        className={`${styles.viewport} viewport`}
      />

      {/* SidePanel */}
      <div className={`${styles.sidePanel}`}></div>
    </div>
  );
}

export default App;
