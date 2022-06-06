import {
  ViewportModes,
  ViewportEventType,
  WorkingAxes,
} from "../enums";
import {
  LightTypes,
  MeshyTypes,
  ViewportInteractionAllowed,
} from "./constants";
import { getLatestVE, reloadFromVE } from "./events";
import { properSelected } from "./selection";
import {
  rollbackTransaction,
  startTransaction,
  removeSelectedMesh,
  commitTransaction,
} from "./transactions";
import { doForSelectedItems } from "./utils";
import { isSelectedType } from "./validity";

/**
 * The Function that handles hotkeys.
 * @param hotkeyStack The stack that contains currently pressed keys
 * @param setmode State Setter for changing modes
 */
export const handleHotkeys = (
  hotkeyStack: KeyboardEvent["key"][],
  setmode: (arg: ViewportModes) => void
) => {
  /**
   * Reset All the Values we only want
   * working on Hold.
   */
  if (window.multiselect) window.multiselect = false;

  /**
   * Handle Keys
   */
  switch (hotkeyStack.join("")) {
    /**
     * Ctrl + Z: Undo
     */
    case "controlz":
      rollbackTransaction();
      break;

    /**
     * O: Presently used as a debugging key
     */
    case "o":
      break;

    /**
     * X: Depends on Context
     *
     * Navigate Mode: Deletes Selected
     *
     * Grab, Rotate, Scale: Changes Working Axis to X
     *
     */
    case "x":
      if (window.viewportMode === ViewportModes.navigate) {
        /**
         * Delete
         */
        startTransaction(ViewportEventType.deleteMesh);
        removeSelectedMesh();
        commitTransaction();
      } else if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.x; // Change Working Axis
      break;

    /**
     * Y: Depends on Context
     *
     * Grab, Rotate, Scale: Changes Working Axis to Y
     *
     */
    case "y":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.y;
      break;

    /**
     * Z: Depends on Context
     *
     * Grab, Rotate, Scale: Changes Working Axis to Z
     *
     */
    case "z":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.z;
      break;

    /**
     * Shift + X: Depends on Context
     *
     * Grab, Rotate, Scale: Changes Working Axis to Not X
     *
     */
    case "shiftx":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.notx;
      break;

    /**
     * Shift + Y: Depends on Context
     *
     * Grab, Rotate, Scale: Changes Working Axis to Not Y
     *
     */
    case "shifty":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.noty;
      break;

    /**
     * Shift + Z: Depends on Context
     *
     * Grab, Rotate, Scale: Changes Working Axis to Not Z
     *
     */
    case "shiftz":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.notz;
      break;

    /**
     * G: Toggles Grab Viewport Mode
     *
     */
    case "g":
      if (!window.selectedItems.length) break;
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.grab
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.grab);
      break;

    /**
     * R: Toggles Rotate Viewport Mode
     *
     */
    case "r":
      if (!window.selectedItems.length) break;
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.rotate
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.rotate);
      break;

    /**
     * S: Toggles Scale Viewport Mode
     *
     */
    case "s":
      if (!window.selectedItems.length) break;
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.scale
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.scale);
      break;

    /**
     * Shift + D: Duplicates Selected
     */
    case "shiftd":
      if (!window.selectedItems.length) break;
      if (window.pendingTransactions.length) commitTransaction();
      if (isSelectedType(...ViewportInteractionAllowed)) {
        doForSelectedItems((x) => {
          const ve = getLatestVE(
            ViewportEventType.loadMesh,
            null,
            (ve) => ve.info.objectID === x.id
          );
          if (ve) reloadFromVE(ve, true);
        });
        setmode(ViewportModes.grab);
      }
      break;

    /**
     * Shift (Hold): Allows Multiple Objects to be Selected
     */
    case "shift":
      if (!window.multiselect) window.multiselect = true;
      break;

    case "b":
      const selected = properSelected(window.selectedItems);
      if (selected.length !== 2 || !isSelectedType("DirectionalLight")) return;
      let light: THREE.DirectionalLight, object: THREE.Object3D;
      light = LightTypes.includes(selected[0].type)
        ? (selected[0] as THREE.DirectionalLight)
        : (selected[1] as THREE.DirectionalLight);
      object = MeshyTypes.includes(selected[0].type)
        ? (selected[0] as THREE.Object3D)
        : (selected[1] as THREE.Object3D);
      light.target = object;
      break;
  }
};
