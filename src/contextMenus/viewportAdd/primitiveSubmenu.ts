import { loadPrimitive } from "../../utils/models";

const primitiveSubmenu = [
  {
    type: "text",
    text: "Cube",
    onClick: () => {
      loadPrimitive({ modelPath: "cube" });
    },
  },
  {
    type: "text",
    text: "Sphere",
    onClick: () => {
      loadPrimitive({ modelPath: "sphere" });
    },
  },
  {
    type: "text",
    text: "Cylinder",
    onClick: () => {
      loadPrimitive({ modelPath: "cylinder" });
    },
  },
  {
    type: "text",
    text: "Plane",
    onClick: () => {
      loadPrimitive({ modelPath: "plane" });
    },
  },
  {
    type: "text",
    text: "Torus",
    onClick: () => {
      loadPrimitive({ modelPath: "torus" });
    },
  },
  {
    type: "text",
    text: "Cone",
    onClick: () => {
      loadPrimitive({ modelPath: "cone" });
    },
  },
  {
    type: "text",
    text: "Capsule",
    onClick: () => {
      loadPrimitive({ modelPath: "capsule" });
    },
  },
  {
    type: "text",
    text: "Icosahedron",
    onClick: () => {
      loadPrimitive({ modelPath: "icosahedron" });
    },
  },
];

export default primitiveSubmenu;
