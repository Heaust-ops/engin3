import { FunctionComponent } from "react";
import AmbientLightProperties from "./AmbientLightProperties";

interface WorldPropertiesProps {}

const WorldProperties: FunctionComponent<WorldPropertiesProps> = () => {
  return (
    <>
      <AmbientLightProperties />
    </>
  );
};

export default WorldProperties;
