import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  Cameras,
  Lights,
  MeshLoadMethod,
  Primitives,
  ViewportEventType,
} from "../enums";
import * as THREE from "three";
import { commitTransaction, startTransaction } from "./transactions";
import { addAnimationStep } from "./animations";
import { randomColor } from "./utils";
import { defaultMaterial } from "./materials";
import { scene } from "../three/viewport";
import { viewportDivClassName } from "./constants";
import { CameraHelper } from "./CameraHelper";

/**
 * This Page Keeps the Model Loaders,
 * Every Model Loader Should have these Optional Parameters,
 * Even if it does nothing with it.
 *
 * modelPath: string;
 * Details of the Model to Load, specifically
 * What model do you want to load?
 *
 * pos: [number, number, number];
 * Initial Position of the model.
 *
 * rotation: [number, number, number];
 * Initial Rotation of the model.
 *
 * size: number | [number, number, number];
 * Initial Size / Scale of the model.
 *
 * preprocess: (arg: THREE.Mesh) => void;
 * Before adding the model to scene,
 * the option to do something with it.
 *
 * asTransaction: boolean;
 * Should we record the transaction of the model being
 * loaded, should be true by default
 *
 */

/** ======================================================= */

/**
 * Model Loader For Primitives and Primitive Buffers
 */
export const loadPrimitive = ({
  modelPath,
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 1,
  preprocess = (/* Mesh */) => {},
  buffer = false,
  asTransaction = true,
}: {
  modelPath?: string;
  pos?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number, number];
  preprocess?: (arg: THREE.Mesh) => void;
  buffer?: boolean;
  asTransaction?: boolean;
} = {}) => {
  if (!modelPath) return;
  let geometry: THREE.BufferGeometry;
  let mesh: THREE.Mesh | null = null;

  if (buffer) {
    switch (modelPath) {
      case Primitives.cube:
        geometry = new THREE.BoxGeometry(3, 3, 3);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.sphere:
        geometry = new THREE.SphereGeometry(2, 32, 16);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.cylinder:
        geometry = new THREE.CylinderGeometry(2, 2, 4, 32);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.plane:
        geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.torus:
        geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.cone:
        geometry = new THREE.ConeGeometry(3, 4, 32);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.capsule:
        geometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.icosahedron:
        geometry = new THREE.IcosahedronGeometry(2, 1);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
    }
  } else {
    switch (modelPath) {
      case Primitives.cube:
        geometry = new THREE.BoxBufferGeometry(3, 3, 3);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.sphere:
        geometry = new THREE.SphereBufferGeometry(2, 32, 16);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.cylinder:
        geometry = new THREE.CylinderBufferGeometry(2, 2, 4, 32);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.plane:
        geometry = new THREE.PlaneBufferGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.torus:
        geometry = new THREE.TorusBufferGeometry(2, 0.5, 16, 100);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.cone:
        geometry = new THREE.ConeBufferGeometry(3, 4, 32);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.capsule:
        geometry = new THREE.CapsuleBufferGeometry(1, 1, 4, 8);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
      case Primitives.icosahedron:
        geometry = new THREE.IcosahedronBufferGeometry(2, 1);
        mesh = new THREE.Mesh(geometry, defaultMaterial);
        break;
    }
  }

  if (mesh) {
    if (!(size instanceof Array)) size = [size, size, size];
    mesh.position.set(...pos);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...size);
    mesh.name = modelPath + randomColor();
    preprocess(mesh);
    scene.add(mesh);

    // Record Transaction
    if (asTransaction) {
      const pendingMeshTransaction = {
        type: ViewportEventType.loadMesh,
        objectID: mesh.id,
        initials: {
          path: modelPath,
          method: buffer
            ? MeshLoadMethod.loadPrimitiveBuffer
            : MeshLoadMethod.loadPrimitive,
        },
      };
      startTransaction(ViewportEventType.loadMesh, [pendingMeshTransaction]);
      commitTransaction();
    }
  }
};

/**
 * Model Loader For GLTF / GLB
 */
export const loadGLTFModel = ({
  modelPath,
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 1,
  removeObjSubstr = "",
  preprocess = (/* gltfScene */) => {},
  asTransaction = true,
}: {
  modelPath?: string;
  pos?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number, number];
  removeObjSubstr?: string;
  preprocess?: (arg: THREE.Group) => void;
  asTransaction?: boolean;
} = {}) => {
  if (modelPath) {
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      if (!(size instanceof Array)) size = [size, size, size];
      gltf.scene.scale.set(...size);
      let tmpArr = [] as THREE.Object3D[];
      gltf.scene.traverse((c) => {
        if (removeObjSubstr && c.name.includes(removeObjSubstr)) {
          tmpArr.push(c);
        } else {
          c.castShadow = false;
        }
      });
      tmpArr.forEach((node) => {
        gltf.scene.remove(node);
      });
      gltf.scene.position.set(...pos);
      gltf.scene.rotation.set(...rotation);
      gltf.scene.name = "GLTFModel" + randomColor();
      preprocess(gltf.scene);
      scene.add(gltf.scene);

      if (asTransaction) {
        // Record Transaction
        const pendingMeshTransaction = {
          type: ViewportEventType.loadMesh,
          objectID: gltf.scene.id,
          initials: {
            path: modelPath,
            method: MeshLoadMethod.loadGLTF,
          },
        };
        startTransaction(ViewportEventType.loadMesh, [pendingMeshTransaction]);
        commitTransaction();
      }
    });
  }
};

/**
 * Model Loader For FBX
 */
export const loadFBXModel = ({
  modelPath,
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 0.1,
  preprocess = (/* FBXObject */) => {},
  asTransaction = true,
}: {
  modelPath?: string;
  pos?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number, number];
  preprocess?: (arg: THREE.Group) => void;
  asTransaction?: boolean;
} = {}) => {
  if (modelPath) {
    const loader = new FBXLoader();
    loader.setPath(modelPath);
    loader.load("", (fbx) => {
      if (!(size instanceof Array)) size = [size, size, size];
      fbx.scale.set(...size);
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.position.set(...pos);
      fbx.rotation.set(...rotation);
      fbx.name = "FBXModel" + randomColor();
      preprocess(fbx);
      scene.add(fbx);

      // Record Transaction
      if (asTransaction) {
        const pendingMeshTransaction = {
          type: ViewportEventType.loadMesh,
          objectID: fbx.id,
          initials: {
            path: modelPath,
            method: MeshLoadMethod.loadFBX,
          },
        };
        startTransaction(ViewportEventType.loadMesh, [pendingMeshTransaction]);
        commitTransaction();
      }
    });
  }
};

/**
 * Model Loader For Lights
 */
export const loadLight = ({
  modelPath,
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 1,
  preprocess = (/* Mesh */) => {},
  buffer = false,
  asTransaction = true,
}: {
  modelPath?: string;
  pos?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number, number];
  preprocess?: (arg: THREE.Object3D) => void;
  buffer?: boolean;
  asTransaction?: boolean;
} = {}) => {
  if (!modelPath) return;
  let light: THREE.Light | null = null;
  switch (modelPath) {
    case Lights.directional: {
      light = new THREE.DirectionalLight(0xff0000, 60);
      scene.add(light);
      const helper = new THREE.PointLightHelper(
        light as THREE.PointLight,
        1,
        "#2e97ea"
      );
      helper.type = "DirectionalLightHelper";
      addAnimationStep(() => {
        if ((light as THREE.DirectionalLight)?.target) {
          light!.lookAt((light as THREE.DirectionalLight).target.position);
        }
      });
      scene.add(helper);
      break;
    }
    case Lights.hemispehre: {
      light = new THREE.HemisphereLight(0xff0000, 0x00ff00, 1);
      const helper = new THREE.HemisphereLightHelper(
        light as THREE.HemisphereLight,
        1,
        "#D87EBE"
      );
      helper.type = "HemisphereLightHelper";
      scene.add(helper);
      break;
    }
    case Lights.point: {
      light = new THREE.PointLight(0xff0000, 60, 100);
      scene.add(light);

      const helper = new THREE.PointLightHelper(light as THREE.PointLight, 1);
      scene.add(helper);
      break;
    }
    case Lights.spot: {
      light = new THREE.SpotLight(0xff0000, 60);
      scene.add(light);
      const helper = new THREE.PointLightHelper(
        light as THREE.PointLight,
        1,
        "#9859BF"
      );
      helper.type = "SpotLightHelper";
      addAnimationStep(() => {
        if ((light as THREE.SpotLight)?.target) {
          light!.lookAt((light as THREE.SpotLight).target.position);
        }
      });
      scene.add(helper);
      break;
    }
  }

  if (light) {
    if (!(size instanceof Array)) size = [size, size, size];
    light.position.set(...pos);
    light.rotation.set(...rotation);
    light.scale.set(...size);
    light.name = modelPath + randomColor();
    preprocess(light);
    scene.add(light);

    // Record Transaction
    if (asTransaction) {
      const pendingMeshTransaction = {
        type: ViewportEventType.loadMesh,
        objectID: light.id,
        initials: {
          path: modelPath,
          method: MeshLoadMethod.loadLight,
        },
      };
      startTransaction(ViewportEventType.loadMesh, [pendingMeshTransaction]);
      commitTransaction();
    }
  }
};

/**
 * Model Loader For Lights
 */
export const loadCamera = ({
  modelPath,
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 5,
  preprocess = (/* Mesh */) => {},
  buffer = false,
  asTransaction = true,
}: {
  modelPath?: string;
  pos?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number, number];
  preprocess?: (arg: THREE.Object3D) => void;
  buffer?: boolean;
  asTransaction?: boolean;
} = {}) => {
  if (!modelPath) return;
  let camera: THREE.Camera | null = null;

  const Cwidth = () => {
    return document.getElementsByClassName(viewportDivClassName)[0].clientWidth;
  };
  const Cheight = () => {
    return document.getElementsByClassName(viewportDivClassName)[0]
      .clientHeight;
  };

  switch (modelPath) {
    case Cameras.perspective:
      camera = new THREE.PerspectiveCamera(75, Cwidth() / Cheight(), 0.1, 1000);
      const persprectiveHelper = new CameraHelper(camera, {
        colorFarFrustum: null,
        colorTarget: null,
      });
      scene.add(persprectiveHelper);
      break;
    case Cameras.orthographic:
      camera = new THREE.OrthographicCamera(
        Cwidth() / -2,
        Cwidth() / 2,
        Cheight() / 2,
        Cheight() / -2,
        1,
        1000
      );
      const orthographicHelper = new CameraHelper(camera, {
        colorFarFrustum: null,
        colorTarget: null,
      });
      scene.add(orthographicHelper);
      break;
  }

  if (camera) {
    if (!(size instanceof Array)) size = [size, size, size];
    camera.position.set(...pos);
    camera.rotation.set(...rotation);
    camera.scale.set(...size);
    camera.name = modelPath + randomColor();
    preprocess(camera);
    scene.add(camera);

    // Record Transaction
    if (asTransaction) {
      const pendingMeshTransaction = {
        type: ViewportEventType.loadMesh,
        objectID: camera.id,
        initials: {
          path: modelPath,
          method: MeshLoadMethod.loadCamera,
        },
      };
      startTransaction(ViewportEventType.loadMesh, [pendingMeshTransaction]);
      commitTransaction();
    }
  }
};

/**
 * Used to get a Specific Model Loader
 * @param loadMethod The Method of Loading
 * @returns The appropriate loader that uses the given method to load
 */
export const getLoader = (loadMethod: MeshLoadMethod) => {
  return {
    [MeshLoadMethod.loadFBX]: loadFBXModel,
    [MeshLoadMethod.loadGLTF]: loadGLTFModel,
    [MeshLoadMethod.loadPrimitive]: loadPrimitive,
    [MeshLoadMethod.loadLight]: loadLight,
    [MeshLoadMethod.loadCamera]: loadCamera,
    [MeshLoadMethod.loadPrimitiveBuffer]: (arg: {
      modelPath?: string;
      pos?: [number, number, number];
      rotation?: [number, number, number];
      size?: number | [number, number, number];
      preprocess?: (arg: THREE.Mesh) => void;
      asTransaction?: boolean;
    }) => {
      loadPrimitive({ ...arg, buffer: true });
    },
  }[loadMethod];
};
