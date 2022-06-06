import { Group, Vector3 } from "three";
import { WorkingAxes } from "../enums";
import { MousePosition } from "../interfaces";

/**
 * Misc Utilities,
 * Helper Functions
 * etc
 */
/** ================= */
/** */

/**
 * Performs an action for all selected Items
 * @param action Action to perform
 */
export const doForSelectedItems = (
  action: (selectedItem: THREE.Object3D) => void
) => {
  if (window.selectedItems.length) window.selectedItems.forEach(action);
};

/**
 * Keeps the Mouse Position on heap fresh.
 * @param mouseMoveEvent Mouse Move Event
 */
export const keepTrackOfCursor = (mouseMoveEvent: MouseEvent) => {
  if (document.pointerLockElement) {
    /**
     * If the pointer is locked, update by using movement.
     */
    const radius = 20;
    const { width, height } = document.getElementById(
      "three-canvas"
    ) as HTMLCanvasElement;
    window.mousePosition.x += mouseMoveEvent.movementX;
    window.mousePosition.y += mouseMoveEvent.movementY;
    if (window.mousePosition.x > width + radius) {
      window.mousePosition.x = -radius;
    }
    if (window.mousePosition.y > height + radius) {
      window.mousePosition.y = -radius;
    }
    if (window.mousePosition.x < -radius) {
      window.mousePosition.x = width + radius;
    }
    if (window.mousePosition.y < -radius) {
      window.mousePosition.y = height + radius;
    }
  } else {
    /**
     * Update Normally
     */
    window.mousePosition.x = mouseMoveEvent.pageX;
    window.mousePosition.y = mouseMoveEvent.pageY;
  }
};

/**
 * Returns ther helper of an object given the object itself
 * @param arg the object whose helper we want
 * @returns The helper of the object if it has one
 */
export const getHelper = (arg: THREE.Object3D) => {
  let helper: THREE.PointLightHelper | null = null;
  if (arg.type.includes("Light")) {
    window.scene.traverse((item) => {
      if (
        item.type.includes("LightHelper") &&
        (item as THREE.PointLightHelper).light.id === arg.id
      )
        helper = item as THREE.PointLightHelper;
    });
  }

  return helper;
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

export const makeGroup = (items: THREE.Object3D[]) => {
  const group = new Group();
  items.forEach((item) => {
    window.scene.remove(item);
    group.add(item);
  });
  window.scene.add(group);
};

export const unmakeGroup = (group: THREE.Group) => {
  for (let i = group.children.length - 1; i >= 0; i--) {
    window.scene.attach(group.children[i]);
  }
  window.scene.remove(group);
};
