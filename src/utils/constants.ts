import { Lights } from "../enums";

export const ViewportInteractionAllowed = [
  "Mesh",
  "Group",
  "SkinnedMesh",
  ...Object.values(Lights),
];

export const NonSelectionTypes = [
  "GridHelper",
  "AxesHelper"
]