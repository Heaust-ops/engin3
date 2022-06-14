import { Material } from "three";
import { Lights, MeshLoadMethod, ViewportEventType } from "../enums";
import { scene } from "../three/viewport";
import {
  addVE,
  getLatestVE,
  popVE,
  reverseVE,
  ViewportEventAxesInfo,
  ViewportEventMeshInfo,
} from "./events";
import { selectedItems, selectObject3D } from "./selection";
import { doForSelectedItems } from "./utils";
import { isType } from "./validity";

/**
 * Every Action that causes any Change needs to be a Transaction.
 *
 * Succesful Transactions will be Recorded in Event History,
 * Which will be used to properly,
 * - Undo
 * - Duplicate
 * - Generate Code
 *
 * There are three primary methods of use here,
 * - Start Transaction:
 *    Will be used to record relevant data related to the
 *    transaction and store it as a pending transaction.
 *
 * - Commit Transaction:
 *    Saves the transaction to the Event History with all
 *    the necessary information required to re-perform or
 *    undo it.
 *
 * ** Note about Star and Commit Transaction,
 *    They're  only for transactions that don't immediately
 *    get commited, for transactions like that there's likely an
 *    asTransaction param in the action function itself
 *
 * - Rollback Transaction: Undo latest,
 *    Do not use when there are already transactions pending.
 *    Won't work anyway in that case as added safety.
 */

/** ========================================= */

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

export let pendingTransactions = [] as PendingTransaction[];
export const isTransactionPending = () => !!pendingTransactions.length;

/**
 * Properly gets rid of a mesh
 * @param mesh The Mesh to Remove
 */
export const removeMesh = (mesh: THREE.Object3D) => {
  if (isType(mesh, "Mesh")) {
    (mesh as THREE.Mesh).geometry.dispose();
    ((mesh as THREE.Mesh).material as Material).dispose();
    scene.remove(mesh!);
  } else if (isType(mesh, ...Object.values(Lights))) {
    let helper: THREE.PointLightHelper;
    scene.traverse((item) => {
      if (
        item.type.includes("LightHelper") &&
        (item as THREE.PointLightHelper).light.id === mesh.id
      )
        helper = item as THREE.PointLightHelper;
    });
    scene.remove(helper!);
    scene.remove(mesh!);
  }
  // Properly get Rid of Groups
  else if (isType(mesh, "Group", "SkinnedMesh")) {
    const children_to_remove = [] as THREE.Object3D[];
    mesh.traverse((child) => {
      children_to_remove.push(child);
    });
    children_to_remove.forEach((child) => {
      mesh.remove(child);
      scene.remove(child);
    });
  }
};

/**
 * Removes the currently selected mesh.
 */
export const removeSelectedMesh = () => {
  if (!selectedItems.length) return;
  doForSelectedItems((x) => {
    removeMesh(x);
  });
  selectObject3D(null, true);
};

/**
 *
 * @param type Transaction type: rotate, scale, load etc
 *
 * Saves necessary data that'll be used during commiting
 * and sets a new transaction of the given type in motion.
 */
export const startTransaction = (
  type: ViewportEventType,
  pending: PendingTransaction[] | null = null
) => {
  pendingTransactions = pending ? pending : [];
  if (isTransactionPending()) return;
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

      /**
      case ViewportEventType.loadMesh:
        
         * Logic implemented in models directly
         * As it requires information from the callback
         *
         * We could've passed the mechanism as a preprocess step
         * but that'd make the code less declarative
         
        break;
      */

      case ViewportEventType.deleteMesh:
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

    pendingTransactions.push({
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
  pendingTransactions.forEach((pendingTransaction) => {
    const type = pendingTransaction.type;

    let info: ViewportEventMeshInfo | ViewportEventAxesInfo | null = null;
    let transactedObject: THREE.Object3D | null = null;

    transactedObject =
      scene.getObjectById(pendingTransaction.objectID) ?? null;

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

      case ViewportEventType.deleteMesh:
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
      /**
       * Something went wrong
       */
    }
  });

 pendingTransactions = [];
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
  if (pendingTransactions.length) return;
  const ve = popVE();
  if (ve) reverseVE(ve);
};
