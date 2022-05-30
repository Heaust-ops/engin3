import { ViewportModes, ViewportEventType, WorkingAxes } from "../enums";
import { ViewportInteractionAllowed } from "./constants";
import { getLatestVE, reloadFromVE } from "./events";
import {
  rollbackTransaction,
  startTransaction,
  removeSelectedMesh,
  commitTransaction,
} from "./transactions";
import { doForSelectedItems } from "./utils";
import { isSelectedType } from "./validity";

export const handleHotkeys = (
  hotkeyStack: KeyboardEvent["key"][],
  setmode: (arg: ViewportModes) => void
) => {
  if (window.multiselect) window.multiselect = false;
  switch (hotkeyStack.join("")) {
    // Undo
    case "controlz":
      rollbackTransaction();
      break;
    case "o":
      break;

    // Deletion and Changing Working Axes
    case "x":
      if (window.viewportMode === ViewportModes.navigate) {
        startTransaction(ViewportEventType.delete);
        removeSelectedMesh();
        commitTransaction();
        /** End of Deletion Logic */
      } else if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.x;
      break;
    case "y":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.y;
      break;
    case "z":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.z;
      break;
    case "shiftx":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.notx;
      break;
    case "shifty":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.noty;
      break;
    case "shiftz":
      if (
        [
          ViewportModes.grab,
          ViewportModes.rotate,
          ViewportModes.scale,
        ].includes(window.viewportMode)
      )
        window.workingAxis = WorkingAxes.notz;
      break;

    // Changing Viewport Modes
    // Grab
    case "g":
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.grab
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.grab);
      break;
    // Rotate
    case "r":
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.rotate
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.rotate);
      break;
    // Scale
    case "s":
      if (isSelectedType(...ViewportInteractionAllowed))
        window.viewportMode === ViewportModes.scale
          ? setmode(ViewportModes.navigate)
          : setmode(ViewportModes.scale);
      break;
    // clone
    case "shiftd":
      if (isSelectedType(...ViewportInteractionAllowed)) {
        doForSelectedItems((x) => {
          const ve = getLatestVE(
            ViewportEventType.loadMesh,
            null,
            (ve) => ve.info.objectID === x.id
          );
          if (ve) reloadFromVE(ve, true);
        });
        setmode(ViewportModes.grab);
      }
      break;

    case "shift":
      if (!window.multiselect) window.multiselect = true;
      break;
  }
};
