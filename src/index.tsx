import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Material } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { ViewportModes, WorkingAxes } from "./enums";
import { MousePosition } from "./interfaces";
import { ViewportEvent } from "./utils/events";
import { PendingTransaction } from "./utils/transactions";
import { AnimationFunction } from "./utils/animations";

/**
 * Heap Variables
 */
declare global {
  interface Window {
    scene: THREE.Scene;
    selectedItems: THREE.Object3D[];
    mousePosition: MousePosition;
    ndcMousePosition: MousePosition;
    viewportMode: ViewportModes;
    workingAxis: WorkingAxes;
    controls: OrbitControls;
    defaultMaterial: Material;
    materials: Material[];
    viewportCamera: THREE.PerspectiveCamera;
    viewportEventHistory: ViewportEvent[];
    outlinePass: OutlinePass;
    pendingTransactions: PendingTransaction[];
    multiselect: boolean;
    animationStack: (AnimationFunction | null)[];
    previousRAF: number;
  }
}

window.pendingTransactions = [];
window.mousePosition = { x: -1, y: -1 };
window.ndcMousePosition = { x: -1, y: -1 };
window.workingAxis = WorkingAxes.all;
window.viewportMode = ViewportModes.navigate;
window.viewportEventHistory = [];
window.animationStack = [];
window.materials = [window.defaultMaterial];

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
