import { FunctionComponent } from "react";
import AmbientLightProperties from "./AmbientLightProperties";
import SkyBoxDrop from "./SkyBoxDrop";

interface WorldPropertiesProps {}

const WorldProperties: FunctionComponent<WorldPropertiesProps> = () => {
  return (
    <>
      <AmbientLightProperties />
      <br />
      <SkyBoxDrop />
    </>
  );
};

export default WorldProperties;
