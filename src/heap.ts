import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
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

    /** Viewport camera: current camera being used.
     *
     * Default viewport: The camera that the
     * engine uses to look around that won't be generated with the code.
     */
    viewportCamera: THREE.PerspectiveCamera;
    defaultViewportCamera: THREE.PerspectiveCamera;

    /** Pivotal part of the engine.
     *
     * Enables undo and code reconstruction.
     */
    outlinePass: OutlinePass /** For highlighting selected objects */;
    multiselect: boolean /** for shift + selecting */;
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
