import { Lights } from "../../enums";
import { loadLight } from "../../utils/loaders";

const lightSubmenu = [
  {
    type: "text",
    text: "Directional",
    onClick: () => {
      loadLight({ modelPath: Lights.directional });
    },
  },
  {
    type: "text",
    text: "Hemisphere",
    onClick: () => {
      loadLight({ modelPath: Lights.hemispehre });
    },
  },
  {
    type: "text",
    text: "Point",
    onClick: () => {
      loadLight({ modelPath: Lights.point });
    },
  },
  {
    type: "text",
    text: "Spot",
    onClick: () => {
      loadLight({ modelPath: Lights.spot });
    },
  },
];

export default lightSubmenu;
