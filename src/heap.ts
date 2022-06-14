import { ViewportModes, WorkingAxes } from "./enums";

/**
 * Heap Variables
 */
declare global {
  interface Window {
    viewportMode: ViewportModes /** Things like Grab, Scale, Rotate */;

    /** Current working axis
     *
     * Relevant axis for some actions like Grab, Scale, Rotate
     */
    workingAxis: WorkingAxes;
  }
}

/**
 * Initialising Heap Variables
 */
export const heapInit = () => {
  window.workingAxis = WorkingAxes.all;
  window.viewportMode = ViewportModes.navigate;
};
