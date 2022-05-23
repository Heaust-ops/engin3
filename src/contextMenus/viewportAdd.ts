import { loadPrimitive } from "../utils.ts/models";

export const viewportAddMenu = [
  {
    type: "text",
    text: "Add Primitive",
    sub: [
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
    ],
  },
  {
    type: "text",
    text: "Add Buffer Primitive",
    sub: [
      {
        type: "text",
        text: "Cube",
        onClick: () => {
          loadPrimitive({ modelPath: "cube", buffer: true });
        },
      },
      {
        type: "text",
        text: "Sphere",
        onClick: () => {
          loadPrimitive({ modelPath: "sphere", buffer: true });
        },
      },
      {
        type: "text",
        text: "Cylinder",
        onClick: () => {
          loadPrimitive({ modelPath: "cylinder", buffer: true });
        },
      },
      {
        type: "text",
        text: "Plane",
        onClick: () => {
          loadPrimitive({ modelPath: "plane", buffer: true });
        },
      },
      {
        type: "text",
        text: "Torus",
        onClick: () => {
          loadPrimitive({ modelPath: "torus", buffer: true });
        },
      },
      {
        type: "text",
        text: "Cone",
        onClick: () => {
          loadPrimitive({ modelPath: "cone", buffer: true });
        },
      },
      {
        type: "text",
        text: "Capsule",
        onClick: () => {
          loadPrimitive({ modelPath: "capsule", buffer: true });
        },
      },
      {
        type: "text",
        text: "Icosahedron",
        onClick: () => {
          loadPrimitive({ modelPath: "icosahedron", buffer: true });
        },
      },
    ],
  },
];
