export enum ViewportModes {
  navigate = "navigate",
  grab = "grab",
  rotate = "rotate",
  scale = "scale",
}

export enum WorkingAxes {
  x = "x",
  y = "y",
  z = "z",
  notx = "notx",
  noty = "noty",
  notz = "notz",
  all = "all",
}

export enum MeshLoadMethod {
  loadPrimitive = "loadPrimitive",
  loadPrimitiveBuffer = "loadPrimitiveBuffer",
  loadGLTF = "loadGLTF",
  loadFBX = "loadFBX",
}

export enum ViewportEventType {
  loadMesh = "loadMesh",
  scale = "scale",
  grab = "grab",
  rotate = "rotate",
  delete = "delete",
}

export enum Primitives {
  cube = "cube",
  sphere = "sphere",
  cylinder = "cylinder",
  plane = "plane",
  torus = "torus",
  cone = "cone",
  capsule = "capsule",
  icosahedron = "icosahedron",
}
