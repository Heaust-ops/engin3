import { ViewportModes, ViewportEventType, WorkingAxes } from "../enums";
import {
  CameraTypes,
  LightTypes,
  MeshyTypes,
  ViewportInteractionAllowed,
} from "./constants";
import { getLatestVE, reloadFromVE } from "./events";
import { properSelected, selectedItems } from "./selection";
import {
  rollbackTransaction,
  startTransaction,
  removeSelectedMesh,
  commitTransaction,
  isTransactionPending,
} from "./transactions";
import { doForSelectedItems, makeGroup, unmakeGroup } from "./utils";
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
      if (!selectedItems.length) break;
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
      if (!selectedItems.length) break;
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
      if (!selectedItems.length) break;
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.scale
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.scale);
      break;

    /**
     * Shift + D: Duplicates Selected
     */
    case "shiftd":
      if (!selectedItems.length) break;
      if (isTransactionPending()) commitTransaction();
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

    /**
     * B: Handles Grouping, UnGrouping and DL target (Bind)
     *
     * Groupes a number of objects together,
     * Undoes a Group,
     * Used to set the target of directional light
     */
    case "b":
      const selected = properSelected();

      /**
       * Set the target of directional light
       * If a directional light and 1 Other Object3D is selected
       */
      if (
        selected.length === 2 &&
        isSelectedType("DirectionalLight", "SpotLight")
      ) {
        let light: THREE.DirectionalLight | THREE.SpotLight,
          object: THREE.Object3D;
        light = LightTypes.includes(selected[0].type)
          ? (selected[0] as THREE.DirectionalLight | THREE.SpotLight)
          : (selected[1] as THREE.DirectionalLight | THREE.SpotLight);
        object = MeshyTypes.includes(selected[0].type)
          ? (selected[0] as THREE.Object3D)
          : (selected[1] as THREE.Object3D);
        light.target = object;
        return;
      }

      /**
       * Group Objects
       */
      if (selected.length > 1) {
        makeGroup(selectedItems);
        return;
      }

      /**
       * Ungroup a group
       */
      if (selected.length === 1 && selected[0].type === "Group") {
        unmakeGroup(selected[0] as THREE.Group);
      }

      /**
       * Camera binding, changing
       */
      if (selected.length === 1 && CameraTypes.includes(selected[0].type)) {
        if (window.viewportCamera.id === selected[0].id)
          window.viewportCamera = window.defaultViewportCamera;
        else window.viewportCamera = selected[0] as THREE.PerspectiveCamera;
      }

      if (
        !selected.length &&
        window.viewportCamera.id !== window.defaultViewportCamera.id
      )
        window.viewportCamera = window.defaultViewportCamera;

      break;
  }
};
