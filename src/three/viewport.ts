import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

var scene = new THREE.Scene();

// It is being used as a window attribute, just not in this file.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var selectedItem = null;
window.scene = scene;

export const viewportInit = (targetClass = "viewport") => {
  const target = document.getElementsByClassName(targetClass);
  if (target) {
    target[0].innerHTML = "";
    // Renderer and Scene Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true });
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
    const near = 1.0;
    const far = 200.0;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 30, 0);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // Setting up RayCaster
    let ndcMouseX = -1;
    let ndcMouseY = -1;
    let rc = new THREE.Raycaster();

    (target[0] as HTMLDivElement).onmousemove = (e) => {
      ndcMouseX =
        ((e.pageX - (target[0] as HTMLDivElement).offsetLeft) / Cwidth()) * 2 -
        1;
      ndcMouseY =
        -((e.pageY - (target[0] as HTMLDivElement).offsetTop) / Cheight()) * 2 +
        1;
    };

    const CheckRC = (
      camera: THREE.PerspectiveCamera,
      onIntersection: (arg: THREE.Intersection[]) => void,
      onEmpty = () => {}
    ) => {
      rc.setFromCamera(new THREE.Vector3(ndcMouseX, ndcMouseY, 0), camera);
      let intersects = rc.intersectObjects(window.scene.children);
      if (intersects.length > 0) {
        onIntersection(intersects);
      } else {
        onEmpty();
      }
    };

    // Adding Stuff to Our World
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
    const renderPass = new RenderPass(scene, camera); // make render pass
    composer.addPass(renderPass); // add render pass

    const outlinePass = new OutlinePass(
      new THREE.Vector2(Cwidth(), Cheight()),
      scene,
      camera
    );
    composer.addPass(outlinePass);

    (target[0] as HTMLDivElement).onmousedown = () => {
      CheckRC(
        camera,
        (intersects: THREE.Intersection[]) => {
          window.selectedItem = intersects[0].object;
          outlinePass.selectedObjects = [intersects[0].object];
        },
        () => {
          window.selectedItem = null;
          outlinePass.selectedObjects = [];
        }
      );
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
        camera.aspect = Cwidth() / Cheight();
        renderer.setSize(Cwidth(), Cheight());
        camera.updateProjectionMatrix();
      },
      false
    );
  }
};
