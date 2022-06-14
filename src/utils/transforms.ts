import { Vector3 } from "three";
import { WorkingAxes } from "../enums";
import { getVector3Component, doForSelectedItems } from "./utils";

/**
 * Moves an object in a specific direction
 * @param delta Direction to move in
 * @param factor the facotr by which to move, if a vector is given
 * this operation
 *
 * factor.lengthSq() ^ (1/4)
 *
 * will convert it into scalar.
 * @param keyStack The stack that handles hotkeys,
 * Needed as holding shift does discrete steps.
 */
export const grab = (
  delta: THREE.Vector3 | [number, number, number],
  factor: THREE.Vector3 | number,
  workingAxis: WorkingAxes,
  keyStack?: string[]
) => {
  if (delta instanceof Array) delta = new Vector3(...delta);
  const translateComponent = getVector3Component(delta, workingAxis);
  if (typeof factor === "number") translateComponent.normalize();
  const shift = translateComponent.multiplyScalar(
    typeof factor === "number" ? factor : Math.pow(factor.lengthSq(), 1 / 4)
  );

  /**
   * Do Discrete Steps if Shift is held
   */
  if (keyStack && keyStack.join("") === "shift") {
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
};

/**
 * rotates an object in a specific direction
 * @param delta Direction to rotate in
 * @param factor the factor by which to rotate
 */
export const rotate = (
  delta: THREE.Vector3 | [number, number, number],
  factor: THREE.Vector3 | number,
  workingAxis: WorkingAxes
) => {
  if (delta instanceof Array) delta = new Vector3(...delta);
  const componentVector = getVector3Component(
    new Vector3(1, 1, 1),
    workingAxis
  );

  const angularVector =
    typeof factor === "number" ? null : delta.cross(factor).normalize();

  const angularComp =
    typeof factor === "number"
      ? factor
      : -Math.abs(angularVector!.dot(componentVector));

  const axis = new Vector3(
    delta.x * componentVector.x,
    delta.y * componentVector.y,
    delta.z * componentVector.z
  );

  doForSelectedItems((x) => {
    x.rotateOnWorldAxis(axis.normalize(), angularComp / 7.5);
  });
};
