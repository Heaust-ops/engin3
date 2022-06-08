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

export enum ViewportSidePanelTabs {
  world = "world",
  object = "object",
  material = "material",
  light = "light",
  drivers = "drivers",
  sequences = "sequences",
  states = "states",
}

export enum MeshLoadMethod {
  loadPrimitive = "loadPrimitive",
  loadPrimitiveBuffer = "loadPrimitiveBuffer",
  loadGLTF = "loadGLTF",
  loadFBX = "loadFBX",
  loadLight = "loadLight",
}

export enum ViewportEventType {
  scale = "scale",
  grab = "grab",
  rotate = "rotate",
  loadMesh = "loadMesh",
  deleteMesh = "deleteMesh",
  setDriver = "setDriver",
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
  directional = "DirectionalLight",
  hemispehre = "HemisphereLight",
  point = "PointLight",
  spot = "SpotLight",
  ambient = "AmbientLight",
}

export enum DriverType {
  numeric = "numeric",
  string = "string",
}
