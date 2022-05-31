import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect, useState } from "react";
import { viewportInit } from "./three/viewport";
import { viewportAddMenu } from "./contextMenus/viewportAdd/viewportAdd";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ViewportEventType, ViewportModes, WorkingAxes } from "./enums";
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
import TransformsMenu from "./components/TransformsMenu/TransformsMenu";

/**
 * Heap Variables
 */
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

/**
 * Keeps the Mouse Position on heap fresh.
 * @param mouseMoveEvent Mouse Move Event
 */
const keepTrackOfCursor = (mouseMoveEvent: MouseEvent) => {
  window.mousePosition.x = mouseMoveEvent.pageX;
  window.mousePosition.y = mouseMoveEvent.pageY;
};

/**
 * Because Writing (ev) => ev.preventDefault();
 * is tiring.
 */
const preventDefault = (ev: Event) => {
  ev.preventDefault();
};

/**
 * A Hotkey - Menu Map,
 * If you wanna add Menus,
 * do it here
 */
const menus = {
  hotkeys: {
    shifta: viewportAddMenu,
  },
};

/**
 * The Outermost React Component
 */
const App = () => {
  const [keyStack, setkeyStack] = useState([] as KeyboardEvent["key"][]);
  const [mode, setmode] = useState(ViewportModes.navigate);
  const [selectedItemsCount, setselectedItemsCount] = useState(0);

  /**
   * Regulating Mode Changes & Implementing Mode Logic
   */
  useEffect(() => {
    window.viewportMode = mode;
    let mouseDeltaInterval: NodeJS.Timer;

    /**
     * We Only want Orbital Controls in Navigate Mode
     */
    if (window.controls) {
      if (mode !== ViewportModes.navigate) window.controls.enabled = false;
      else window.controls.enabled = true;
    }

    /**
     * Whenever we change modes from navigate,
     * we want the Working Axis to be 'All'.
     */
    if (mode === ViewportModes.navigate) {
      window.workingAxis = WorkingAxes.all;
    }

    /**
     * Start Tranformation Transaction
     */
    if (
      [ViewportModes.grab, ViewportModes.rotate, ViewportModes.scale].includes(
        mode
      ) &&
      !window.pendingTransactions.length
    )
      startTransaction(mode as unknown as ViewportEventType);

    /**
     * Grab and Rotate Logic
     */
    if ([ViewportModes.grab, ViewportModes.rotate].includes(mode)) {
      let prevPos = getMousePositionIn3D(window.ndcMousePosition);
      if (!window.selectedItems) return;

      /**
       * We using an interval instead of mouse move to get a more accurate
       * direction vector of the moved cursor.
       */
      mouseDeltaInterval = setInterval(() => {
        const currentPos = getMousePositionIn3D(window.ndcMousePosition);
        const delta = currentPos.clone().sub(prevPos);
        if (window.selectedItems) {
          /**
           * Handle Grab
           */
          if (mode === ViewportModes.grab) {
            const translateComponent = getVector3Component(
              delta,
              window.workingAxis
            );
            const shift = translateComponent.multiplyScalar(
              Math.pow(currentPos.lengthSq(), 1 / 4)
            );

            /**
             * Do Discrete Steps if Shift is held
             */
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

          /**
           * Handle Rotation
           */
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

  /**
   * Handle the Key Stack
   */
  useEffect(() => {
    /**
     * React to Changes
     */
    handleHotkeys(keyStack, setmode);

    /**
     * Add keys to the Key Stack
     * @param ev Key Down Event
     */
    const onKeyDown = (ev: KeyboardEvent) => {
      const targetKey = ev.key.toLowerCase();

      /**
       * If the key is just pressed,
       * It shouldn't already be anywhere in the stack.
       * Ensure that.
       */
      if (keyStack.indexOf(targetKey) >= 0)
        setkeyStack(keyStack.filter((el) => el !== targetKey));

      /**
       * Push the Key to the Stack
       */
      if (!keyStack.includes(targetKey)) setkeyStack([...keyStack, targetKey]);
    };

    /**
     * Release Keys from the Stack
     * @param ev Key Up Event
     */
    const onKeyUp = (ev: KeyboardEvent) => {
      const targetKey = ev.key.toLowerCase();

      if (keyStack.indexOf(targetKey) >= 0)
        setkeyStack(keyStack.filter((el) => el !== targetKey));
    };

    /** Implement Key Stack Handlers */
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      // Cleanup
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [keyStack]);

  /** Initializations on First Mount */
  useEffect(() => {
    /** Initialize the ThreeJs Scene */
    viewportInit();

    /** Keep track of the Cursor */
    document.addEventListener("mousemove", keepTrackOfCursor, false);

    /** We're handling drag and drop, don't let the browser do it. */
    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", preventDefault, false);

    return () => {
      // Cleanup
      document.removeEventListener("mousemove", keepTrackOfCursor, false);
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", preventDefault, false);
    };
  }, []);

  return (
    <div className={`App ${styles.App}`}>
      {/* Header Menu */}
      <div className={`${styles.headerMenu}`}></div>

      {/* Context Menu */}
      <ContextMenuWrapperDiv
        style={{ position: "relative" }}
        menus={menus}
        className={`${styles.viewportWrapper}`}
        keyStack={keyStack}
      >
        {
          /**
           * This is the ThreeJs Viewport's Parent Div
           */
        }
        <div
          onClick={() => {
            setselectedItemsCount(window.selectedItems.length);
          }}
          onDrop={(ev) => {
            /**
             * If a Model is Dropped, Load it into the Scene,
             * Works rn for:
             * - FBX
             * - GLTF
             */
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
              case 0 /** Left Click */:
                /**
                 * In Modes Grab, Scale and Rotate,
                 * We're done with the transaction on left click,
                 * Finalize Changes
                 */
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

              case 1 /** Middle Click */:
                break;

              /**
               * In Modes Grab, Scale and Rotate,
               * We're wanna undo / cancel the transaction on right click,
               * Finalize Changes and then Undo
               */
              case 2 /** Right Click */:
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
            /**
             * Wheel / Scroll Logic is Implemented here
             */

            /**
             * Handle Scaling
             */
            if (
              window.viewportMode === ViewportModes.scale &&
              isSelectedType(...ViewportInteractionAllowed)
            ) {
              const scalingFactor =
                Math.sign(ev.deltaY) < 0
                  ? 0.1 /** Scroll Up */
                  : -0.1; /** Scroll Down */
              const scalingVector = getVector3Component(
                new Vector3(scalingFactor, scalingFactor, scalingFactor),
                window.workingAxis
              );

              doForSelectedItems((x) => {
                (x as THREE.Mesh).scale.add(scalingVector);
              });
            }
          }}
          className={`${styles.viewport} viewport`}
        />
        {selectedItemsCount === 1 && <TransformsMenu />}
      </ContextMenuWrapperDiv>

      {/* SidePanel */}
      <div className={`${styles.sidePanel}`}></div>
    </div>
  );
};

export default App;
