import { DoubleSide, MeshStandardMaterial } from "three";

/**
 * This page has everything to do with materials.
 * 
 */
/** ===================== */

export const defaultMaterial = new MeshStandardMaterial({
  color: 0x4073dc,
  side: DoubleSide,
});

/**
 * A list of all the materials
 */
export let materials = [defaultMaterial];
