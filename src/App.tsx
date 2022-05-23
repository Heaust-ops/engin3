import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect, useState } from "react";
import { viewportInit } from "./three/viewport";
import { viewportAddMenu } from "./contextMenus/viewportAdd";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  MeshLoadMethod,
  ViewportEventType,
  ViewportModes,
  WorkingAxes,
} from "./enums";
import { MousePosition } from "./interfaces";
import { Material, Vector3 } from "three";
import { isSelectedType } from "./utils.ts/validity";
import {
  commitTransaction,
  removeSelectedMesh,
  rollbackTransaction,
  startTransaction,
} from "./utils.ts/transactions";
import { loadFBXModel, loadGLTFModel } from "./utils.ts/models";
import { ViewportEvent } from "./utils.ts/events";

declare global {
  interface Window {
    scene: THREE.Scene;
    selectedItem: THREE.Object3D | null;
    mousePosition: MousePosition;
    viewportMode: ViewportModes;
    workingAxis: WorkingAxes;
    controls: OrbitControls;
    defaultMaterial: Material;
    viewportCamera: THREE.PerspectiveCamera;
    viewportEventHistory: ViewportEvent[];
    pendingTransactionType: ViewportEventType | null;
    pendingTransactionObjectID: number | null;
    pendingTransactionInitials:
      | [number /** x */, number /** y */, number /** z */]
      | null;
    pendingMeshTransactionInfo: {
      path: string;
      method: MeshLoadMethod;
    } | null;
  }
}

window.pendingTransactionType = null;
window.mousePosition = { x: -1, y: -1 };
window.workingAxis = WorkingAxes.all;
window.viewportMode = ViewportModes.navigate;
window.viewportEventHistory = [];
window.pendingTransactionInitials = null;
window.pendingMeshTransactionInfo = null;

const keepTrackOfCursor = (mouseMoveEvent: MouseEvent) => {
  window.mousePosition.x = mouseMoveEvent.pageX;
  window.mousePosition.y = mouseMoveEvent.pageY;
};

const preventDefault = (ev: Event) => {
  ev.preventDefault();
};

const menus = {
  hotkeys: {
    shifta: viewportAddMenu,
  },
};

function App() {
  const [keyStack, setkeyStack] = useState([] as KeyboardEvent["key"][]);
  const [mode, setmode] = useState(ViewportModes.navigate);

  useEffect(() => {
    window.viewportMode = mode;
    let mouseDeltaInterval: NodeJS.Timer;

    if (window.controls) {
      if (mode !== ViewportModes.navigate) window.controls.enabled = false;
      else window.controls.enabled = true;
    }

    if (
      [ViewportModes.grab, ViewportModes.rotate, ViewportModes.scale].includes(
        mode
      )
    )
      startTransaction(mode as unknown as ViewportEventType);

    if ([ViewportModes.grab, ViewportModes.rotate].includes(mode)) {
      let prevMousePosition = { ...window.mousePosition };
      mouseDeltaInterval = setInterval(() => {
        const deltaX = window.mousePosition.x - prevMousePosition.x;
        // ThreeJs Y axis is reverse of DOM y axis
        const deltaY = -window.mousePosition.y + prevMousePosition.y;

        const lookAtVector = new Vector3(0, 0, -1);
        lookAtVector.applyQuaternion(window.viewportCamera.quaternion);

        console.log(deltaX, deltaY);

        prevMousePosition = { ...window.mousePosition };
      }, 20);
    }

    return () => {
      if (mouseDeltaInterval) clearInterval(mouseDeltaInterval);
    };
  }, [mode]);

  // Handle Key Stack
  useEffect(() => {
    // Handle Hotkeys
    const handleHotkeys = (hotkeyStack: KeyboardEvent["key"][]) => {
      switch (hotkeyStack.join("")) {
        case "controlz":
          rollbackTransaction();
          break;
        case "o":
          break;
        case "x":
          startTransaction(ViewportEventType.delete);
          removeSelectedMesh();
          commitTransaction();
          break;

        case "g":
          if (isSelectedType("Mesh", "Group", "SkinnedMesh"))
            window.viewportMode === ViewportModes.grab
              ? setmode(ViewportModes.navigate)
              : setmode(ViewportModes.grab);
          break;

        case "s":
          if (isSelectedType("Mesh", "Group", "SkinnedMesh"))
            window.viewportMode === ViewportModes.scale
              ? setmode(ViewportModes.navigate)
              : setmode(ViewportModes.scale);
          break;
      }
    };

    // Handle hotkeys on change to the key stack
    handleHotkeys(keyStack);

    // Add Keys to the Stack
    const onKeyDown = (ev: KeyboardEvent) => {
      const targetKey = ev.key.toLowerCase();

      // Clear the key first incase keyup event failed to clear it
      if (keyStack.indexOf(targetKey) >= 0)
        setkeyStack(keyStack.filter((el) => el !== targetKey));

      // Now add the Key
      if (!keyStack.includes(targetKey)) setkeyStack([...keyStack, targetKey]);
    };

    // Release Keys from Stack
    const onKeyUp = (ev: KeyboardEvent) => {
      const targetKey = ev.key.toLowerCase();

      if (keyStack.indexOf(targetKey) >= 0)
        setkeyStack(keyStack.filter((el) => el !== targetKey));
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [keyStack]);

  useEffect(() => {
    viewportInit();
    // Keeping track of mouse cursor
    document.addEventListener("mousemove", keepTrackOfCursor, false);
    // Don't open stuff in browser on drop
    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", preventDefault, false);

    return () => {
      document.removeEventListener("mousemove", keepTrackOfCursor, false);
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", preventDefault, false);
    };
  }, []);

  return (
    <div className={`App ${styles.App}`}>
      {/* Header Menu */}
      <div className={`${styles.headerMenu}`}></div>

      {/* Viewport */}
      <ContextMenuWrapperDiv
        onDrop={(ev) => {
          const model = ev.dataTransfer.items[0].getAsFile();
          console.log(model);
          const modelURL = model ? URL.createObjectURL(model) : null;
          if (modelURL) {
            switch (model!.type) {
              case "model/gltf-binary":
                loadGLTFModel({ modelPath: modelURL });
                break;
              case "":
                if (model!.name.endsWith(".fbx"))
                  loadFBXModel({ modelPath: modelURL });
                break;
            }
          }
        }}
        onMouseDown={(ev) => {
          switch (ev.button) {
            case 0: //Left
              if (
                [
                  ViewportModes.grab,
                  ViewportModes.rotate,
                  ViewportModes.scale,
                ].includes(mode)
              ) {
                commitTransaction();
                setmode(ViewportModes.navigate);
              }
              break;
            case 1: //Middle
              break;
            case 2: //Right
              if (
                [
                  ViewportModes.grab,
                  ViewportModes.rotate,
                  ViewportModes.scale,
                ].includes(mode)
              ) {
                commitTransaction();
                rollbackTransaction();
                setmode(ViewportModes.navigate);
              }
              break;
          }
        }}
        onWheel={(ev) => {
          // Handle Scaling
          if (
            window.viewportMode === ViewportModes.scale && // Handle Scaling
            window.workingAxis === WorkingAxes.all && // For uniform scaling
            isSelectedType("Mesh", "Group", "SkinnedMesh")
          ) {
            const scalingFactor =
              Math.sign(ev.deltaY) < 0
                ? 0.1 /** scrollup */
                : -0.1; /** scroll down */
            (window.selectedItem as THREE.Mesh).scale.x += scalingFactor;
            (window.selectedItem as THREE.Mesh).scale.y += scalingFactor;
            (window.selectedItem as THREE.Mesh).scale.z += scalingFactor;
          }
        }}
        menus={menus}
        className={`${styles.viewport} viewport`}
        keyStack={keyStack}
      />

      {/* SidePanel */}
      <div className={`${styles.sidePanel}`}></div>
    </div>
  );
}

export default App;
