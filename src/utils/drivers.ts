import { DriverType, ViewportEventType } from "../enums";
import {
  addAnimationStep,
  AnimationFunction,
  removeAnimationStep,
  updateAnimationStep,
} from "./animations";
import { DriverInfo, getLatestVE, ViewportEvent } from "./events";
import { isSyntaxOk } from "./validity";

export interface BaseDriver {
  objectID: number;
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
const [sign, pow, sq] = [Math.sign, Math.pow, (x)=>Math.pow(x, 2)];
const [sin, cos, tan, pi, time] = [Math.sin, Math.cos, Math.tan, Math.PI, + new Date()];
const [timed, timeS, timeD, timeM] = [time/100, time/1000, time/10000, time/60000];
return(${expression});
`;

/**
 * @param getter The Getter Of the Driver you wanna get
 * @returns Driver if found, else null
 */
export const getDriver = (objectId: number, property: string) => {
  const ve = getLatestVE(
    ViewportEventType.setDriver,
    null,
    (ve) =>
      ve.info.objectID === objectId &&
      !!(ve.info as DriverInfo).property &&
      (ve.info as DriverInfo).property === property
  );

  if (!ve) return null;
  if ((ve.info as DriverInfo).finalExpression === null) return null;

  const { initialExpression, finalExpression, ...tempDriver } =
    ve.info as DriverInfo;
  const driver = { ...tempDriver, expression: finalExpression };
  return driver;
};

/**
 * Provides an animation function corresponding to the given driver.
 * @param driver The Driver
 * @returns The Animation Function or Null for syntax errors
 */
const prepareDriver = (driver: Driver) => {
  if (!isSyntaxOk(driver.expression)) return null;
  const driverObject = window.scene.getObjectById(driver.objectID);
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
        const [sign, pow, sq] = [Math.sign, Math.pow, (x)=>Math.pow(x, 2)];
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
export const applyDriver = (driver: Driver, asTransaction: boolean = true) => {
  const animationFunction = prepareDriver(driver);
  /** If Syntax Error */
  if (!animationFunction) return null;
  const previousDriver = getDriver(driver.objectID, driver.property);

  const { expression, ...tempDriver } = driver;
  const ve = {
    type: ViewportEventType.setDriver,
    info: {
      ...tempDriver,
      initialExpression: null,
      finalExpression: expression,
    },
  } as ViewportEvent;

  /** First Time creating this driver */
  if (!previousDriver?.expression || driver.animationId < 0) {
    (ve.info as DriverInfo).animationId = addAnimationStep(
      animationFunction as AnimationFunction
    );
    if (asTransaction) window.viewportEventHistory.push(ve);
    return (ve.info as DriverInfo).animationId;
  }

  /** Updating this driver */
  (ve.info as DriverInfo).initialExpression = previousDriver.expression;

  (ve.info as DriverInfo).animationId = updateAnimationStep(
    driver.animationId,
    animationFunction as AnimationFunction
  );
  if (asTransaction) window.viewportEventHistory.push(ve);

  return (ve.info as DriverInfo).animationId;
};

/**
 * Gets rid of the driver and its animation.
 * @param getter The Getter of the Driver.
 * @returns Completion status, true or false
 */
export const deleteDriver = (
  objectId: number,
  property: string,
  asTransaction: boolean = true
) => {
  const previousDriver = getDriver(objectId, property);
  if (!previousDriver) return false;
  removeAnimationStep(previousDriver.animationId);
  const { expression, ...tempDriver } = previousDriver;
  const ve = {
    type: ViewportEventType.setDriver,
    info: {
      ...tempDriver,
      animationId: -1,
      initialExpression: expression,
      finalExpression: null,
    },
  } as ViewportEvent;
  if (asTransaction) window.viewportEventHistory.push(ve);
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
