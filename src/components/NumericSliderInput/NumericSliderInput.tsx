import { FunctionComponent, HTMLAttributes, useEffect, useState } from "react";

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
  const [value, setvalue] = useState(getter());

  /**
   * Keep refreshing values if update is on
   */
  useEffect(() => {
    let updateInterval: NodeJS.Timer;

    if (toUpdate) {
      updateInterval = setInterval(() => {
        setvalue(getter());
      }, 40);
    }

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [getter, toUpdate]);

  return (
    <input
      {...props}
      value={value}
      onChange={(ev) => {
        setter(~~ev.target.value);
        setvalue(~~ev.target.value);
      }}
      type="number"
    />
  );
};

export default NumericSliderInput;
