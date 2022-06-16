import "./App.css";
import ContextMenuWrapperDiv from "./components/ContextMenu/ContextMenuWrapperDiv";
import styles from "./App.module.css";
import { useEffect, useState } from "react";
import { controls, viewportInit, viewportMode } from "./three/viewport";
import { viewportAddMenu } from "./contextMenus/viewportAdd/viewportAdd";
import { ViewportEventType, ViewportModes, WorkingAxes } from "./enums";
import { isSelectedType } from "./utils/validity";
import {
  commitTransaction,
  isTransactionPending,
  rollbackTransaction,
  startTransaction,
} from "./utils/transactions";
import { loadFBXModel, loadGLTFModel } from "./utils/loaders";
import {
  doForSelectedItems,
  getMousePositionIn3D,
  getVector3Component,
  randomColor,
} from "./utils/utils";
import {
  viewportDivClassName,
  ViewportInteractionAllowed,
} from "./utils/constants";
import { handleHotkeys } from "./utils/viewportHotkeys";
import TransformsMenu from "./components/TransformsMenu/TransformsMenu";
import { Vector3 } from "three";
import { grab, rotate } from "./utils/transforms";
import { numSelected, selectedItems } from "./utils/selection";
import { coalesceVEHistory } from "./utils/memory";
import SidePanel from "./components/SidePanel/SidePanel";
import { keepTrackOfCursor, ndcMousePosition } from "./utils/mouse";
import { viewportEventHistory } from "./utils/events";

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

/** Event That'll poll for large memory usage by VE history and clean it up */
let eventHistoryBroomPoller: NodeJS.Timer;

/**
 * The Outermost React Component
 */
const App = () => {
  const [keyStack, setkeyStack] = useState([] as KeyboardEvent["key"][]);
  const [workingAxis, setworkingAxis] = useState(WorkingAxes.all);
  const [mode, setMode] = useState(ViewportModes.navigate);
  const [selectedItemsCount, setselectedItemsCount] = useState(0);

  const setmode = (arg: ViewportModes) => {
    setMode(arg);
    viewportMode.value = arg;
  };

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
      if (viewportEventHistory.length > 10000)
        coalesceVEHistory(viewportEventHistory.length / 2);
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
    let mouseDeltaInterval: NodeJS.Timer;

    /**
     * We Only want Orbital Controls in Navigate Mode
     */
    if (controls) {
      if (mode !== ViewportModes.navigate) controls.enabled = false;
      else controls.enabled = true;
    }

    /**
     * Whenever we change modes from navigate,
     * we want the Working Axis to be 'All'.
     */
    if (mode === ViewportModes.navigate) {
      setworkingAxis(WorkingAxes.all);
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
      !isTransactionPending()
    ) {
      document.getElementById("three-canvas")?.requestPointerLock();
      startTransaction(mode as unknown as ViewportEventType);
    }

    /**
     * Grab and Rotate Logic
     */
    if ([ViewportModes.grab, ViewportModes.rotate].includes(mode)) {
      let prevPos = getMousePositionIn3D(ndcMousePosition);
      if (!selectedItems) return;

      /**
       * We using an interval instead of mouse move to get a more accurate
       * direction vector of the moved cursor.
       */
      mouseDeltaInterval = setInterval(() => {
        const currentPos = getMousePositionIn3D(ndcMousePosition);
        const delta = currentPos.clone().sub(prevPos);
        if (selectedItems) {
          /**
           * Handle Grab
           */
          if (mode === ViewportModes.grab)
            grab(delta, currentPos, workingAxis, keyStack);

          /**
           * Handle Rotation
           */
          if (mode === ViewportModes.rotate)
            rotate(delta, currentPos, workingAxis);
        }
        prevPos = currentPos;
      }, 10);
    }

    return () => {
      if (mouseDeltaInterval) clearInterval(mouseDeltaInterval);
    };
  }, [keyStack, mode, workingAxis]);

  /**
   * Handle the Key Stack
   */
  useEffect(() => {
    /**
     * React to Changes
     */
    handleHotkeys(keyStack, setmode, { get: workingAxis, set: setworkingAxis });

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
  }, [keyStack, workingAxis]);

  return (
    <div className={`App ${styles.App}`}>
      {/* Header Menu */}
      <div className={`${styles.headerMenu}`} />
      <div className={`${styles.Main}`}>
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
                        const name = model!.name
                          .split("/")
                          .pop()
                          ?.split(".")[0];
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
                      workingAxis
                    )
                  )
                    break; // Gaurd

                  grab([direction, direction, direction], 1, workingAxis);
                  break;
                case ViewportModes.rotate:
                  if (
                    ![WorkingAxes.x, WorkingAxes.y, WorkingAxes.z].includes(
                      workingAxis
                    )
                  )
                    break; // Gaurd

                  rotate([direction, direction, direction], 1, workingAxis);
                  break;
                case ViewportModes.scale:
                  if (!isSelectedType(...ViewportInteractionAllowed)) break; // Gaurd
                  const scalingFactor = direction / 10;
                  const scalingVector = getVector3Component(
                    new Vector3(scalingFactor, scalingFactor, scalingFactor),
                    workingAxis
                  );

                  doForSelectedItems((x) => {
                    (x as THREE.Mesh).scale.add(scalingVector);
                  });
                  break;
              }
            }}
            className={`${styles.viewport} ${viewportDivClassName}`}
          />
          {selectedItemsCount === 1 && <TransformsMenu />}
        </ContextMenuWrapperDiv>
        <SidePanel />
      </div>
    </div>
  );
};

export default App;
