import * as THREE from "three";

export const viewportMenu = [
  {
    type: "text",
    text: "Add Primitive",
    sub: [
      {
        type: "text",
        text: "Cube",
        onClick: () => {
          const geometry = new THREE.BoxBufferGeometry(
            7 /** height */,
            7 /** width */,
            7 /** length */
          );
          const material = new THREE.MeshStandardMaterial({ color: 0x4073DC });
          const cube = new THREE.Mesh(geometry, material);
          window.scene.add(cube)
        },
      },
    ],
  },
];
