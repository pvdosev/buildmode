import {Program, Transform, Mesh, Box, Plane, Vec2} from './ogl/src/index.mjs';

function calcOffset(x, y) {
  return y * 10 + x;
}
function calcGridToWorld(x, y, z) {
  return [x - 4.5, y, z - 4.5];
}

export class Terrain {
  constructor({gl = gl, scene = scene, canvas = canvas, raycast = raycast,
               renderer = renderer, camera = camera, assets = assets, msgBus = msgBus}) {
    msgBus.register("onAssetsLoaded", ()=>{this.setupWalls()});
    this.walls = assets.walls;
    this.renderer = renderer;
    this.camera = camera;
    this.gl = gl;
    this.scene = scene;
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
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        this.grid.push({walls: [], filled: true, bounds: {
          min: calcGridToWorld(x - 0.5, 0, y - 0.5),
          max: calcGridToWorld(x + 0.5, 2, y + 0.5),
        }});
      }
    }
    this.grid[37].filled = false;
    this.grid[93].filled = false;
    this.grid[0].filled = false;
    this.grid[1].filled = false;
    this.grid[2].filled = false;
    this.grid[11].filled = false;
    this.grid[12].filled = false;
    this.origin.setParent(scene);
    this.canvas = canvas;
    //this.canvas.addEventListener('pointerdown', (e) => this.pointerDown(e));
    this.mouse = new Vec2();
    this.raycast = raycast;
  }
  pointerDown(e) {
    this.mouse.set(2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0);
    this.raycast.castMouse(this.camera, this.mouse);
    const intersections = this.raycast.intersectMeshes(this.grid);
    if (intersections[0]) {intersections[0].visible = false}
  }
  setupWalls() {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        this.updateCell(x, y);
      }
    }
  }
  updateCell(x, y) {
    const cell = this.grid[calcOffset(x, y)];
    if (cell.walls.length > 0) {
      for (const wall of cell.walls) {
        wall.setParent(null);
      }
      cell.walls = [];
    }
    if (cell.filled) return;
    //const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    // for (const direction of neighbors) {
    //   const neighbor = this.grid[calcOffset(x + direction[0], y + direction[1])];
    //   if (neighbor.filled) {
    //     const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
    //     newWall.position = [x, 0, y];
    //     newWall.setParent(this.scene);
    //   }
    // }
    let offset = calcOffset(x, y + 1);
    if (this.grid[offset] == undefined || this.grid[offset]?.filled) {
      const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
      //newWall.position = [x - 4.5, 0, y - 4];
      newWall.position = calcGridToWorld(x, 0, y + 0.5);
      newWall.rotation.y = 0;
      newWall.setParent(this.scene);
    }
    offset = calcOffset(x, y - 1);
    if (this.grid[offset] == undefined || this.grid[offset]?.filled) {
      const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
      newWall.position = calcGridToWorld(x, 0, y - 0.5);
      newWall.rotation.y = Math.PI;
      newWall.setParent(this.scene);
    }
    offset = calcOffset(x + 1, y);
    if (this.grid[offset] == undefined || this.grid[offset]?.filled) {
      const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
      newWall.position = calcGridToWorld(x + 0.5, 0, y);
      newWall.rotation.y = 0.5 * Math.PI;
      newWall.setParent(this.scene);
    }
    offset = calcOffset(x - 1, y);
    if (this.grid[offset] == undefined || this.grid[offset]?.filled) {
      const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
      newWall.position = calcGridToWorld(x - 0.5, 0, y);
      newWall.rotation.y = 1.5 * Math.PI;
      newWall.setParent(this.scene);
    }
  }
}
