import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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

    controls: OrbitControls /** orbit controls of the engine, won't be reconstructed */;

    /**
     * Used with drivers to enable driving with
     * linear or circular scroll
     */
    scrolly: number;
    scrollyLimit: number;
    scrollRotatey: number;
    scrollRotateyLimit: number;
  }
}

/**
 * Initialising Heap Variables
 */
export const heapInit = () => {
  window.workingAxis = WorkingAxes.all;
  window.viewportMode = ViewportModes.navigate;

  window.scrolly = 0;
  window.scrollRotatey = 0;
  window.scrollyLimit = 100;
  window.scrollRotateyLimit = 100;
};
