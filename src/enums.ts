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
  loadLight = "loadLight",
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

export enum Lights {
  directional = "PointLight",
  hemispehre = "DirectionalLight",
  point = "HemisphereLight",
  spot = "SpotLight",
}
