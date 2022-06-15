import { ViewportModes, ViewportEventType, WorkingAxes } from "../enums";
import {
  defaultViewportCamera,
  getViewportCamera,
  outlinePass,
  scene,
  setViewportCamera,
  viewportMode,
} from "../three/viewport";
import {
  CameraTypes,
  LightTypes,
  MeshyTypes,
  ViewportInteractionAllowed,
} from "./constants";
import { getLatestVE, reloadFromVE, viewportEventHistory } from "./events";
import {
  isMultiselect,
  properSelected,
  selectedItems,
  selectObject3D,
  turnMultiselect,
} from "./selection";
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
  setmode: (arg: ViewportModes) => void,
  workingAxis: { get: WorkingAxes; set: (arg: WorkingAxes) => void }
) => {
  /**
   * Reset All the Values we only want
   * working on Hold.
   */
  if (isMultiselect) turnMultiselect(false);

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
      console.log({
        outline: outlinePass.selectedObjects,
        selected: selectedItems,
        veh: viewportEventHistory,
        scene,
      });
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
      if (viewportMode.value === ViewportModes.navigate) {
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.x); // Change Working Axis
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.y);
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.z);
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.notx);
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.noty);
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
        ].includes(viewportMode.value)
      )
        workingAxis.set(WorkingAxes.notz);
      break;

    /**
     * G: Toggles Grab Viewport Mode
     *
     */
    case "g":
      if (!selectedItems.length) break;
      if (isSelectedType(...ViewportInteractionAllowed))
        viewportMode.value === ViewportModes.grab
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
        viewportMode.value === ViewportModes.rotate
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
        viewportMode.value === ViewportModes.scale
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
      if (!isMultiselect) turnMultiselect(true);
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
        if (getViewportCamera().id === selected[0].id)
          setViewportCamera(defaultViewportCamera);
        else {
          setViewportCamera(selected[0] as THREE.PerspectiveCamera);
          selectObject3D(null, true);
        }
      }

      if (
        !selected.length &&
        getViewportCamera().id !== defaultViewportCamera.id
      )
        setViewportCamera(defaultViewportCamera);

      break;
  }
};
