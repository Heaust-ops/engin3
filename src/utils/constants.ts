import { Cameras, Lights } from "../enums";

export const LightTypes = Object.values(Lights) as string[];

export const CameraTypes = Object.values(Cameras) as string[];

export const MeshyTypes = ["Mesh", "Group", "SkinnedMesh"];

export const viewportDivClassName = "viewport";

export const ViewportInteractionAllowed = [
  ...MeshyTypes,
  ...LightTypes,
  ...CameraTypes,
];

export const TypesThatNeedHelpers = [
  ...Object.values(Lights),
  ...Object.values(Cameras),
] as string[];

export const NonSelectionTypes = ["GridHelper", "AxesHelper"];
