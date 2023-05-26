import {Vec3, Raycast} from './ogl/src/index.mjs';

// Ahh making this in the first place is bad
// it's an ugly compromise with the graphics library
// move this there eventually?

export class RaycastHelper {
  constructor(renderer) {
    this.renderer = renderer;
    this.raycast = new Raycast(renderer.gl);
  }

  castMouseRay(e, camera) {
    // that long calculation there turns the canvas coordinates into clip space coords
    this.raycast.castMouse(
      camera,
      [2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0]
    );
  }
  intersectPlane(e, camera, plane) {
    this.castMouseRay(e, camera);
    return this.raycast.intersectPlane(plane);
  }
  intersectMeshes(e, camera, objList, options) {
    this.castMouseRay(e, camera);
    return this.raycast.intersectMeshes(objList, options);
  }
  intersectBounds(e, camera, cellList) {
    this.castMouseRay(e, camera);
    const hits = [];

    cellList.forEach((cell) => {
      cell.hitDistance = this.raycast.intersectBox(cell.bounds);
      if (!cell.hitDistance) return;
      hits.push(cell);
    });

    hits.sort((a, b) => a.hitDistance - b.hitDistance);
    return hits;
  }
}
