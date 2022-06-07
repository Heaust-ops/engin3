import { Material } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { ViewportModes, WorkingAxes } from "./enums";
import { MousePosition } from "./interfaces";
import { AnimationFunction } from "./utils/animations";
import { ViewportEvent } from "./utils/events";
import { PendingTransaction } from "./utils/transactions";

/**
 * Heap Variables
 */
declare global {
  interface Window {
    scene: THREE.Scene /** The threejs scene we're working with */;
    selectedItems: THREE.Object3D[] /** Currently selected Items */;
    mousePosition: MousePosition /** Current Mouse Position */;
    ndcMousePosition: MousePosition /** Normalised Device Co-ordinates (mouse position) */;
    viewportMode: ViewportModes /** Things like Grab, Scale, Rotate */;

    /** Current working axis
     *
     * Relevant axis for some actions like Grab, Scale, Rotate
     */
    workingAxis: WorkingAxes;

    controls: OrbitControls /** orbit controls of the engine, won't be reconstructed */;
    defaultMaterial: Material /** the material a primitive spawns with */;
    materials: Material[] /** all the created / used materials */;

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
    viewportEventHistory: ViewportEvent[];
    outlinePass: OutlinePass /** For highlighting selected objects */;
    pendingTransactions: PendingTransaction[] /** Keep track of uncommited transactions */;
    multiselect: boolean /** for shift + selecting */;
    animationStack: (AnimationFunction | null)[] /** for managing animations */;
    previousRAF: number /** the time the previous frame rendered on */;
  }
}

/**
 * Initialising Heap Variables
 */
export const heapInit = () => {
  window.pendingTransactions = [];

  window.mousePosition = { x: -1, y: -1 };
  window.ndcMousePosition = { x: -1, y: -1 };

  window.workingAxis = WorkingAxes.all;
  window.viewportMode = ViewportModes.navigate;

  window.viewportEventHistory = [];

  window.animationStack = [];
  window.materials = [window.defaultMaterial];

  window.scrolly = 0;
  window.scrollRotatey = 0;
  window.scrollyLimit = 100;
  window.scrollRotateyLimit = 100;
};
