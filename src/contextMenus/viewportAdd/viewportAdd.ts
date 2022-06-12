import { cameraSubmenu } from "./cameraSubmenu";
import lightSubmenu from "./lightSubmenu";
import primitiveBufferSubmenu from "./primitiveBufferSubmenu";
import primitiveSubmenu from "./primitiveSubmenu";

export const viewportAddMenu = [
  {
    type: "text",
    text: "Add Primitive",
    sub: primitiveSubmenu,
  },
  {
    type: "text",
    text: "Add Buffer Primitive",
    sub: primitiveBufferSubmenu,
  },
  {
    type: "text",
    text: "Lights",
    sub: lightSubmenu,
  },
  {
    type: "text",
    text: "Cameras",
    sub: cameraSubmenu,
  },
];
