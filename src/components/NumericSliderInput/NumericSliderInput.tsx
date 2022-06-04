import { FunctionComponent, HTMLAttributes, useEffect, useState } from "react";
import styles from "./NumericSliderInput.module.css";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import { commitTransaction, startTransaction } from "../../utils/transactions";
import { ViewportEventType } from "../../enums";

interface NumericSliderInputProps extends HTMLAttributes<HTMLDivElement> {
  getter: () => number;
  setter: (arg: number) => void;
  toUpdate?: boolean;
}

const NumericSliderInput: FunctionComponent<NumericSliderInputProps> = ({
  getter,
  setter,
  toUpdate = true,
  ...props
}) => {
  const [value, setvalue] = useState(`${getter()}`);
  const [isDriven, setisDriven] = useState(false);

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

  useEffect(() => {
    if (!isDriven && value.includes("$")) setvalue(`${getter()}`);
    if (isDriven && !value.includes("$")) setvalue(`$`);
  }, [getter, isDriven, value]);

  return (
    <div {...props} className={`${styles.wrapper}`}>
      {/**
       * Decrease
       */}
      <button
        className={`${styles.button}`}
        onClick={() => {
          if (!isDriven) setter(getter() - 0.5);
        }}
      >
        <ArrowRightIcon
          style={{
            width: "1.8rem",
            height: "1.8rem",
            transform: "rotate(180deg)",
          }}
        />
      </button>

      {/**
       * Change
       */}
      <input
        value={value}
        className={`${styles.input}`}
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
            const parsedValue = parseFloat(targetValue);
            setter(parsedValue ? parsedValue : getter());
          }
        }}
      />

      {/**
       * Increase
       */}
      <button
        className={`${styles.button}`}
        onClick={() => {
          if (!isDriven) setter(getter() + 0.5);
        }}
      >
        <ArrowRightIcon
          style={{
            width: "1.8rem",
            height: "1.8rem",
          }}
        />
      </button>
    </div>
  );
};

export default NumericSliderInput;
