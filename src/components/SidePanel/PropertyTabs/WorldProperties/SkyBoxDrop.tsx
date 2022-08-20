import { FunctionComponent } from "react";
import { getProperSkyboxPaths } from "../../../../utils/hdri";

interface SkyBoxDropProps {}

const SkyBoxDrop: FunctionComponent<SkyBoxDropProps> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "7rem",
        border: "2px dashed #606060",
        borderRadius: "0.5rem",
        display: "flex",
      }}
      onDrop={(e) => {
        const nameArray = Array.from(e.dataTransfer.files).map((f) => f.name);
        console.log(
          getProperSkyboxPaths(
            nameArray as [string, string, string, string, string, string]
          )
        );
      }}
    >
      <p
        style={{
          transform: "translateY(-0.3rem)",
          fontFamily: "monospace",
          margin: "auto auto",
          color: "#606060",
        }}
      >
        Drop Environment
        <br />
        Image(s) Here
      </p>
    </div>
  );
};

export default SkyBoxDrop;
