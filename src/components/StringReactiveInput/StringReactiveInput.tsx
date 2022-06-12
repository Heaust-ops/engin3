import { FunctionComponent, HTMLAttributes, useEffect, useState } from "react";
import styles from "./StringReactiveInput.module.css";
import { isSyntaxOk } from "../../utils/validity";
import {
  applyDriver,
  deleteDriver,
  Driver,
  driverAnimationId,
  getDriver,
} from "../../utils/drivers";
import { DriverType } from "../../enums";

interface StringReactiveInputProps extends HTMLAttributes<HTMLDivElement> {
  getter: () => string;
  setter: (arg: string, asTransaction: boolean) => void;
  objectId: number;
  property: string;
  toUpdate?: boolean;
}

enum SyntaxBackground {
  ok = "#1B2A1A",
  notOk = "#2A1A1A",
}

const getDriverExpression = (arg: string) => arg.substring(1);

const StringReactiveInput: FunctionComponent<StringReactiveInputProps> = ({
  getter,
  setter,
  objectId,
  property,
  toUpdate = true,
  ...props
}) => {
  const [value, setvalue] = useState(`${getter()}`);
  const [isDriven, setisDriven] = useState(false);
  const [syntaxOk, setsyntaxOk] = useState(true);

  useEffect(() => {
    const driver = getDriver(objectId, property);
    if (driver) {
      setisDriven(true);
      setvalue("$" + driver.expression);
    } else {
      deleteDriver(objectId, property, false);
      setisDriven(false);
      setvalue(`${getter()}`);
    }
  }, [getter, objectId, property]);

  useEffect(() => {
    if (!isDriven) {
      deleteDriver(objectId, property, false);
      return;
    }

    /**
     * Syntax Checking
     */
    const expression = getDriverExpression(value);
    if (!expression) {
      setsyntaxOk(true);
      return;
    }

    const syntaxFlag = isSyntaxOk(expression, ["string"]);
    setsyntaxOk(syntaxFlag);
    if (!syntaxFlag) return;

    /**
     * Apply Driver
     */
    const newDriver = {
      objectID: objectId,
      property,
      expression,
      type: DriverType.string,
      animationId: driverAnimationId(objectId, property),
      getter,
      setter: (arg: string) => {
        setter(arg, false);
      },
    } as Driver;
    applyDriver(newDriver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriven, value]);

  /**
   * Keep refreshing values if update is on
   */
  useEffect(() => {
    let updateInterval: NodeJS.Timer;

    /** Syncing Values */
    if (toUpdate && !isDriven)
      updateInterval = setInterval(() => setvalue(`${getter()}`), 40);

    /** Cleanup */
    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [getter, isDriven, toUpdate]);

  /** Logic for Driver Mode */
  useEffect(() => {
    if (!isDriven && value.includes("$")) setvalue(`${getter()}`);
    if (isDriven && !value.includes("$")) setvalue(`$`);
  }, [getter, isDriven, value]);

  return (
    <div {...props} className={`${styles.wrapper}`}>
      {/**
       * Change
       */}
      <input
        spellCheck={false}
        value={value}
        className={`${styles.input}`}
        onKeyDown={(ev) => {
          ev.stopPropagation();
        }}
        style={{
          ...(isDriven
            ? {
                backgroundColor: syntaxOk
                  ? SyntaxBackground.ok
                  : SyntaxBackground.notOk,
              }
            : {}),
        }}
        onChange={(ev) => {
          const targetValue = ev.target.value;
          setvalue(targetValue);

          if (isDriven) {
            if (!targetValue.startsWith("$")) {
              setisDriven(false);
              return;
            }
          } else {
            if (targetValue.includes("$")) {
              setisDriven(true);
              setvalue("$");
              return;
            }
            const parsedValue = `${targetValue}`;
            setter(targetValue ? parsedValue : getter(), true);
          }
        }}
      />
    </div>
  );
};

export default StringReactiveInput;
