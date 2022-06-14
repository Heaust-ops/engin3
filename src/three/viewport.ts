import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ViewportModes } from "../enums";
import { doForSelectedItems } from "../utils/utils";
import { selectObject3D, unselectObject3D } from "../utils/selection";
import { performAnimationStep } from "../utils/animations";
import { mousePosition, ndcMousePosition } from "../utils/mouse";
import { viewportDivClassName } from "../utils/constants";

export const scene = new THREE.Scene();
export const ambientLight = new THREE.AmbientLight(0xffffff, 2);
let previousRAF: number;

window.multiselect = false;

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
    window.viewportCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    window.defaultViewportCamera = window.viewportCamera;
    window.viewportCamera.position.set(10, 10, 10);
    window.viewportCamera.lookAt(0, 0, 0);
    window.controls = new OrbitControls(
      window.viewportCamera,
      renderer.domElement
    );
    window.controls.zoomSpeed = 3;
    window.controls.mouseButtons = {
      LEFT: THREE.MOUSE.LEFT,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.RIGHT,
    };
    window.controls.update();

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
    const composer = new EffectComposer(renderer); // make composer
    const renderPass = new RenderPass(scene, window.viewportCamera); // make render pass
    composer.addPass(renderPass); // add render pass

    window.outlinePass = new OutlinePass(
      new THREE.Vector2(Cwidth(), Cheight()),
      scene,
      window.viewportCamera
    );
    window.outlinePass.visibleEdgeColor = new THREE.Color("#FFCC54");
    window.outlinePass.hiddenEdgeColor = new THREE.Color("#FFCC54");
    window.outlinePass.edgeStrength = 3;
    window.outlinePass.edgeGlow = 0;
    composer.addPass(window.outlinePass);

    renderer.domElement.onmousedown = (ev) => {
      if (ev.button === 0 && window.viewportMode === ViewportModes.navigate) {
        // Only Select on Left Click and on Navigation mode
        CheckRC(
          window.viewportCamera,
          (intersects: THREE.Intersection[]) => {
            // This is to avoid selecting Axes and Grid helpers
            let selectedMeshIndex = 0;
            for (let i = 0; i < intersects.length; i++)
              if (
                ["Mesh", "Group", "SkinnedMesh"].includes(
                  intersects[i].object.type
                ) ||
                intersects[i].object.type.includes("LightHelper") ||
                intersects[i].object.type.includes("CameraHelper")
              ) {
                selectedMeshIndex = i;
              }

            // Set the Largest Shell as Selected
            let selectedItem: THREE.Object3D | null =
              intersects[selectedMeshIndex].object;

            while (
              typeof selectedItem?.parent?.name === "string" &&
              selectedItem?.parent?.type !== "Scene"
            )
              selectedItem = (selectedItem as THREE.Mesh).parent;

            // Actually select the Lights if selected helper
            if ((selectedItem as THREE.PointLightHelper)?.light) {
              selectedItem = (selectedItem as THREE.PointLightHelper).light;
            }

            // Actually select the Camera if selected helper
            if ((selectedItem as THREE.CameraHelper)?.camera) {
              selectedItem = (selectedItem as THREE.CameraHelper).camera;
            }

            let itemAlreadySelected = false;
            doForSelectedItems((item) => {
              if (item.id === selectedItem!.id) itemAlreadySelected = true;
            });

            if (selectedItem && itemAlreadySelected) {
              unselectObject3D(selectedItem);
            } else {
              selectObject3D(selectedItem, !window.multiselect);
            }
          },
          () => {
            selectObject3D(null, true);
            window.outlinePass.selectedObjects = [];
          }
        );
      }
    }; // Start a Click Job to Select Items

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

    // Responsiveness
    window.addEventListener(
      "resize",
      () => {
        window.viewportCamera.aspect = Cwidth() / Cheight();
        renderer.setSize(Cwidth(), Cheight());
        window.viewportCamera.updateProjectionMatrix();
      },
      false
    );
  }
};
