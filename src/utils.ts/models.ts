import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { MeshLoadMethod, Primitives, ViewportEventType } from "../enums";
import * as THREE from "three";
import { commitTransaction, startTransaction } from "./transactions";

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
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.sphere:
        geometry = new THREE.SphereGeometry(2, 32, 16);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.cylinder:
        geometry = new THREE.CylinderGeometry(2, 2, 4, 32);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.plane:
        geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.torus:
        geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.cone:
        geometry = new THREE.ConeGeometry(3, 4, 32);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.capsule:
        geometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.icosahedron:
        geometry = new THREE.IcosahedronGeometry(2, 1);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
    }
  } else {
    switch (modelPath) {
      case Primitives.cube:
        geometry = new THREE.BoxBufferGeometry(3, 3, 3);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.sphere:
        geometry = new THREE.SphereBufferGeometry(2, 32, 16);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.cylinder:
        geometry = new THREE.CylinderBufferGeometry(2, 2, 4, 32);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.plane:
        geometry = new THREE.PlaneBufferGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.torus:
        geometry = new THREE.TorusBufferGeometry(2, 0.5, 16, 100);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.cone:
        geometry = new THREE.ConeBufferGeometry(3, 4, 32);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.capsule:
        geometry = new THREE.CapsuleBufferGeometry(1, 1, 4, 8);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
      case Primitives.icosahedron:
        geometry = new THREE.IcosahedronBufferGeometry(2, 1);
        mesh = new THREE.Mesh(geometry, window.defaultMaterial);
        break;
    }
  }

  if (mesh) {
    if (!(size instanceof Array)) size = [size, size, size];
    mesh.position.set(...pos);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...size);
    preprocess(mesh);
    window.scene.add(mesh);

    // Record Transaction
    if (asTransaction) {
      startTransaction(ViewportEventType.loadMesh);
      window.pendingMeshTransactionInfo = {
        path: modelPath,
        method: buffer
          ? MeshLoadMethod.loadPrimitiveBuffer
          : MeshLoadMethod.loadPrimitive,
      };
      window.pendingTransactionObjectID = mesh.id;
      commitTransaction();
    }
  }
};

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
      preprocess(gltf.scene);
      window.scene.add(gltf.scene);

      if (asTransaction) {
        // Record Transaction
        startTransaction(ViewportEventType.loadMesh);
        window.pendingMeshTransactionInfo = {
          path: modelPath,
          method: MeshLoadMethod.loadGLTF,
        };
        window.pendingTransactionObjectID = gltf.scene.id;
        commitTransaction();
      }
    });
  }
};

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
      preprocess(fbx);
      window.scene.add(fbx);

      // Record Transaction
      if (asTransaction) {
        startTransaction(ViewportEventType.loadMesh);
        window.pendingMeshTransactionInfo = {
          path: modelPath,
          method: MeshLoadMethod.loadFBX,
        };
        window.pendingTransactionObjectID = fbx.id;
        commitTransaction();
      }
    });
  }
};

export const getLoader = (loadMethod: MeshLoadMethod) => {
  return {
    [MeshLoadMethod.loadFBX]: loadFBXModel,
    [MeshLoadMethod.loadGLTF]: loadGLTFModel,
    [MeshLoadMethod.loadPrimitive]: loadPrimitive,
    [MeshLoadMethod.loadPrimitiveBuffer]: (arg: {
      modelPath?: string | undefined;
      pos?: [number, number, number] | undefined;
      rotation?: [number, number, number] | undefined;
      size?: number | [number, number, number] | undefined;
      preprocess?: ((arg: THREE.Mesh) => void) | undefined;
      buffer?: boolean | undefined;
    }) => {
      loadPrimitive({ ...arg, buffer: true });
    },
  }[loadMethod];
};
