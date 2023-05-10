import { Vec2, Vec3, Mesh } from './ogl/src/index.mjs';
import {makeButtonInList} from './ui.js';

const STATE = {EDIT: 0, BUILD: 1, DISABLED: 2}
const PLANE = {origin: new Vec3(0, 0, 0), normal: new Vec3(0, 1, 0)}

export class EditMode {
  constructor({gl = gl,
               msgBus = msgBus,
               canvas = canvas,
               assets = assets,
               raycast = raycast,
               scene = scene,
               camera = camera,
               renderer = renderer}) {
    this.state = STATE.EDIT;
    this.heldObject = null;
    this.gl = gl;
    this.canvas = canvas;
    this.msgBus = msgBus;
    this.assets = assets;
    this.raycast = raycast;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.mouse = new Vec2();
    this.msgBus.register("onAssetsLoaded", () => {this.setupAssets()});
    this.registerCallbacks();
  }
  setupAssets() {
    for (const assetId in this.assets) {
      makeButtonInList(this.assets[assetId].name, "buttonList", (event) => {
        this.heldObject = assetId;
      });
    }
    makeButtonInList("Clear", "buttonList", () => {
      this.heldObject = null;
    });
  }

  pointerDown(e) {
    console.log(this);
    if ( this.heldObject ) {
      // calculates clipspace coords of pointer
      this.mouse.set(2.0 * (e.x / this.renderer.width) - 1.0, 2.0 * (1.0 - e.y / this.renderer.height) - 1.0);
      this.raycast.castMouse(this.camera, this.mouse);
      const intersection = this.raycast.intersectPlane(PLANE);
      if (intersection) {
        const newBarrel = new Mesh(this.gl, this.assets[this.heldObject]);
        newBarrel.setParent(this.scene);
        newBarrel.position = intersection.clone();
      }
    }
  }
  registerCallbacks() {
    this.canvas.addEventListener('pointerdown', (e) => this.pointerDown(e));
  }

  unregisterCallbacks() {

  }
}
