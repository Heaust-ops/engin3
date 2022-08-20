import { FunctionComponent } from "react";
import { CubeTextureLoader } from "three";
import { scene } from "../../../../three/viewport";
import { getProperSkyboxPaths, SkyboxPaths } from "../../../../utils/hdri";

interface SkyBoxDropProps {}

const image6Check = (files: FileList) => {
  return (
    files.length === 6 &&
    Array.from(files).every((file) => (file as File).type.startsWith("image"))
  );
};

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
        const files = e.dataTransfer.files;
        if (!image6Check(files)) return;

        const fileArray = Array.from(files);
        const nameArray = fileArray.map((f) => f.name);
        const skyboxPaths = getProperSkyboxPaths(
          nameArray as [string, string, string, string, string, string]
        );

        Object.keys(skyboxPaths).forEach((axis) => {
          const path = skyboxPaths[axis as keyof SkyboxPaths];
          const file = fileArray.reduce((a, b) => (a.name === path ? a : b));
          skyboxPaths[axis as keyof SkyboxPaths] = URL.createObjectURL(file);
        });

        scene.background = new CubeTextureLoader().load([
          skyboxPaths.x,
          skyboxPaths.nx,
          skyboxPaths.y,
          skyboxPaths.ny,
          skyboxPaths.z,
          skyboxPaths.nz,
        ]);
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
