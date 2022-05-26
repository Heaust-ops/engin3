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

export const removeSelectedMesh = () => {
  removeMesh(window.selectedItem as THREE.Mesh);
  window.selectedItem = null;
};

export const startTransaction = (type: ViewportEventType) => {
  window.pendingTransactionType = type;
  window.pendingTransactionObjectID = window.selectedItem?.id ?? null;
  if (!window.selectedItem) return;
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
      // Logic implemented in models directly
      break;
    case ViewportEventType.delete:
      window.pendingTransactionObjectID = window.selectedItem.id ?? null;
      const ve = getLatestVE(
        ViewportEventType.loadMesh,
        null,
        (arg) => arg.info.objectID === window.selectedItem?.id
      );
      if (ve) window.pendingMeshTransactionInfo = {
        path: (ve.info as ViewportEventMeshInfo).path,
        method: (ve.info as ViewportEventMeshInfo).method,
      };
      break;
  }
};

export const commitTransaction = () => {
  if (!window.pendingTransactionType) return;

  const type = window.pendingTransactionType;
  window.pendingTransactionType = null;

  let info: ViewportEventMeshInfo | ViewportEventAxesInfo | null = null;
  let transactedObject: THREE.Object3D | null = null;

  if (window.pendingTransactionObjectID)
    transactedObject =
      window.scene.getObjectById(window.pendingTransactionObjectID) ?? null;

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
      if (window.pendingMeshTransactionInfo && window.pendingTransactionObjectID)
        info = {
          objectID: window.pendingTransactionObjectID,
          ...window.pendingMeshTransactionInfo,
        };
      break;
    case ViewportEventType.delete:
      if (window.pendingMeshTransactionInfo && window.pendingTransactionObjectID)
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

export const rollbackTransaction = () => {
  const ve = popVE();
  if (ve) reverseVE(ve);
};
