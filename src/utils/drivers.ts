import { DriverType } from "../enums";
import {
  addAnimationStep,
  AnimationFunction,
  updateAnimationStep,
} from "./animations";
import { isSyntaxOk } from "./validity";

export interface BaseDriver {
  objectId: number;
  expression: string;
  type: DriverType;
}

export interface NumericDriver extends BaseDriver {
  getter: (arg: THREE.Object3D) => number;
  setter: (arg: number) => void;
  type: DriverType.numeric;
}

export interface StringDriver extends BaseDriver {
  getter: (arg: THREE.Object3D) => string;
  setter: (arg: string) => void;
  type: DriverType.string;
}

export type Driver = NumericDriver | StringDriver;

export const testDriver = (expression: string) => `
const own = 3;
const te = 3;
const [sin, cos, tan, pi, time] = [Math.sin, Math.cos, Math.tan, Math.PI, + new Date()];
const [timed, timeS, timeD, timeM] = [time/100, time/1000, time/10000, time/60000];
return(${expression});
`;

/**
 * Provides an animation function corresponding to the given driver.
 * @param driver The Driver
 * @returns The Animation Function or Null for syntax errors
 */
const preparedDriver = (driver: Driver) => {
  if (!isSyntaxOk(driver.expression)) return null;
  const driverObject = window.scene.getObjectById(driver.objectId);
  if (!driverObject) return null;
  /**
   * Animation function for a driver.
   * See animations.ts
   * @param timeElapsed Time Elapsed since last frame
   */
  const driverFunction: AnimationFunction = (timeElapsed: number) => {
    if (!driverObject) return;
    /**
     * Prepare constants for easy use
     */
    const preparedExpression = `
        const own = ${driver.getter(driverObject)};
        const te = ${timeElapsed};
        const [sin, cos, tan, pi, time] = [Math.sin, Math.cos, Math.tan, Math.PI, + new Date()];
        const [timed, timeS, timeD, timeM] = [time/100, time/1000, time/10000, time/60000];
        return(${driver.expression});
        `;

    // eslint-disable-next-line no-new-func
    const calculatedValue = new Function(preparedExpression)();

    /**
     * If driver type and calculated values match (both numeric),
     * use the setter
     */
    if (
      driver.type === DriverType.numeric &&
      typeof calculatedValue === "number"
    )
      driver.setter(calculatedValue);

    /**
     * If driver type and calculated values match (both string),
     * use the setter
     */
    if (
      driver.type === DriverType.string &&
      typeof calculatedValue === "string"
    )
      driver.setter(calculatedValue);
  };

  return driverFunction;
};

export const applyDriver = (driver: Driver, animationId = -1) => {
  const animationFunction = preparedDriver(driver);
  /** Syntax Error */
  if (!animationFunction) return null;
  /** First Time creating this driver */
  if (animationId < 0)
    return addAnimationStep(animationFunction as AnimationFunction);
  /** Updating this driver */
  return updateAnimationStep(
    animationId,
    animationFunction as AnimationFunction
  );
};
