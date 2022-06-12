import { Cameras } from "../../enums";
import { loadCamera } from "../../utils/loaders";

export const cameraSubmenu = [
  {
    type: "text",
    text: "Perspective",
    onClick: () => {
      loadCamera({ modelPath: Cameras.perspective });
    },
  },
  {
    type: "text",
    text: "Orthographic",
    onClick: () => {
      loadCamera({ modelPath: Cameras.orthographic });
    },
  },
];
