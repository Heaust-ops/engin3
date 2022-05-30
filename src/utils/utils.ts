import { Vector3 } from "three";
import { WorkingAxes } from "../enums";
import { MousePosition } from "../interfaces";

export const doForSelectedItems = (
  action: (selectedItem: THREE.Object3D) => void
) => {
  if (window.selectedItems.length) window.selectedItems.forEach(action);
};

/**
 * Highlights passed objects
 * @param args The 3D Objects to highlight
 */
export const highlightObjects = (args: THREE.Object3D[]) => {
  window.outlinePass.selectedObjects = args;
};

/**
 * Selects 3D Object(s) programmatically
 * @param arg The 3D Object to Select
 */
export const selectObject3D = (
  arg: THREE.Object3D | THREE.Object3D[],
  strict = false
) => {
  if (!window.selectedItems) window.selectedItems = [];
  if (arg instanceof Array) {
    /**
     * For Many Objects
     */
    if (strict) {
      window.selectedItems = arg;
      window.outlinePass.selectedObjects = arg;
    } else {
      window.selectedItems.concat(arg);
      window.outlinePass.selectedObjects.concat(arg);
    }
  } else {
    /**
     * For only one Object
     */
    if (strict) {
      window.selectedItems = [arg];
      window.outlinePass.selectedObjects = [arg];
    } else {
      window.selectedItems.push(arg);
      window.outlinePass.selectedObjects.push(arg);
    }
  }
};

/**
 * UnSelects 3D Object(s) programmatically
 * @param arg The 3D Object to Select
 */
export const unselectObject3D = (args: THREE.Object3D[] | THREE.Object3D) => {
  if (!(args instanceof Array)) args = [args];
  args.forEach((arg) => {
    if (!window.selectedItems) return;
    const findIndex0 = window.selectedItems.findIndex((a) => a.id === arg.id);
    findIndex0 !== -1 && window.selectedItems.splice(findIndex0, 1);

    const findIndex1 = window.outlinePass.selectedObjects.findIndex(
      (a) => a.id === arg.id
    );
    findIndex1 !== -1 &&
      window.outlinePass.selectedObjects.splice(findIndex1, 1);
  });
};

/**
 *
 * @param ndcMousePosition Optional: The Normalized Device Coordinates / the normalized mouse position.
 *
 * If not given assumes the current one.
 * @returns The Vector3 equivalent in the 3D world.
 */
export const getMousePositionIn3D = (ndcMousePosition?: MousePosition) => {
  if (!ndcMousePosition) ndcMousePosition = window.ndcMousePosition;
  const coords = new Vector3(ndcMousePosition.x, ndcMousePosition.y, 0);
  const origin = new Vector3();
  const direction = new Vector3(0, 0, -1);
  origin.setFromMatrixPosition(window.viewportCamera.matrixWorld);
  direction
    .set(coords.x, coords.y, 0.5)
    .unproject(window.viewportCamera)
    .sub(origin)
    .normalize();

  const vectorin3d = new Vector3()
    .copy(direction)
    .multiplyScalar(10)
    .add(origin);

  return vectorin3d;
};

/**
 *
 * @param vec A Vector3
 * @param axis The WorkingAxis on which the component is required
 * @returns The Vector Component on that WorkingAxis
 */
export const getVector3Component = (vec: Vector3, axis: WorkingAxes) => {
  switch (axis) {
    case WorkingAxes.all:
      return vec;
    case WorkingAxes.x:
      return new Vector3(vec.x, 0, 0);
    case WorkingAxes.y:
      return new Vector3(0, vec.y, 0);
    case WorkingAxes.z:
      return new Vector3(0, 0, vec.z);
    case WorkingAxes.notx:
      return new Vector3(0, vec.y, vec.z);
    case WorkingAxes.noty:
      return new Vector3(vec.x, 0, vec.z);
    case WorkingAxes.notz:
      return new Vector3(vec.x, vec.y, 0);
  }
};
