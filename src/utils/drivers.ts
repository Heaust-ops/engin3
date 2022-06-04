import { DriverType } from "../enums";
import {
  addAnimationStep,
  AnimationFunction,
  removeAnimationStep,
  updateAnimationStep,
} from "./animations";
import { isSyntaxOk } from "./validity";

export interface BaseDriver {
  objectId: number;
  property: string;
  expression: string;
  type: DriverType;
  animationId: number;
}

export interface NumericDriver extends BaseDriver {
  getter: () => number;
  setter: (arg: number) => void;
  type: DriverType.numeric;
}

export interface StringDriver extends BaseDriver {
  getter: () => string;
  setter: (arg: string) => void;
  type: DriverType.string;
}

export type Driver = NumericDriver | StringDriver;

export interface DriverRecord {
  id: number;
  getter: Driver["getter"];
}

export const testDriver = (expression: string) => `
const own = 3;
const te = 3;
const [sin, cos, tan, pi, time] = [Math.sin, Math.cos, Math.tan, Math.PI, + new Date()];
const [timed, timeS, timeD, timeM] = [time/100, time/1000, time/10000, time/60000];
return(${expression});
`;

/**
 * @param getter The Getter Of The Driver
 * @returns Index Of the Driver in the Driver Stack
 */
export const driverId = (objectId: number, property: string) => {
  let driverIndex = -1;
  window.driverStack.forEach((driver, index) => {
    if (driver.objectId === objectId && driver.property === property) {
      driverIndex = index;
    }
  });

  return driverIndex;
};

/**
 * @param getter The Getter Of the Driver you wanna get
 * @returns Driver if found, else null
 */
export const getDriver = (objectId: number, property: string) => {
  const id = driverId(objectId, property);
  if (id < 0) return null;
  return window.driverStack[id];
};

/**
 * Provides an animation function corresponding to the given driver.
 * @param driver The Driver
 * @returns The Animation Function or Null for syntax errors
 */
const prepareDriver = (driver: Driver) => {
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
        const own = ${driver.getter()};
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

/**
 * Creates or Updates a Driver
 * @param driver The Driver Object
 * @returns Animation Id
 */
export const applyDriver = (driver: Driver) => {
  const animationFunction = prepareDriver(driver);
  /** If Syntax Error */
  if (!animationFunction) return null;

  /** First Time creating this driver */
  if (driver.animationId < 0) {
    driver.animationId = addAnimationStep(
      animationFunction as AnimationFunction
    );
    window.driverStack.push(driver);
    return driver.animationId;
  }

  /** Updating this driver */
  window.driverStack[driverId(driver.objectId, driver.property)] = driver;
  return updateAnimationStep(
    driver.animationId,
    animationFunction as AnimationFunction
  );
};

/**
 * Gets rid of the driver and its animation.
 * @param getter The Getter of the Driver.
 * @returns Completion status, true or false
 */
export const deleteDriver = (objectId: number, property: string) => {
  const id = driverId(objectId, property);
  if (id < 0) return false;
  const driver = window.driverStack[id];
  removeAnimationStep(driver.animationId);
  window.driverStack.splice(id, 1);
  return true;
};

/**
 * @param getter Getter of the driver
 * @returns Animation Id of the driver if exists, -1 otherwise
 */
export const driverAnimationId = (objectId: number, property: string) => {
  const driver = getDriver(objectId, property);
  return driver ? driver.animationId : -1;
};
