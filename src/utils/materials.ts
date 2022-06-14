import { DoubleSide, MeshStandardMaterial } from "three";

export const defaultMaterial = new MeshStandardMaterial({
  color: 0x4073dc,
  side: DoubleSide,
});

export let materials = [defaultMaterial];
