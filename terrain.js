import {Program, Transform, Mesh, Box, Plane, Vec2} from './ogl/src/index.mjs';

const GRID_X = 10;
const GRID_Y = 10;
const GRID_OFFSET_X = GRID_X / 2 - 0.5;
const GRID_OFFSET_Y = GRID_X / 2 - 0.5;
function calcOffset(x, y) {
  return y * GRID_X + x;
}
function calcGridToWorld(x, y, z) {
  return [x - GRID_OFFSET_X, y, z - GRID_OFFSET_Y];
}
function withinBounds(x, y) {
  if (x >= 0 && x < GRID_X && y >= 0 && y < GRID_Y) return true;
  else return false;
}

const NEIGHBORS = [[0, 1, 0], [0, -1, Math.PI], [1, 0, 0.5 * Math.PI], [-1, 0, 1.5 * Math.PI]];

export class Terrain {
  constructor({scene = scene, renderer = renderer, msgBus = msgBus}) {
    msgBus.register("onAssetsLoaded", (assets)=>{this.setupWalls(assets)});
    this.gl = renderer.gl;
    this.scene = scene;
    this.program = new Program(this.gl, {
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
    for (let y = 0; y < GRID_Y; y++) {
      for (let x = 0; x < GRID_X; x++) {
        const min = calcGridToWorld(x - 0.5, 0, y - 0.5);
        const max = calcGridToWorld(x + 0.5, 2, y + 0.5);
        this.grid.push({walls: [], filled: true, x: x, y: y, bounds: {
          min: {x: min[0], y: min[1], z: min[2]},
          max: {x: max[0], y: max[1], z: max[2]},
        }});
      }
    }
    this.origin.setParent(scene);
  }
  setupWalls(assets) {
    this.walls = assets.walls;
    for (let y = 0; y < GRID_Y; y++) {
      for (let x = 0; x < GRID_X; x++) {
        this.updateCell(x, y);
      }
    }
  }
  updateCellNeighbors (x, y) {
    this.updateCell(x, y);
    for (const direction of NEIGHBORS) {
      this.updateCell(x + direction[0], y + direction[1]);
    }
  }
  updateCell(x, y) {
    const cell = this.grid[calcOffset(x, y)];
    if (!withinBounds(x, y)) return;
    if (cell.walls.length > 0) {
      for (const wall of cell.walls) {
        wall.setParent(null);
      }
      cell.walls = [];
    }
    if (cell.filled) return;
    for (const direction of NEIGHBORS) {
      const neighbor = this.grid[calcOffset(x + direction[0], y + direction[1])];
      if (!withinBounds(x + direction[0], y + direction[1]) || neighbor?.filled) {
        const newWall = new Mesh(this.gl, {geometry: this.walls["1"].geometry, program: this.program});
        // divided by 2, because calcGridToWorld centers the coordinates in the grid cell
        // only 0.5 is needed to move the wall to its place
        newWall.position = calcGridToWorld(x + (direction[0] / 2), 0, y + (direction[1] / 2));
        newWall.rotation.y = direction[2];
        newWall.setParent(this.scene);
        cell.walls.push(newWall);
      }
    }
  }
}
