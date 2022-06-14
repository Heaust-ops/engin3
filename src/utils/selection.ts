import { outlinePass } from "../three/viewport";
import {
  NonSelectionTypes,
  TypesThatNeedHelpers,
  ViewportInteractionAllowed,
} from "./constants";
import { getHelper } from "./utils";

/**
 * holds the items currently selected.
 * It'll be used a lot
 */
export let selectedItems = [] as THREE.Object3D[];
export const isAnySelected = () => !!selectedItems.length;
/**
 * multiselect mode is when you can select multiple items
 * at once, like when holding shift
 */
export let isMultiselect = false;
export const turnMultiselect = (arg: boolean | null = null) => {
  if (!arg) isMultiselect = !isMultiselect;
  else isMultiselect = true;
};

/**
 * Highlights passed objects
 * @param args The 3D Objects to highlight
 */
export const highlightObjects = (args: THREE.Object3D[]) => {
  outlinePass.selectedObjects = args;
};

/**
 * Selects 3D Object(s) programmatically
 *
 * Strict mode means unselect everything not in the list provided
 *
 * @param arg The 3D Object to Select
 * @param strict strict mode or nah?
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
      outlinePass.selectedObjects = [];
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
    outlinePass.selectedObjects = arg;
  } else {
    selectedItems = selectedItems.concat(arg);
    outlinePass.selectedObjects = outlinePass.selectedObjects.concat(arg);
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

    const findIndex1 = outlinePass.selectedObjects.findIndex(
      (a) => a.id === arg.id
    );
    findIndex1 !== -1 && outlinePass.selectedObjects.splice(findIndex1, 1);
  });
};

/**
 *
 * @param selected Array of 3d objects, selected items by default
 * @returns length of actually selecteds item (not considering helpers)
 */
export const numSelected = (selected: THREE.Object3D[] = selectedItems) => {
  const actSelected = selected.filter((x) =>
    ViewportInteractionAllowed.includes(x.type)
  );

  return actSelected.length;
};

/**
 *
 * @param selected Array of 3d objects, selected items by default
 * @returns array of actually selected items (not considering helpers)
 */
export const properSelected = (selected: THREE.Object3D[] = selectedItems) => {
  const actSelected = selected.filter((x) =>
    ViewportInteractionAllowed.includes(x.type)
  );

  return actSelected;
};
