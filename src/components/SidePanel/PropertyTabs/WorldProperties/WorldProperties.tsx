import { FunctionComponent, useEffect, useState } from "react";
import NumericReactiveInput from "../../../NumericReactiveInput/NumericReactiveInput";
import baseStyles from "../PropertyTabs.module.css";

interface WorldPropertiesProps {}

let ambientLightInterval: NodeJS.Timer;

const WorldProperties: FunctionComponent<WorldPropertiesProps> = () => {
  const [ambientLightLoaded, setambientLightLoaded] = useState(false);

  /**
   * React polls too slow for non states
   * So we'll just make our own polling interval
   */
  useEffect(() => {
    if (!ambientLightLoaded)
      ambientLightInterval = setInterval(() => {
        if (window.ambientLight) setambientLightLoaded(true);
      }, 10);
    else if (ambientLightInterval) clearInterval(ambientLightInterval);

    return () => {
      if (ambientLightInterval) clearInterval(ambientLightInterval);
    };
  }, [ambientLightLoaded]);

  return (
    <>
      <h3>Ambient Light:</h3>
      <div className={`${baseStyles.propContainer}`}>
        <h4>Intensity:</h4>{" "}
        {ambientLightLoaded && (
          <NumericReactiveInput
            getter={() => window.ambientLight.intensity}
            setter={(arg) => {
              window.ambientLight.intensity = arg;
            }}
            objectId={window.ambientLight.id}
            property={"intensity"}
          />
        )}
      </div>
    </>
  );
};

export default WorldProperties;
