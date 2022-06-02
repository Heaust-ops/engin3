import { NonSelectionTypes, TypesThatNeedHelpers } from "./constants";
import { getHelper } from "./utils";

/**
 * Highlights passed objects
 * @param args The 3D Objects to highlight
 */
 export const highlightObjects = (args: THREE.Object3D[]) => {
    window.outlinePass.selectedObjects = args;
  };
  
  /**
   * Selects 3D Object(s) programmatically
   * @param arg The 3D Object to Select
   */
  export const selectObject3D = (
    arg: THREE.Object3D | THREE.Object3D[] | null,
    strict = false
  ) => {
    if (
      arg === null ||
      (arg instanceof Array && arg.length === 0) ||
      ((arg as THREE.Object3D).type &&
        NonSelectionTypes.includes((arg as THREE.Object3D).type))
    ) {
      if (strict) {
        window.selectedItems = [];
        window.outlinePass.selectedObjects = [];
      }
      return;
    }
  
    if (!(arg instanceof Array)) arg = [arg];
  
    arg.forEach((item) => {
      if (TypesThatNeedHelpers.includes(item.type)) {
        const helper = getHelper(item);
        if (helper) arg = (arg as THREE.Object3D[]).concat(helper);
      }
    });
  
    if (strict) {
      window.selectedItems = arg;
      window.outlinePass.selectedObjects = arg;
    } else {
      window.selectedItems = window.selectedItems.concat(arg);
      window.outlinePass.selectedObjects =
        window.outlinePass.selectedObjects.concat(arg);
    }
  };
  
  /**
   * UnSelects 3D Object(s) programmatically
   * @param arg The 3D Object to Select
   */
  export const unselectObject3D = (args: THREE.Object3D[] | THREE.Object3D) => {
    if (!(args instanceof Array)) args = [args];
    args.forEach((arg) => {
      if (!window.selectedItems) return;
      const findIndex0 = window.selectedItems.findIndex((a) => a.id === arg.id);
      findIndex0 !== -1 && window.selectedItems.splice(findIndex0, 1);
  
      const findIndex1 = window.outlinePass.selectedObjects.findIndex(
        (a) => a.id === arg.id
      );
      findIndex1 !== -1 &&
        window.outlinePass.selectedObjects.splice(findIndex1, 1);
    });
  };