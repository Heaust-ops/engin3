import { FunctionComponent, useEffect, useState } from "react";
import NumericReactiveInput from "../../../NumericReactiveInput/NumericReactiveInput";
import baseStyles from "../PropertyTabs.module.css";

interface AmbientLightPropertiesProps {}

let ambientLightInterval: NodeJS.Timer;

const AmbientLightProperties: FunctionComponent<
  AmbientLightPropertiesProps
> = () => {
  const [ambientLightLoaded, setambientLightLoaded] = useState(false);
  const [showColorControls, setshowColorControls] = useState(false);

  const toggleColorControls = () => setshowColorControls(!showColorControls);
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
      <div className={`${baseStyles.propContainer}`}>
        <h4>Color:</h4>
        {!showColorControls && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={toggleColorControls}
              className={`${baseStyles.button}`}
            >
              Show Controls
            </button>
          </div>
        )}
        {showColorControls && ambientLightLoaded && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={toggleColorControls}
              className={`${baseStyles.button}`}
            >
              Hide Controls
            </button>
            <div className={`${baseStyles.propContainer}`}>
              <h4>R:</h4>
              <NumericReactiveInput
                step={0.02}
                getter={() => window.ambientLight.color.r}
                setter={(arg) => {
                  window.ambientLight.color.r = arg;
                }}
                objectId={window.ambientLight.id}
                property={"color.r"}
              />
            </div>
            <div className={`${baseStyles.propContainer}`}>
              <h4>G:</h4>
              <NumericReactiveInput
                step={0.02}
                getter={() => window.ambientLight.color.g}
                setter={(arg) => {
                  window.ambientLight.color.g = arg;
                }}
                objectId={window.ambientLight.id}
                property={"color.g"}
              />
            </div>
            <div className={`${baseStyles.propContainer}`}>
              <h4>B:</h4>
              <NumericReactiveInput
                step={0.02}
                getter={() => window.ambientLight.color.b}
                setter={(arg) => {
                  window.ambientLight.color.b = arg;
                }}
                objectId={window.ambientLight.id}
                property={"color.b"}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AmbientLightProperties;
