import { ViewportEventType } from "../enums";
import { DriverInfo, ViewportEvent } from "./events";

/**
 * When the number of events gets large,
 * we don't wanna slow down event history stack
 * operations.
 *
 * So we Coalesce first few Events,
 * what this means is for those first few events,
 * we get rid of unecessary events and only keep events
 * that would be necessary for code reconstruction.
 *
 * For Example, if an object was deleted, any operation / events
 * performed on it before deletion are unnecessary.
 *
 * The tradeoff is we can't step-by-step undo the events we lose,
 * however this trade-off makes sense as undoing beyond a 200 (say) steps
 * is uncommon
 *
 * @param length length of the history to coalesce
 * @param start where to start the coalescing from
 * @returns true for success, false for failure
 */
export const coalesceVEHistory = (length: number = 50, start: number = 0) => {
  const presentVEStack = window.viewportEventHistory;
  if (start + length > presentVEStack.length) return false;
  const covered = [] as string[];
  const deleted = [] as number[];
  const newVEStack = [] as ViewportEvent[];
  for (let i = length - 1; i >= start; i--) {
    const { type, info } = presentVEStack[i];
    /** Don't retain anything if an object has been deleted */
    if (deleted.includes(info.objectID)) continue;
    if (type === ViewportEventType.deleteMesh) {
      deleted.push(info.objectID);
      continue;
    }
    /** Don't covered anything that doesn't help
     * in code reconstruction
     */
    const tag = type + info.objectID; /** For uniquely tracking an event  */
    if (covered.includes(tag)) continue;

    if (type === ViewportEventType.setDriver) {
      covered.push(tag + (info as DriverInfo).property);
      /** Only retain if the driver still exists */
      if ((info as DriverInfo).finalExpression)
        newVEStack.push(presentVEStack[i]);
    }

    covered.push(tag);
    newVEStack.push(presentVEStack[i]);
  }

  const result = [] as ViewportEvent[];

  try {
    for (let i = 0; i < window.viewportEventHistory.length; i++) {
      if (i < start || i >= start + length) {
        result.push(window.viewportEventHistory[i]);
        continue;
      }
      if (newVEStack.length) result.push(newVEStack.pop()!);
    }
  } catch {
    return false;
  }

  window.viewportEventHistory = result;
  return true;
};
