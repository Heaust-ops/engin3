import { Material } from "three";
import { Lights, MeshLoadMethod, ViewportEventType } from "../enums";
import {
  addVE,
  getLatestVE,
  popVE,
  reverseVE,
  ViewportEventAxesInfo,
  ViewportEventMeshInfo,
} from "./events";
import { doForSelectedItems } from "./utils";
import { isType } from "./validity";

export type AxesInfoArray = [number /** x */, number /** y */, number /** z */];
export type InitialMeshInfo = {
  path: string;
  method: MeshLoadMethod;
};
export type PendingTransactionInitials = AxesInfoArray | InitialMeshInfo | null;
export interface PendingTransaction {
  type: ViewportEventType;
  objectID: number;
  initials: PendingTransactionInitials;
}

/**
 * Properly gets rid of a mesh
 * @param mesh The Mesh to Remove
 */
export const removeMesh = (mesh: THREE.Object3D) => {
  if (isType(mesh, "Mesh")) {
    (mesh as THREE.Mesh).geometry.dispose();
    ((mesh as THREE.Mesh).material as Material).dispose();
    window.scene.remove(mesh!);
  } else if (isType(mesh, ...Object.values(Lights))) {
    let helper: THREE.PointLightHelper;
    window.scene.traverse((item) => {
      if (
        item.type.includes("LightHelper") &&
        (item as THREE.PointLightHelper).light.id === mesh.id
      )
        helper = item as THREE.PointLightHelper;
    });
    window.scene.remove(helper!);
    window.scene.remove(mesh!);
  }
  // Properly get Rid of Groups
  else if (isType(mesh, "Group", "SkinnedMesh")) {
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
  if (!window.selectedItems.length) return;
  doForSelectedItems((x) => {
    removeMesh(x);
  });
  window.selectedItems = [];
};

/**
 *
 * @param type Transaction type: rotate, scale, load etc
 *
 * Saves necessary data that'll be used during commiting
 * and sets a new transaction of the given type in motion.
 */
export const startTransaction = (type: ViewportEventType) => {
  window.pendingTransactions = [];
  if (type === ViewportEventType.loadMesh) return;
  doForSelectedItems((item) => {
    let initials: PendingTransactionInitials = null;
    // Saving essential information required during commiting
    switch (type) {
      case ViewportEventType.scale:
        initials = [item.scale.x, item.scale.y, item.scale.z];
        break;

      case ViewportEventType.grab:
        initials = [item.position.x, item.position.y, item.position.z];
        break;

      case ViewportEventType.rotate:
        initials = [item.rotation.x, item.rotation.y, item.rotation.z];
        break;

      /** case ViewportEventType.loadMesh:
        
         * Logic implemented in models directly
         * As it requires information from the callback
         *
         * We could've passed the mechanism as a preprocess step
         * but that'd make the code less declarative
         
        break;*/

      case ViewportEventType.delete:
        const ve = getLatestVE(
          ViewportEventType.loadMesh,
          null,
          (arg) => arg.info.objectID === item.id
        );
        if (ve) {
          initials = {
            path: (ve.info as ViewportEventMeshInfo).path,
            method: (ve.info as ViewportEventMeshInfo).method,
          };
        }

        break;
    }

    window.pendingTransactions.push({
      type,
      objectID: item.id,
      initials,
    });
  });
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
  window.pendingTransactions.forEach((pendingTransaction) => {
    const type = pendingTransaction.type;

    let info: ViewportEventMeshInfo | ViewportEventAxesInfo | null = null;
    let transactedObject: THREE.Object3D | null = null;

    transactedObject =
      window.scene.getObjectById(pendingTransaction.objectID) ?? null;

    // Prepare Event Information
    switch (type) {
      case ViewportEventType.scale:
        if (transactedObject && pendingTransaction.initials)
          info = {
            objectID: transactedObject.id,
            initialX: (pendingTransaction.initials as AxesInfoArray)[0],
            initialY: (pendingTransaction.initials as AxesInfoArray)[1],
            initialZ: (pendingTransaction.initials as AxesInfoArray)[2],
            finalX: transactedObject.scale.x,
            finalY: transactedObject.scale.y,
            finalZ: transactedObject.scale.z,
          };
        break;

      case ViewportEventType.grab:
        if (transactedObject && pendingTransaction.initials)
          info = {
            objectID: transactedObject.id,
            initialX: (pendingTransaction.initials as AxesInfoArray)[0],
            initialY: (pendingTransaction.initials as AxesInfoArray)[1],
            initialZ: (pendingTransaction.initials as AxesInfoArray)[2],
            finalX: transactedObject.position.x,
            finalY: transactedObject.position.y,
            finalZ: transactedObject.position.z,
          };
        break;

      case ViewportEventType.rotate:
        if (transactedObject && pendingTransaction.initials)
          info = {
            objectID: transactedObject.id,
            initialX: (pendingTransaction.initials as AxesInfoArray)[0],
            initialY: (pendingTransaction.initials as AxesInfoArray)[1],
            initialZ: (pendingTransaction.initials as AxesInfoArray)[2],
            finalX: transactedObject.rotation.x,
            finalY: transactedObject.rotation.y,
            finalZ: transactedObject.rotation.z,
          };
        break;

      case ViewportEventType.loadMesh:
        if (
          (pendingTransaction.initials as InitialMeshInfo).path &&
          pendingTransaction.objectID
        )
          info = {
            objectID: pendingTransaction.objectID,
            ...(pendingTransaction.initials as InitialMeshInfo),
          };
        break;

      case ViewportEventType.delete:
        if ((pendingTransaction.initials as InitialMeshInfo)?.path)
          info = {
            objectID: pendingTransaction.objectID,
            ...(pendingTransaction.initials as InitialMeshInfo),
          };
        break;
    }

    if (info) {
      addVE({ type, info });
    } else {
      console.log(pendingTransaction);
    }
  });

  window.pendingTransactions = [];
};

/**
 * Undoes the most recent transaction.
 *
 * Shouldn't be allowed to use mid transaction, commit first please.
 *
 * This is done to improve UX,
 *
 * Say a user is scaling and rolls back without commiting,
 * This won't just cancel the scaling it will also undo the previous action.
 */
export const rollbackTransaction = () => {
  // Do not rollback mid transaction
  if (window.pendingTransactions.length) return;
  const ve = popVE();
  if (ve) reverseVE(ve);
};
