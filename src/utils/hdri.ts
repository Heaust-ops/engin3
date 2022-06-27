/**
 * This file contains everything related to skyboxes
 * and HDRI lighting
 */

import { getCharacterFrequency } from "./utils";

interface SkyboxPaths {
  x: string;
  y: string;
  z: string;
  nx: string;
  ny: string;
  nz: string;
}

/**
 * Automatically assign and get the side of the env cube,
 * from the filename using identifiers to label them.
 * 
 * This works for common naming conventions.
 * 
 * @param paths A list of 6 image paths
 * @returns An Object with the env cube side mapped to the respective path
 */
const getProperSkyboxPaths = (
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
    x: Math.max(...frequencies.map((o) => o.x)),
    y: Math.max(...frequencies.map((o) => o.y)),
    z: Math.max(...frequencies.map((o) => o.z)),
    negativeIdentifer: null as string | null,
    negativeIdentifers: {
      n: Math.max(...frequencies.map((o) => o.n)),
      "-": Math.max(...frequencies.map((o) => o["-"])),
      m: Math.max(...frequencies.map((o) => o.m)),
      o: Math.max(...frequencies.map((o) => o.m)),
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
  if (!highest.negativeIdentifer) return null;

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

  return skyboxPaths;
};

export {};
