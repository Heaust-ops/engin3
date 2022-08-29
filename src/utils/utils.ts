import { Group, Vector3 } from "three";
import { WorkingAxes } from "../enums";
import { scene, getViewportCamera } from "../three/viewport";
import { MousePosition, ndcMousePosition } from "./mouse";
import { isAnySelected, selectedItems } from "./selection";

/**
 * Misc Utilities,
 * Helper Functions
 * etc
 */
/** ================= */
/** */

/**
 * @param func the function to perform
 * @param delay the duration of debounce
 * @returns A function that can only be used every "delay" seconds
 */
export const debounce = (func: Function, delay: number) => {
  let debounceTimer: NodeJS.Timer;
  return function (this: void) {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
};

/**
 * Returns the character counts of a string
 * @param arg The string you wnat the char count of
 * @returns a Dict of char counts
 * example: {
 *    "s": 2,
 *    "d": 2,
 *    "j": 1,
 *    "a": 2
 *  }
 */
export const getCharacterFrequency = (arg: string) => {
  return arg.split("").reduce((total: { [k: string]: number }, letter) => {
    total[letter] ? total[letter]++ : (total[letter] = 1);
    return total;
  }, {});
};

/**
 * Performs an action for all selected Items
 * @param action Action to perform
 */
export const doForSelectedItems = (
  action: (selectedItem: THREE.Object3D) => void
) => {
  if (isAnySelected()) selectedItems.forEach(action);
};

/**
 * Returns the target of a helper given the helper
 * @param arg the helper whose target we want
 * @returns The target of the helper if it has one, null otherwise
 */
export const getHelperTarget = (arg: THREE.Object3D | null) => {
  if (!arg) return null;

  // Actually select the Lights if selected helper
  if ((arg as THREE.PointLightHelper)?.light) {
    return (arg as THREE.PointLightHelper).light;
  }

  // Actually select the Camera if selected helper
  if ((arg as THREE.CameraHelper)?.camera) {
    return (arg as THREE.CameraHelper).camera;
  }

  return null;
};

/**
 * Returns ther helper of an object given the object itself
 * @param arg the object whose helper we want
 * @returns The helper of the object if it has one
 */
export const getHelper = (arg: THREE.Object3D) => {
  let helper: THREE.PointLightHelper | THREE.CameraHelper | null = null;
  if (arg.type.includes("Light")) {
    scene.traverse((item) => {
      if (
        item.type.includes("LightHelper") &&
        (item as THREE.PointLightHelper).light.id === arg.id
      )
        helper = item as THREE.PointLightHelper;
    });
  }

  if (arg.type.includes("Camera")) {
    scene.traverse((item) => {
      if (
        item.type.includes("CameraHelper") &&
        (item as THREE.CameraHelper).camera.id === arg.id
      )
        helper = item as THREE.CameraHelper;
    });
  }

  return helper;
};

/**
 *
 * @param ndc Optional: The Normalized Device Coordinates / the normalized mouse position.
 *
 * If not given assumes the current one.
 * @returns The Vector3 equivalent in the 3D world.
 */
export const getMousePositionIn3D = (ndc?: MousePosition) => {
  if (!ndc) ndc = ndcMousePosition;
  const coords = new Vector3(ndc.x, ndc.y, 0);
  const origin = new Vector3();
  const direction = new Vector3(0, 0, -1);
  origin.setFromMatrixPosition(getViewportCamera().matrixWorld);
  direction
    .set(coords.x, coords.y, 0.5)
    .unproject(getViewportCamera())
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

/**
 * Takes an Array of 3D Objects and
 * moves them into a group
 *
 * @param items The Array of Items
 */
export const makeGroup = (items: THREE.Object3D[]) => {
  const group = new Group();
  items.forEach((item) => {
    scene.remove(item);
    group.add(item);
  });
  scene.add(group);
};

/**
 * Unmakes a group.
 * i.e. The children of the group won't be grouped
 * anymore / exist independantly
 *
 * @param group The Group to Unmake
 */
export const unmakeGroup = (group: THREE.Group) => {
  for (let i = group.children.length - 1; i >= 0; i--) {
    scene.attach(group.children[i]);
  }
  scene.remove(group);
};

/**
 * @returns Random Hex String ('#' not included)
 */
export const randomColor = () =>
  Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0");
