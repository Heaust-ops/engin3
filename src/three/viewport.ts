import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ViewportModes } from "../enums";

var scene = new THREE.Scene();

// It is being used as a window attribute, just not in this file.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var selectedItem = null;
window.scene = scene;
window.defaultMaterial = new THREE.MeshStandardMaterial({
  color: 0x4073dc,
  side: THREE.DoubleSide,
});

export const viewportInit = (targetClass = "viewport") => {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // Camera Setup
    const aspect = Cwidth() / Cheight();
    const fov = 60;
    const near = 0.2;
    const far = 400.0;
    window.viewportCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
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

    (target[0] as HTMLDivElement).onmousemove = (e) => {
      window.ndcMousePosition = {
        x:
          ((e.pageX - (target[0] as HTMLDivElement).offsetLeft) / Cwidth()) *
            2 -
          1,
        y:
          -((e.pageY - (target[0] as HTMLDivElement).offsetTop) / Cheight()) *
            2 +
          1,
      };
    };

    const CheckRC = (
      camera: THREE.PerspectiveCamera,
      onIntersection: (arg: THREE.Intersection[]) => void,
      onEmpty = () => {}
    ) => {
      rc.setFromCamera(
        new THREE.Vector3(
          window.ndcMousePosition.x,
          window.ndcMousePosition.y,
          0
        ),
        camera
      );
      let intersects = rc.intersectObjects(window.scene.children);
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
    window.scene.add(axesHelper);

    const size = 1000;
    const divisions = 500;

    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      new THREE.Color("#575757"),
      new THREE.Color("#454545")
    );
    scene.add(gridHelper);

    // Add Point Light
    const light = new THREE.PointLight(
      0xffffff /* Color */,
      30 /* Intensity */,
      100 /* Maximum Range of Light */
    );
    light.position.set(30, 30, 30);
    scene.add(light);

    // Post Processing
    const composer = new EffectComposer(renderer); // make composer
    const renderPass = new RenderPass(scene, window.viewportCamera); // make render pass
    composer.addPass(renderPass); // add render pass

    const outlinePass = new OutlinePass(
      new THREE.Vector2(Cwidth(), Cheight()),
      scene,
      window.viewportCamera
    );
    outlinePass.visibleEdgeColor = new THREE.Color("#FFCC54");
    outlinePass.hiddenEdgeColor = new THREE.Color("#FFCC54");
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 0;
    composer.addPass(outlinePass);

    (target[0] as HTMLDivElement).onclick = (ev) => {
      if (ev.button === 0 && window.viewportMode === ViewportModes.navigate) {
        // Only Select on Left Click and on Navigation mode
        CheckRC(
          window.viewportCamera,
          (intersects: THREE.Intersection[]) => {
            // This is to avoid selecting helpers
            let selectedMeshIndex = 0;
            for (let i = 0; i < intersects.length; i++)
              if (
                ["Mesh", "Group", "SkinnedMesh"].includes(
                  intersects[i].object.type
                )
              ) {
                selectedMeshIndex = i;
              }

            // Set the Selected Item to the Closest Mesh
            window.selectedItem = intersects[selectedMeshIndex].object;
            while (
              typeof window.selectedItem?.parent?.name === "string" &&
              window.selectedItem?.parent?.type !== "Scene"
            )
              window.selectedItem = (window.selectedItem as THREE.Mesh).parent;
            outlinePass.selectedObjects = [
              window.selectedItem ?? intersects[selectedMeshIndex].object,
            ];
          },
          () => {
            window.selectedItem = null;
            outlinePass.selectedObjects = [];
          }
        );
      }
    }; // Start a Click Job to Select Items

    // Play Animation
    const RAF = () => {
      requestAnimationFrame(() => {
        // Animations

        // Recursively Render
        composer.render();
        RAF();
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
