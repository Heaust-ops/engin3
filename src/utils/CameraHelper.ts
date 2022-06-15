import {
  CircleBufferGeometry,
  Color,
  ConeBufferGeometry,
  DoubleSide,
  Group,
  Mesh,
} from "three";
import { MeshBasicMaterial } from "three";

interface Colors {
  cone: THREE.Color | null;
  triangle: THREE.Color | null;
  frustum: THREE.Color | null;
}
class CameraHelper extends Group {
  camera: THREE.Camera;
  colors: Colors;

  constructor(
    camera: THREE.Camera,
    size: number = 1,
    colors: {
      cone: THREE.Color | number | null;
      triangle: THREE.Color | number | null;
      frustum: THREE.Color | number | null;
    } = {
      cone: 0xFF6C37,
      triangle: 0x16949A,
      frustum: 0xFF6C37,
    }
  ) {
    const coneGeo = new ConeBufferGeometry(
      ((camera as THREE.PerspectiveCamera).near * size * 2) / 3,
      (camera as THREE.PerspectiveCamera).near * size,
      4,
      1,
      true
    );
    const material = new MeshBasicMaterial({
      wireframe: true,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });

    coneGeo.rotateY(Math.PI / 4);
    coneGeo.rotateX(Math.PI / 2);

    const triangleGeo = new CircleBufferGeometry(
      (size * (camera as THREE.PerspectiveCamera).near) / 4,
      0
    );

    triangleGeo.rotateZ((7 * Math.PI) / 6);
    triangleGeo.translate(
      0,
      ((camera as THREE.PerspectiveCamera).near * size * 2) / 3,
      -((camera as THREE.PerspectiveCamera).near * size) / 2
    );

    const cone = new Mesh(coneGeo, material);
    const triangle = new Mesh(triangleGeo, material.clone());

    super();
    cone.name = "cone";
    triangle.name = "triangle";
    this.add(cone);
    this.add(triangle);

    this.camera = camera;
    this.camera.updateMatrixWorld();

    /**
     * Convert numbers to Three Colors
     */
    if (typeof colors.cone === "number") colors.cone = new Color(colors.cone);

    if (typeof colors.triangle === "number")
      colors.triangle = new Color(colors.triangle);

    if (typeof colors.frustum === "number")
      colors.frustum = new Color(colors.frustum);

    this.colors = colors as {
      cone: THREE.Color | null;
      triangle: THREE.Color | null;
      frustum: THREE.Color | null;
    };

    (this as THREE.Object3D).type = "CameraHelper";
    this.matrix = this.camera.matrixWorld;
    this.matrixAutoUpdate = false;

    this.update();
  }

  dispose() {
    this.children.forEach((c) => {
      (c as THREE.Mesh).geometry.dispose();
      ((c as THREE.Mesh).material as THREE.Material).dispose();
    });
  }

  update() {
    if (!this.camera) this.dispose();

    this.children.forEach((c) => {
      if (this.colors[c.name as keyof Colors])
        ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(
          this.colors[c.name as keyof Colors]!
        );
    });
  }
}

export { CameraHelper };
