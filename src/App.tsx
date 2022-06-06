import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect, useState } from "react";
import { viewportInit } from "./three/viewport";
import { viewportAddMenu } from "./contextMenus/viewportAdd/viewportAdd";
import { ViewportEventType, ViewportModes, WorkingAxes } from "./enums";
import { isSelectedType } from "./utils/validity";
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from "./utils/transactions";
import { loadFBXModel, loadGLTFModel } from "./utils/models";
import {
  doForSelectedItems,
  getMousePositionIn3D,
  getVector3Component,
  keepTrackOfCursor,
  randomColor,
} from "./utils/utils";
import { ViewportInteractionAllowed } from "./utils/constants";
import { handleHotkeys } from "./utils/viewportHotkeys";
import TransformsMenu from "./components/TransformsMenu/TransformsMenu";
import { Vector3 } from "three";
import { grab, rotate } from "./utils/transforms";
import { numSelected } from "./utils/selection";
import { coalesceVEHistory } from "./utils/memory";

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

let eventHistoryBroomPoller: NodeJS.Timer;

/**
 * The Outermost React Component
 */
const App = () => {
  const [keyStack, setkeyStack] = useState([] as KeyboardEvent["key"][]);
  const [mode, setmode] = useState(ViewportModes.navigate);
  const [selectedItemsCount, setselectedItemsCount] = useState(0);

  /** Initializations on First Mount */
  useEffect(() => {
    /** Initialize the ThreeJs Scene */
    viewportInit();

    /** Keep track of the Cursor */
    document.addEventListener("mousemove", keepTrackOfCursor, false);

    /** We're handling drag and drop, don't let the browser do it. */
    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", preventDefault, false);

    /** Polling for high memory usage and cleaning up */
    eventHistoryBroomPoller = setInterval(() => {
      /** Coalesce first half of events if event history is large */
      /** See memory.ts */
      if (window.viewportEventHistory.length > 500)
        coalesceVEHistory(window.viewportEventHistory.length / 2);
    }, 60000 /** Every Minute */);

    return () => {
      // Cleanup
      document.removeEventListener("mousemove", keepTrackOfCursor, false);
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", preventDefault, false);
      if (eventHistoryBroomPoller) clearInterval(eventHistoryBroomPoller);
    };
  }, []);

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
      document.exitPointerLock();
    }

    /**
     * Lock the Pointer
     * and
     * Start Tranformation Transaction
     */
    if (
      [ViewportModes.grab, ViewportModes.rotate, ViewportModes.scale].includes(
        mode
      ) &&
      !window.pendingTransactions.length
    ) {
      document.getElementById("three-canvas")?.requestPointerLock();
      startTransaction(mode as unknown as ViewportEventType);
    }

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
          if (mode === ViewportModes.grab) grab(delta, currentPos, keyStack);

          /**
           * Handle Rotation
           */
          if (mode === ViewportModes.rotate) rotate(delta, currentPos);
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
        {/**
         * This is the ThreeJs Viewport's Parent Div
         */}
        <div
          onClick={() => {
            setselectedItemsCount(numSelected());
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
                  loadGLTFModel({
                    modelPath: modelURL,
                    /**
                     * Give the Model a good name
                     */
                    preprocess: (glb) => {
                      const name = model!.name.split("/").pop()?.split(".")[0];
                      if (name) glb.name = name + randomColor();
                    },
                  });
                  break;
                case "":
                  if (model!.name.endsWith(".fbx"))
                    loadFBXModel({
                      modelPath: modelURL,
                      /**
                       * Give the Model a good name
                       */
                      preprocess: (fbx) => {
                        const name = model!.name
                          .split("/")
                          .pop()
                          ?.split(".")[0];
                        if (name) fbx.name = name + randomColor();
                      },
                    });
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
            const direction =
              Math.sign(ev.deltaY) < 0
                ? 1 /** Scroll Up */
                : -1; /** Scroll Down */

            switch (mode) {
              case ViewportModes.grab:
                if (
                  ![WorkingAxes.x, WorkingAxes.y, WorkingAxes.z].includes(
                    window.workingAxis
                  )
                )
                  break; // Gaurd

                grab([direction, direction, direction], 1);
                break;
              case ViewportModes.rotate:
                if (
                  ![WorkingAxes.x, WorkingAxes.y, WorkingAxes.z].includes(
                    window.workingAxis
                  )
                )
                  break; // Gaurd

                rotate([direction, direction, direction], 1);
                break;
              case ViewportModes.scale:
                if (!isSelectedType(...ViewportInteractionAllowed)) break; // Gaurd
                const scalingFactor = direction / 10;
                const scalingVector = getVector3Component(
                  new Vector3(scalingFactor, scalingFactor, scalingFactor),
                  window.workingAxis
                );

                doForSelectedItems((x) => {
                  (x as THREE.Mesh).scale.add(scalingVector);
                });
                break;
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
