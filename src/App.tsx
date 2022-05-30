import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect, useState } from "react";
import { viewportInit } from "./three/viewport";
import { viewportAddMenu } from "./contextMenus/viewportAdd/viewportAdd";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  MeshLoadMethod,
  ViewportEventType,
  ViewportModes,
  WorkingAxes,
} from "./enums";
import { MousePosition } from "./interfaces";
import { Material, Vector3 } from "three";
import { isSelectedType } from "./utils/validity";
import {
  commitTransaction,
  PendingTransaction,
  rollbackTransaction,
  startTransaction,
} from "./utils/transactions";
import { loadFBXModel, loadGLTFModel } from "./utils/models";
import { ViewportEvent } from "./utils/events";
import {
  doForSelectedItems,
  getMousePositionIn3D,
  getVector3Component,
} from "./utils/utils";
import { ViewportInteractionAllowed } from "./utils/constants";
import { handleHotkeys } from "./utils/handleHotkeys";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

declare global {
  interface Window {
    scene: THREE.Scene;
    selectedItems: THREE.Object3D[];
    mousePosition: MousePosition;
    ndcMousePosition: MousePosition;
    viewportMode: ViewportModes;
    workingAxis: WorkingAxes;
    controls: OrbitControls;
    defaultMaterial: Material;
    viewportCamera: THREE.PerspectiveCamera;
    viewportEventHistory: ViewportEvent[];
    outlinePass: OutlinePass;
    pendingTransactions: PendingTransaction[];
    multiselect: boolean;
  }
}

window.pendingTransactions = [];
window.mousePosition = { x: -1, y: -1 };
window.ndcMousePosition = { x: -1, y: -1 };
window.workingAxis = WorkingAxes.all;
window.viewportMode = ViewportModes.navigate;
window.viewportEventHistory = [];

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

  // Regulating Mode Changes
  useEffect(() => {
    window.viewportMode = mode;
    let mouseDeltaInterval: NodeJS.Timer;

    if (window.controls) {
      if (mode !== ViewportModes.navigate) window.controls.enabled = false;
      else window.controls.enabled = true;
    }

    if (mode === ViewportModes.navigate) {
      window.workingAxis = WorkingAxes.all;
    }

    if (
      [ViewportModes.grab, ViewportModes.rotate, ViewportModes.scale].includes(
        mode
      ) &&
      !window.pendingTransactions.length
    )
      startTransaction(mode as unknown as ViewportEventType);

    if ([ViewportModes.grab, ViewportModes.rotate].includes(mode)) {
      let prevPos = getMousePositionIn3D(window.ndcMousePosition);
      if (!window.selectedItems) return;

      // Interval
      mouseDeltaInterval = setInterval(() => {
        const currentPos = getMousePositionIn3D(window.ndcMousePosition);
        const delta = currentPos.clone().sub(prevPos);
        if (window.selectedItems) {
          // Grab Logic
          if (mode === ViewportModes.grab) {
            const translateComponent = getVector3Component(
              delta,
              window.workingAxis
            );
            const shift = translateComponent.multiplyScalar(
              Math.pow(currentPos.lengthSq(), 1 / 4)
            );

            if (keyStack.join("") === "shift") {
              shift.normalize().multiplyScalar(0.51);
              shift.set(
                Math.round(shift.x) * 2,
                Math.round(shift.y) * 2,
                Math.round(shift.z) * 2
              );
            }

            doForSelectedItems((x) => {
              x.position.add(shift);
            });
          }
          // Rotate Logic
          if (mode === ViewportModes.rotate) {
            const componentVector = getVector3Component(
              new Vector3(1, 1, 1),
              window.workingAxis
            );
            const angularVector = delta.cross(currentPos).normalize();
            const angularComp = -Math.abs(angularVector.dot(componentVector));
            const axis = new Vector3(
              delta.x * componentVector.x,
              delta.y * componentVector.y,
              delta.z * componentVector.z
            );

            doForSelectedItems((x) => {
              x.rotateOnWorldAxis(axis.normalize(), angularComp / 7.5);
            });
          }
        }
        prevPos = currentPos;
      }, 10);
    }

    return () => {
      if (mouseDeltaInterval) clearInterval(mouseDeltaInterval);
    };
  }, [keyStack, mode]);

  // Handle Key Stack
  useEffect(() => {
    // Handle hotkeys on change to the key stack
    handleHotkeys(keyStack, setmode);

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

  // On Initial Mount
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
            isSelectedType(...ViewportInteractionAllowed)
          ) {
            const scalingFactor =
              Math.sign(ev.deltaY) < 0
                ? 0.1 /** scrollup */
                : -0.1; /** scroll down */
            const scalingVector = getVector3Component(
              new Vector3(scalingFactor, scalingFactor, scalingFactor),
              window.workingAxis
            );

            doForSelectedItems((x) => {
              (x as THREE.Mesh).scale.add(scalingVector);
            });
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
