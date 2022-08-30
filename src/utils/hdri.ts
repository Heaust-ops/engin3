/**
 * This file contains everything related to skyboxes
 * and HDRI lighting
 */

import {
  BackSide,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
} from "three";
import { getCharacterFrequency } from "./utils";

export interface SkyboxPaths {
  x: string;
  y: string;
  z: string;
  nx: string;
  ny: string;
  nz: string;
}

export const makeSkyDome = (scene: THREE.Scene, imageURL: string) => {
  const vertexShader = `
  varying vec2 vUV;

  void main() {  
    vUV = uv;
    vec4 pos = vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * pos;
  }`;

  const fragmentShader = `
  uniform sampler2D tex;
  
  varying vec2 vUV;

  void main() {  
    vec4 smpl = texture2D(tex, vUV);
    gl_FragColor = vec4(smpl.xyz, smpl.w);
  }
  `;

  const geometry = new SphereGeometry(200, 60, 40);
  const uniforms = {
    tex: {
      type: "t",
      value: new TextureLoader().load(imageURL),
    },
  };

  const material = new ShaderMaterial({
    side: DoubleSide,
    uniforms: uniforms,
    vertexShader,
    fragmentShader,
  });

  const skyBox = new Mesh(geometry, material);
  skyBox.type = "skydome";
  skyBox.scale.set(-1, 1, 1);
  scene.add(skyBox);
};

/**
 * Automatically assign and get the side of the env cube,
 * from the filename using identifiers to label them.
 *
 * This works for common naming conventions.
 *
 * @param paths A list of 6 image paths
 * @returns An Object with the env cube side mapped to the respective path
 */
export const getProperSkyboxPaths = (
  /** Need 6 Paths */
  paths: [string, string, string, string, string, string]
) => {
  /**
   * Template for skybox paths
   */
  const skyboxPaths: SkyboxPaths = {
    x: "",
    y: "",
    z: "",
    nx: "",
    ny: "",
    nz: "",
  };

  const frequencies = [...paths.map((o) => getCharacterFrequency(o))];

  /**
   * All the likely negative identifiers
   */
  interface NegativeIdentifers {
    n: number;
    "-": number;
    m: number;
    o: number;
  }

  /**
   * Get the highest frequencies of all axial identifiers
   * and of the likely negative identifiers
   */
  const highest = {
    x: Math.max(...frequencies.map((o) => o.x ?? 0)),
    y: Math.max(...frequencies.map((o) => o.y ?? 0)),
    z: Math.max(...frequencies.map((o) => o.z ?? 0)),
    negativeIdentifer: null as string | null,
    negativeIdentifers: {
      n: Math.max(...frequencies.map((o) => o.n ?? 0)),
      "-": Math.max(...frequencies.map((o) => o["-"] ?? 0)),
      m: Math.max(...frequencies.map((o) => o.m ?? 0)),
      o: Math.max(...frequencies.map((o) => o.o ?? 0)),
    } as NegativeIdentifers,
  };

  /**
   * Determine the negative identifier
   * out of the likely ones, the correct one will have 3
   * occurances of the highest frequency
   */
  Object.keys(highest.negativeIdentifers).forEach((key) => {
    let count = 0;

    frequencies.forEach((f, i) => {
      if (
        f[key] &&
        f[key] === highest.negativeIdentifers[key as keyof NegativeIdentifers]
      ) {
        count++;
      }
    });

    if (count === 3) {
      highest.negativeIdentifer = key;
    }
  });

  /**
   * If there's no good negative Identifier, then
   * we can't parse the skybox paths, return null
   */
  if (!highest.negativeIdentifer) return fallbackSkyboxPathParse(paths);

  /**
   * Prepare Skybox paths
   */
  frequencies.forEach((f, i) => {
    const negativeIdentifierValue =
      highest.negativeIdentifers[
        highest.negativeIdentifer as keyof NegativeIdentifers
      ];

    const isNegative =
      negativeIdentifierValue === f[highest.negativeIdentifer!];

    if (f["x"] === highest.x) {
      isNegative ? (skyboxPaths.nx = paths[i]) : (skyboxPaths.x = paths[i]);
    }
    if (f["y"] === highest.y) {
      isNegative ? (skyboxPaths.ny = paths[i]) : (skyboxPaths.y = paths[i]);
    }
    if (f["z"] === highest.z) {
      isNegative ? (skyboxPaths.nz = paths[i]) : (skyboxPaths.z = paths[i]);
    }
  });

  if (!Object.values(skyboxPaths).every((x) => !!x))
    return fallbackSkyboxPathParse(paths);

  return skyboxPaths;
};

/**
 * Automatically assign and get the side of the env cube,
 * from the filename using identifiers to label them.
 *
 * This a Fallback for if the skyboxes don't follow the
 * most common convention.
 *
 * It looks for possible keywords.
 *
 * @param paths A list of 6 image paths
 * @returns An Object with the env cube side mapped to the respective path
 */
const fallbackSkyboxPathParse = (
  /** Need 6 Paths */
  paths: [string, string, string, string, string, string]
) => {
  /**
   * Template for skybox paths
   */
  const skyboxPaths: SkyboxPaths = {
    x: "",
    y: "",
    z: "",
    nx: "",
    ny: "",
    nz: "",
  };

  /**
   * Get possible keyword counts associated with
   * the axes
   */
  const substringMatches = paths.map((path) => {
    const keywords = {
      /** Top */
      y: (path.match(/(top|tp|up)/g) || []).length,
      /** Down */
      ny: (path.match(/down|dn|dw|bot/g) || []).length,
      /** Right */
      x: (path.match(/right|rt|rg/g) || []).length,
      /** Left */
      nx: (path.match(/left|lf|lt/g) || []).length,
      /** Back */
      z: (path.match(/back|bk|behind/g) || []).length,
      /** Front */
      nz: (path.match(/front|ft|for/g) || []).length,
    };
    return keywords;
  });

  /**
   * Common algorithm to find the maximum keyword holder
   * for each axis and then assigning it to that axis.
   *
   * So the path that has highest keyword matches for x,
   * gets assigned to x.
   */
  const initMax = {
    x: 0,
    y: 0,
    z: 0,
    nx: 0,
    ny: 0,
    nz: 0,
  };

  substringMatches.forEach((matchData, index) => {
    Object.keys(initMax).forEach((key) => {
      if (
        matchData[key as keyof SkyboxPaths] > initMax[key as keyof SkyboxPaths]
      ) {
        initMax[key as keyof SkyboxPaths] = matchData[key as keyof SkyboxPaths];
        skyboxPaths[key as keyof SkyboxPaths] = paths[index];
      }
    });
  });

  /** If 'ft' also matches 'left' */
  if (skyboxPaths.nz === skyboxPaths.nx) {
    const values = Object.values(skyboxPaths);
    paths.forEach((path) => {
      if (!values.includes(path)) skyboxPaths.nz = path;
    });
  }

  return skyboxPaths;
};
