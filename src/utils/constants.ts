import { Lights, ViewportSidePanelTabs } from "../enums";

export const LightTypes = [
  "DirectionalLight",
  "HemisphereLight",
  "PointLight",
  "SpotLight",
];

export const MeshyTypes = ["Mesh", "Group", "SkinnedMesh"];

export const ViewportInteractionAllowed = [...MeshyTypes, ...LightTypes];

export const TypesThatNeedHelpers = [...Object.values(Lights), "Camera"];

export const NonSelectionTypes = ["GridHelper", "AxesHelper"];

export const AllViewportSidePanelTabs = [
  "world",
  "object",
  "material",
  "light",
  "drivers",
  "sequences",
  "states",
] as ViewportSidePanelTabs[];
