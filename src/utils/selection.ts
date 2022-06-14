import {
  NonSelectionTypes,
  TypesThatNeedHelpers,
  ViewportInteractionAllowed,
} from "./constants";
import { getHelper } from "./utils";

export let selectedItems = [] as THREE.Object3D[];
export const isAnySelected = () => !!selectedItems.length;

/**
 * Highlights passed objects
 * @param args The 3D Objects to highlight
 */
export const highlightObjects = (args: THREE.Object3D[]) => {
  window.outlinePass.selectedObjects = args;
};

/**
 * Selects 3D Object(s) programmatically
 *
 * Strict mode means unselect everything not in the list provided
 *
 * @param arg The 3D Object to Select
 */
export const selectObject3D = (
  arg: THREE.Object3D | THREE.Object3D[] | null,
  strict = false
) => {
  /** For no valid arguments with strict mode, unselect all */
  if (
    arg === null ||
    (arg instanceof Array && arg.length === 0) ||
    ((arg as THREE.Object3D).type &&
      NonSelectionTypes.includes((arg as THREE.Object3D).type))
  ) {
    if (strict) {
      selectedItems = [];
      window.outlinePass.selectedObjects = [];
    }
    return;
  }

  if (!(arg instanceof Array)) arg = [arg];

  /** also consider helpers */
  arg.forEach((item) => {
    if (TypesThatNeedHelpers.includes(item.type)) {
      const helper = getHelper(item);
      if (helper) arg = (arg as THREE.Object3D[]).concat(helper);
    }
  });

  if (strict) {
    selectedItems = arg;
    window.outlinePass.selectedObjects = arg;
  } else {
    selectedItems = selectedItems.concat(arg);
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
  /** If an object has a helper, we need to unselect it too */
  let helpers = [] as THREE.Object3D[];
  args.forEach((arg) => {
    const helper = getHelper(arg);
    if (helper) helpers.push(helper);
  });
  args = [...args, ...helpers];

  /** Removing from selected and outlined */
  args.forEach((arg) => {
    if (!selectedItems) return;
    const findIndex0 = selectedItems.findIndex((a) => a.id === arg.id);
    findIndex0 !== -1 && selectedItems.splice(findIndex0, 1);

    const findIndex1 = window.outlinePass.selectedObjects.findIndex(
      (a) => a.id === arg.id
    );
    findIndex1 !== -1 &&
      window.outlinePass.selectedObjects.splice(findIndex1, 1);
  });
};

export const numSelected = (selected: THREE.Object3D[] = selectedItems) => {
  const actSelected = selected.filter((x) =>
    ViewportInteractionAllowed.includes(x.type)
  );

  return actSelected.length;
};

export const properSelected = (selected: THREE.Object3D[] = selectedItems) => {
  const actSelected = selected.filter((x) =>
    ViewportInteractionAllowed.includes(x.type)
  );

  return actSelected;
};
