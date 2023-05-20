import { Vec2, Vec3, Mesh, GridHelper } from './ogl/src/index.mjs';
import {makeButtonInList} from './ui.js';

const STATE = {EDIT: 0, GRAB: 1, TERRAIN_EDIT: 2, DISABLED: -1}
const PLANE = {origin: new Vec3(0, 0, 0), normal: new Vec3(0, 1, 0)}

export class EditMode {
  constructor({msgBus = msgBus,
               assets = assets,
               raycast = raycast,
               scene = scene,
               camera = camera,
               renderer = renderer},
              terrain) {
    this.state = STATE.EDIT;
    this.heldObject = null;
    this.gl = renderer.gl;
    this.canvas = this.gl.canvas;
    this.msgBus = msgBus;
    this.assets = assets.items;
    this.raycast = raycast;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.terrain = terrain;
    this.mouse = new Vec2();
    this.objectList = [];
    this.msgBus.register("onAssetsLoaded", () => {this.setupAssets()});
    this.gridHelper = new GridHelper(this.gl);
    this.gridHelper.setParent(this.scene);
    this.registerCallbacks();
  }
  setupAssets() {
    for (const assetId in this.assets) {
      makeButtonInList(this.assets[assetId].name, "buttonList", (event) => {
        if (this.heldObject) this.heldObject = undefined;
        this.heldObject = new Mesh(this.gl, this.assets[assetId]);
        this.state = STATE.GRAB;
        this.heldObject.position[2] = -1000;
        this.heldObject.setParent(this.scene);
      });
    }
    makeButtonInList("Clear", "buttonList", () => {
      if (this.heldObject) {
        this.heldObject.setParent(null);
        this.heldObject = undefined;
        this.state = STATE.EDIT;
      }
    });
  }

  pointerDown(e) {
    this.mouse.set(2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0);
    this.raycast.castMouse(this.camera, this.mouse);
    switch ( this.state ) {
      case STATE.GRAB:
        // calculates clipspace coords of pointer
        const intersection = this.raycast.intersectPlane(PLANE);
        if (intersection) {
          console.log(intersection);
          this.heldObject.position = intersection.clone();
        }
        this.state = STATE.EDIT;
        this.objectList.push(this.heldObject);
        this.heldObject = undefined;
        break;
      case STATE.EDIT:
        const hits = this.raycast.intersectMeshes(this.objectList, {includeUV: false, includeNormal: false});
        if (hits.length) {
          this.heldObject = hits[0];
          console.log(this.heldObject);
          const objIndex = this.objectList.find((obj) => obj.id == hits[0].id);
          if (objIndex > -1) {this.objectList.splice(objIndex, 1)}
          this.state = STATE.GRAB;
        }
    }
  }
  pointerMove(e) {
    if ( this.state == STATE.GRAB ) {
      this.mouse.set(2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0);
      this.raycast.castMouse(this.camera, this.mouse);
      const intersection = this.raycast.intersectPlane(PLANE);
      if (intersection) {
        this.heldObject.position = intersection.clone();
      }
    }
  }
  registerCallbacks() {
    this.canvas.addEventListener('pointerdown', (e) => this.pointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.pointerMove(e));
  }

  unregisterCallbacks() {

  }
}
