import {Program, Transform, Mesh, Box, Vec2} from './ogl/src/index.mjs';
export class Terrain {
    constructor(gl, scene, canvas, raycast, renderer, camera) {
      this.renderer = renderer;
      this.camera = camera;
      this.program = new Program(gl, {
        vertex: /* glsl */ `#version 300 es
            in vec3 position;
            in vec3 normal;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            out vec3 vNormal;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vNormal = normal;
            }
        `,
        fragment: /* glsl */ `#version 300 es
            precision highp float;
            in vec3 vNormal;
            out vec4 outColor;
            void main() {
                outColor = vec4(0.5, 0.0, 0.5, 1.0);
            }
            `,
        });
      this.grid = [];
      this.origin = new Transform();
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          this.grid.push(new Mesh(gl, {geometry: new Box(gl), program: this.program}));
          const offset = i * 10 + j;
          this.grid[offset].x = i;
          this.grid[offset].y = j;
          this.grid[offset].position = [4.5 - i, 0.5, 4.5 - j];
          this.grid[offset].setParent(this.origin);
        }
      }
      this.origin.setParent(scene);
      this.canvas = canvas;
      this.canvas.addEventListener('pointerdown', (e) => this.pointerDown(e));
      this.mouse = new Vec2();
      this.raycast = raycast;
    }
    pointerDown(e) {
        this.mouse.set(2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0);
        this.raycast.castMouse(this.camera, this.mouse);
        const intersections = this.raycast.intersectMeshes(this.grid);
        if (intersections[0]) {intersections[0].visible = false}
    };
}
