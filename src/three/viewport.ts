import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ViewportModes } from "../enums";
import { doForSelectedItems, getHelperTarget } from "../utils/utils";
import {
  isMultiselect,
  selectObject3D,
  unselectObject3D,
} from "../utils/selection";
import { performAnimationStep } from "../utils/animations";
import { mousePosition, ndcMousePosition } from "../utils/mouse";
import {
  viewportDivClassName,
  ViewportInteractionAllowed,
} from "../utils/constants";

export const scene = new THREE.Scene();

export const ambientLight = new THREE.AmbientLight(0xffffff, 2);

export let defaultViewportCamera: THREE.PerspectiveCamera;

export let composer: EffectComposer;
export let renderPass: RenderPass;

export const getViewportCamera = () => renderPass.camera;
export const setViewportCamera = (arg: THREE.Camera) => {
  console.log(arg.id);
  renderPass.camera = arg;
};

export let outlinePass: OutlinePass;

export const viewportMode = {
  value: ViewportModes.navigate,
};

export let controls: OrbitControls;

let previousRAF: number;

export const viewportInit = (targetClass = viewportDivClassName) => {
  // Only run when viewport isn't already initialised
  if (scene.children.length > 0) return;

  const target = document.getElementsByClassName(targetClass);
  if (target) {
    target[0].innerHTML = "";
    // Renderer and Scene Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const Cwidth = () => {
      return document.getElementsByClassName(targetClass)[0].clientWidth;
    };
    const Cheight = () => {
      return document.getElementsByClassName(targetClass)[0].clientHeight;
    };
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(Cwidth(), Cheight());
    renderer.physicallyCorrectLights = true;
    renderer.domElement.setAttribute("id", "three-canvas");
    renderer.domElement.style.width = `${Cwidth()}px`;
    renderer.domElement.style.height = `${Cheight()}px`;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.bottom = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "1";

    target[0].appendChild(renderer.domElement);
    scene.add(ambientLight);

    // Camera Setup
    const aspect = Cwidth() / Cheight();
    const fov = 60;
    const near = 0.2;
    const far = 400.0;
    defaultViewportCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const viewportCamera = defaultViewportCamera;
    viewportCamera.position.set(10, 10, 10);
    viewportCamera.lookAt(0, 0, 0);
    controls = new OrbitControls(viewportCamera, renderer.domElement);
    controls.zoomSpeed = 3;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.LEFT,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.RIGHT,
    };
    controls.update();

    // Setting up RayCaster
    let rc = new THREE.Raycaster();

    renderer.domElement.onmousemove = () => {
      ndcMousePosition.x =
        ((mousePosition.x - renderer.domElement.getBoundingClientRect().left) /
          Cwidth()) *
          2 -
        1;

      ndcMousePosition.y =
        -(
          (mousePosition.y - renderer.domElement.getBoundingClientRect().top) /
          Cheight()
        ) *
          2 +
        1;
    };

    /**
     * Generic Singular RayCast Job
     *
     * @param camera The Camera to Ray Cast From
     * @param onIntersection Something to do when there's an intersection
     * @param onEmpty Something to do when there isn't an intersection
     */
    const CheckRC = (
      camera: THREE.PerspectiveCamera,
      onIntersection: (arg: THREE.Intersection[]) => void,
      onEmpty = () => {}
    ) => {
      rc.setFromCamera(
        new THREE.Vector3(ndcMousePosition.x, ndcMousePosition.y, 0),
        camera
      );
      let intersects = rc.intersectObjects(scene.children);
      if (intersects.length > 0) {
        onIntersection(intersects);
      } else {
        onEmpty();
      }
    };

    // Adding Stuff to Our World
    // Helpers
    const axesHelper = new THREE.AxesHelper(0.7);
    axesHelper.geometry.translate(0, 0.05, 0);
    scene.add(axesHelper);

    const size = 1000;
    const divisions = 500;

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      new THREE.Color("#575757"),
      new THREE.Color("#454545")
    );
    scene.add(gridHelper);

    // Post Processing
    composer = new EffectComposer(renderer); // make composer
    renderPass = new RenderPass(scene, viewportCamera); // make render pass
    composer.addPass(renderPass); // add render pass

    /**
     * Outline Pass will be necessary to highlight the selected items
     */
    outlinePass = new OutlinePass(
      new THREE.Vector2(Cwidth(), Cheight()),
      scene,
      viewportCamera
    );
    outlinePass.visibleEdgeColor = new THREE.Color("#FFCC54");
    outlinePass.hiddenEdgeColor = new THREE.Color("#FFCC54");
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 0;
    composer.addPass(outlinePass);

    /**
     * Start a Click Job to Select Items
     */
    renderer.domElement.onmousedown = (ev) => {
      if (ev.button === 0 && viewportMode.value === ViewportModes.navigate) {
        // Only Select on Left Click and on Navigation mode
        CheckRC(viewportCamera, onViewportClickRaycast, () => {
          selectObject3D(null, true);
          outlinePass.selectedObjects = [];
        });
      }
    };

    // Play Animation
    const RAF = () => {
      requestAnimationFrame((timeElapsed) => {
        // Recursively Render
        composer.render();
        RAF();

        // Animations
        if (!previousRAF) {
          previousRAF = timeElapsed;
        }

        performAnimationStep(timeElapsed);

        previousRAF = timeElapsed;
      });
    };

    RAF();

    /**
     * Debouncing as Resizing isn't smooth
     * continous resizing just results in a blank screen
     * for the entire duration.
     */
    const onResize = () => {
      viewportCamera.aspect = Cwidth() / Cheight();
      setTimeout(() => renderer.setSize(Cwidth(), Cheight()), 10);
      viewportCamera.updateProjectionMatrix();
    };

    // Responsiveness
    const resizeObserver = new ResizeObserver(onResize);

    resizeObserver.observe(target[0]);
  }
};

const onViewportClickRaycast = (intersects: THREE.Intersection[]) => {
  /**
   * Only proceed for the main camera
   */
  if (renderPass.camera.id !== defaultViewportCamera.id) return;
  /**
   * Only select items that we're allowed to interact with.
   * Examples of items we aren't allowed to interact with are,
   * Grid helper, Axes helper, helpers in general
   */
  let selectedMeshIndex = 0;
  for (let i = 0; i < intersects.length; i++)
    if (ViewportInteractionAllowed.includes(intersects[i].object.type)) {
      selectedMeshIndex = i;
    }

  /**
   * Set the Largest Shell as Selected
   * i.e. if a part of a group is selected,
   * select the whole group instead
   */
  let selectedItem: THREE.Object3D | null =
    intersects[selectedMeshIndex].object;

  while (
    typeof selectedItem?.parent?.name === "string" &&
    selectedItem?.parent?.type !== "Scene"
  )
    selectedItem = (selectedItem as THREE.Mesh).parent;

  /**
   * Select the actual object if selected a helper
   */
  const helperTarget = getHelperTarget(selectedItem);
  selectedItem = helperTarget ? helperTarget : selectedItem;

  /**
   * If an item is already selected
   * clicking on them whould unselect them
   */
  let itemAlreadySelected = false;
  doForSelectedItems((item) => {
    if (item.id === selectedItem!.id) itemAlreadySelected = true;
  });

  if (selectedItem && itemAlreadySelected) {
    unselectObject3D(selectedItem);
  } else {
    selectObject3D(selectedItem, !isMultiselect);
  }
};
