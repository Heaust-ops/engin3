import { Material } from "three";
import { ViewportEventType } from "../enums";
import {
  addVE,
  getLatestVE,
  popVE,
  reverseVE,
  ViewportEventAxesInfo,
  ViewportEventMeshInfo,
} from "./events";
import { isType } from "./validity";

/**
 * Properly gets rid of a mesh
 * @param mesh The Mesh to Remove
 */
export const removeMesh = (mesh: THREE.Mesh) => {
  if (isType(mesh, "Mesh")) {
    mesh.geometry.dispose();
    (mesh.material as Material).dispose();
    window.scene.remove(mesh!);
  } else if (isType(mesh, "Group", "SkinnedMesh")) {
    const children_to_remove = [] as THREE.Object3D[];
    mesh.traverse((child) => {
      children_to_remove.push(child);
    });
    children_to_remove.forEach((child) => {
      mesh.remove(child);
      window.scene.remove(child);
    });
  }
};

/**
 * window.pendingTransactionObjectID being set non null
 * signifies a transaction being carried out.
 */

/**
 * Removes the currently selected mesh.
 */
export const removeSelectedMesh = () => {
  removeMesh(window.selectedItem as THREE.Mesh);
  window.selectedItem = null;
};

/**
 *
 * @param type Transaction type: rotate, scale, load etc
 *
 * Saves necessary data that'll be used during commiting
 * and sets a new transaction of the given type in motion.
 */
export const startTransaction = (type: ViewportEventType) => {
  window.pendingTransactionType = type;
  window.pendingTransactionObjectID = window.selectedItem?.id ?? null;
  if (!window.selectedItem) return;

  // Saving essential information required during commiting
  switch (type) {
    case ViewportEventType.scale:
      window.pendingTransactionInitials = [
        window.selectedItem.scale.x,
        window.selectedItem.scale.y,
        window.selectedItem.scale.z,
      ];
      break;
    case ViewportEventType.grab:
      window.pendingTransactionInitials = [
        window.selectedItem.position.x,
        window.selectedItem.position.y,
        window.selectedItem.position.z,
      ];
      break;
    case ViewportEventType.rotate:
      window.pendingTransactionInitials = [
        window.selectedItem.rotation.x,
        window.selectedItem.rotation.y,
        window.selectedItem.rotation.z,
      ];
      break;
    case ViewportEventType.loadMesh:
      /**
       * Logic implemented in models directly
       * As it requires information from the callback
       *
       * We could've passed the mechanism as a preprocess step
       * but that'd make the code less declarative
       */
      break;
    case ViewportEventType.delete:
      window.pendingTransactionObjectID = window.selectedItem.id ?? null;
      const ve = getLatestVE(
        ViewportEventType.loadMesh,
        null,
        (arg) => arg.info.objectID === window.selectedItem?.id
      );
      if (ve)
        window.pendingMeshTransactionInfo = {
          path: (ve.info as ViewportEventMeshInfo).path,
          method: (ve.info as ViewportEventMeshInfo).method,
        };
      break;
  }
};

/**
 * Commit a Transaction
 *
 * Pushes the transaction into the event history stack
 * with all the relevant details required to undo or
 * recreate it
 *
 */
export const commitTransaction = () => {
  if (!window.pendingTransactionType) return;

  const type = window.pendingTransactionType;
  window.pendingTransactionType = null;

  let info: ViewportEventMeshInfo | ViewportEventAxesInfo | null = null;
  let transactedObject: THREE.Object3D | null = null;

  if (window.pendingTransactionObjectID)
    transactedObject =
      window.scene.getObjectById(window.pendingTransactionObjectID) ?? null;

  // Prepare Event Information
  switch (type) {
    case ViewportEventType.scale:
      if (transactedObject && window.pendingTransactionInitials)
        info = {
          objectID: transactedObject.id,
          initialX: window.pendingTransactionInitials[0],
          initialY: window.pendingTransactionInitials[1],
          initialZ: window.pendingTransactionInitials[2],
          finalX: transactedObject.scale.x,
          finalY: transactedObject.scale.y,
          finalZ: transactedObject.scale.z,
        };
      break;

    case ViewportEventType.grab:
      if (transactedObject && window.pendingTransactionInitials)
        info = {
          objectID: transactedObject.id,
          initialX: window.pendingTransactionInitials[0],
          initialY: window.pendingTransactionInitials[1],
          initialZ: window.pendingTransactionInitials[2],
          finalX: transactedObject.position.x,
          finalY: transactedObject.position.y,
          finalZ: transactedObject.position.z,
        };
      break;

    case ViewportEventType.rotate:
      if (transactedObject && window.pendingTransactionInitials)
        info = {
          objectID: transactedObject.id,
          initialX: window.pendingTransactionInitials[0],
          initialY: window.pendingTransactionInitials[1],
          initialZ: window.pendingTransactionInitials[2],
          finalX: transactedObject.rotation.x,
          finalY: transactedObject.rotation.y,
          finalZ: transactedObject.rotation.z,
        };
      break;

    case ViewportEventType.loadMesh:
      if (
        window.pendingMeshTransactionInfo &&
        window.pendingTransactionObjectID
      )
        info = {
          objectID: window.pendingTransactionObjectID,
          ...window.pendingMeshTransactionInfo,
        };
      break;

    case ViewportEventType.delete:
      if (
        window.pendingMeshTransactionInfo &&
        window.pendingTransactionObjectID
      )
        info = {
          objectID: window.pendingTransactionObjectID,
          ...window.pendingMeshTransactionInfo,
        };
      break;
  }

  if (info) {
    addVE({ type, info });
  } else {
    console.log(
      window.pendingMeshTransactionInfo,
      window.pendingTransactionObjectID
    );
  }

  window.pendingTransactionObjectID = null;
};

/**
 * Undoes the most recent transaction.
 *
 * Shouldn't be allowed to use mid transaction, commit first please.
 * auto-commits, if not commited.
 *
 * This is done to improve UX,
 *
 * Say a user is scaling and rolls back without commiting,
 * This won't just cancel the scaling it will also undo the previous action.
 */
export const rollbackTransaction = () => {
  // Do not rollback mid transaction
  if (window.pendingTransactionObjectID) commitTransaction();
  const ve = popVE();
  if (ve) reverseVE(ve);
};
