import { MeshLoadMethod, ViewportEventType } from "../enums";
import { getLoader } from "./models";
import {
  commitTransaction,
  removeMesh,
  startTransaction,
} from "./transactions";
import { selectObject3D, unselectObject3D } from "./utils";

export interface ViewportEvent {
  type: ViewportEventType;
  info: ViewportEventAxesInfo | ViewportEventMeshInfo;
}

/**
 * We're storing both final and initial values,
 *
 * Initials will be helpful in undo.
 *
 * Finals will be helpful in achieving the final state in the least
 * number of steps
 */
export interface ViewportEventAxesInfo {
  objectID: number;
  finalX: number;
  finalY: number;
  finalZ: number;
  initialX: number;
  initialY: number;
  initialZ: number;
}

export interface ViewportEventMeshInfo {
  objectID: number;
  path: string;
  method: MeshLoadMethod;
}

/**
 * Pushes a viewport event onto the event history stack
 * @param arg The Viewport Event
 */
export const addVE = (arg: ViewportEvent) => {
  window.viewportEventHistory.push(arg);
};

/**
 * @param type Optional
 *
 * Search the latest occurence of a certain type of Viewport Event,
 *
 * before a certain index OR
 *
 * before the latest occurence of another Viewport Event
 *
 * @param before Default: the length of the Event History Array
 *
 * The index, if we want to find the Event before a certain index OR
 *
 * The Event Type, if we want to find an Event before the latest
 *
 * Event of this type
 *
 * @param filter (arg: ViewportEvent) => boolean
 *
 * We will ignore the VE that this function doesn't agree with.
 *
 * @returns
 * *If no type is given:* Latest Event | Laste Element of Event History
 *
 * *If no before is given:* Latest Event of the given type
 *
 * *If both are given:* The Event before the index or another Event of the given type
 */
export const getLatestVE = (
  type?: ViewportEventType,
  before?: number | ViewportEvent | null,
  filter?: (arg: ViewportEvent) => boolean
) => {
  if (!before) before = window.viewportEventHistory.length;
  if (!type)
    // Return Latest if no type
    return window.viewportEventHistory[window.viewportEventHistory.length - 1];

  // Calculate index if before is in the form of VE type
  if (typeof before !== "number") {
    for (let i = window.viewportEventHistory.length - 1; i > -1; i--) {
      if (
        window.viewportEventHistory[i].type === (before as ViewportEvent).type
      )
        before = i;
    }

    // If no event of the type before has occured
    if (typeof before !== "number") return null;
  }

  // Calculate the Event before a certain index
  for (let i = before - 1; i > -1; i--) {
    if (filter && !filter(window.viewportEventHistory[i])) continue;
    if (window.viewportEventHistory[i].type === type)
      return window.viewportEventHistory[i];
  }

  return null;
};

/**
 * @param type Optional
 *
 * Search the latest occurence of a certain type of Viewport Event,
 *
 * before a certain index OR
 *
 * before the latest occurence of another Viewport Event
 *
 * @param before Default: the length of the Event History Array
 *
 * The index, if we want to find the Event before a certain index OR
 *
 * The Event Type, if we want to find an Event before the latest
 *
 * Event of this type
 *
 * @param filter (arg: ViewportEvent) => boolean
 *
 * We will ignore the VE that this function doesn't agree with.
 *
 * @returns
 * *If no type is given:* last index of eventHistory array
 *
 * *If no before is given:* Index of the latest Event of the given type
 *
 * *If both are given:* Index of the Event before the index or another Event of the given type
 */
export const getLatestVEIndex = (
  type?: ViewportEventType,
  before?: number | ViewportEvent | null,
  filter?: (arg: ViewportEvent) => boolean
) => {
  if (!before) before = window.viewportEventHistory.length;
  if (!type)
    // Return Latest if no type
    return window.viewportEventHistory.length - 1;

  // Calculate index if before is in the form of VE type
  if (typeof before !== "number") {
    for (let i = window.viewportEventHistory.length - 1; i > -1; i--) {
      if (window.viewportEventHistory[i].type === type) before = i;
    }

    // If no event of the type before has occured
    if (typeof before !== "number") return null;
  }

  // Calculate the Event before a certain index
  for (let i = before - 1; i > -1; i--) {
    if (filter && !filter(window.viewportEventHistory[i])) continue;
    if (window.viewportEventHistory[i].type === type) return i;
  }

  return null;
};

/**
 * Duplicates or Revives an Object.
 *
 * This is tricky,
 * since we not only have to load the mesh back,
 * we have to apply every transform to it that it had applied before.
 *
 * We'll also have go and change the id referring to the previous mesh
 * by the new one we load in if we revive so that further undo doesn't break.
 *
 * @param ve The viewport event
 * @param asTransaction
 * @returns
 */
export const reloadFromVE = (
  ve: ViewportEvent | number,
  asTransaction = false
) => {
  try {
    if (typeof ve === "number") ve = window.viewportEventHistory[ve];
  } catch {
    return false;
  }

  const info = ve.info as ViewportEventMeshInfo;
  const loader = getLoader(info.method);

  // Get Latest Transforms before deletion
  const scale = getLatestVE(
    ViewportEventType.scale,
    null,
    (arg) => (arg.info as ViewportEventAxesInfo).objectID === info.objectID
  )?.info as ViewportEventAxesInfo | null;
  const position = getLatestVE(
    ViewportEventType.grab,
    null,
    (arg) => (arg.info as ViewportEventAxesInfo).objectID === info.objectID
  )?.info as ViewportEventAxesInfo | null;
  const rotation = getLatestVE(
    ViewportEventType.rotate,
    null,
    (arg) => (arg.info as ViewportEventAxesInfo).objectID === info.objectID
  )?.info as ViewportEventAxesInfo | null;

  // Load the Model and Apply any tranforms found
  loader({
    modelPath: info.path,
    preprocess: (mesh) => {
      selectObject3D(mesh);
      if (scale) {
        startTransaction(ViewportEventType.scale);
        mesh.scale.set(scale.finalX, scale.finalY, scale.finalZ);
      }
      if (position) {
        startTransaction(ViewportEventType.grab);
        mesh.position.set(position.finalX, position.finalY, position.finalZ);
      }
      if (rotation) {
        startTransaction(ViewportEventType.rotate);
        mesh.rotation.set(rotation.finalX, rotation.finalY, rotation.finalZ);
      }
      commitTransaction();
      unselectObject3D(mesh);

      // Replace previous object's Ids with the new one's throughout all
      // so that further undo doesn't break when reviving
      if ((ve as ViewportEvent).type === ViewportEventType.delete) {
        for (let i = 0; i < window.viewportEventHistory.length; i++)
          if (window.viewportEventHistory[i].info.objectID === info.objectID)
            window.viewportEventHistory[i].info.objectID = mesh.id;
      }
    },
    asTransaction,
  });

  return true;
};

/**
 * This function applies the changes until just before the given VE
 * In case of a load or a remove VE, it just performs the reverse of it
 * @param ve The ViewportEvent or its Index to reverse
 * @returns true for success, false for failure
 * Reasons to fail may include,
 * - Object to modify being missing
 * - Index provided is out of range
 */
export const reverseVE = (ve: ViewportEvent | number) => {
  try {
    if (typeof ve === "number") ve = window.viewportEventHistory[ve];
  } catch {
    return false;
  }

  /**
   * How we'll reverse an event will vary
   * on what type of an event it is
   */
  switch (ve.type) {
    // reapply previous scale
    case ViewportEventType.scale: {
      const info = ve.info as ViewportEventAxesInfo;
      const obj = window.scene.getObjectById(info.objectID);
      if (obj) obj.scale.set(info.initialX, info.initialY, info.initialZ);
      else return false;
      return true;
    }

    // reapply previous position
    case ViewportEventType.grab: {
      const info = ve.info as ViewportEventAxesInfo;
      const obj = window.scene.getObjectById(info.objectID);
      if (obj) obj.position.set(info.initialX, info.initialY, info.initialZ);
      else return false;
      return true;
    }

    // reapply previous rotation
    case ViewportEventType.rotate: {
      const info = ve.info as ViewportEventAxesInfo;
      const obj = window.scene.getObjectById(info.objectID);
      if (obj) obj.rotation.set(info.initialX, info.initialY, info.initialZ);
      else return false;
      return true;
    }

    // delete the mesh
    case ViewportEventType.loadMesh: {
      const info = ve.info as ViewportEventAxesInfo;
      const obj = window.scene.getObjectById(info.objectID);
      removeMesh(obj as THREE.Mesh);
      return true;
    }

    case ViewportEventType.delete:
      return reloadFromVE(ve);
  }
};

export const popVE = () => window.viewportEventHistory.pop() ?? null;
