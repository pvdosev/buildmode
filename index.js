import { Renderer, Camera, Transform, Orbit, Program, Mesh, Sphere,
         GLTFLoader, BasisManager, Texture, Box, Raycast, Vec2, Vec3 } from './ogl/src/index.mjs';
import {SkyBox} from './skybox.js';
import {MessageBus} from './abstract.js';
import {EditMode} from './editmode.js';
import {Terrain} from './terrain.js';

function shallowClone(obj) {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}

function init() {
    const canvasElem = document.querySelector("#renderCanvas");
    const renderer = new Renderer({ dpr: 1, canvas: canvasElem });
    const gl = renderer.gl;
    const camera = new Camera(gl, { near: 0.1, far: 10000 });

    function resize() {
        renderer.setSize(canvasElem.parentNode.clientWidth, canvasElem.parentNode.clientHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const controls = new Orbit(camera, {element: canvasElem});
    camera.position
          .set(0, 0.5, -1)
          .normalize()
          .multiply(2.5)
          .add([5, 5, -5]);
    controls.target.copy([0, 2, 2]);
    controls.forcePosition();

    const assets = {items: {}, walls: {}};
    const scene = new Transform();
    const raycast = new Raycast(gl);
    loadAssets();

    const msgBus = new MessageBus();

    let view = new Vec3(0, 0, 0);
    const program = new Program(gl, {
        vertex: /* glsl */ `#version 300 es
            in vec3 position;
            in vec4 color;
            in vec3 normal;
            uniform vec3 view;
            //in vec2 uv;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            //out vec2 v_uv;
            out vec4 vColor;
            out vec3 vNormal;
            out vec3 vView;

            void main() {
                vView = normalize(view);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vColor = color;
                vNormal = normal;
                //v_uv = uv;
            }
        `,
        fragment: /* glsl */ `#version 300 es
            precision highp float;
            //in vec2 v_uv;
            in vec4 vColor;
            in vec3 vNormal;
            in vec3 vView;
            out vec4 outColor;
            //uniform sampler2D tBaseColor;
            void main() {
                vec3 light = vec3(0, 1, 0);
                vec3 normal = normalize(vNormal);
                float t = (dot(normal, light) + 1.0) / 2.0;
                vec3 r = 2.0 * dot(normal, light) * normal - light;
                float s = clamp(100.0 * dot(r, vView) - 97.0, 0.0, 1.0);

                vec3 cool = vec3(0.2, 0.2, 0.6) * t + t * vColor.xyz;
                vec3 warm = vec3(0.3, 0.3, 0.0) + 0.25 * vColor.xyz;
                vec3 highlight = vec3(1.0, 1.0, 1.0);
                vec3 shaded = vec3(1.0, 1.0, 1.0) * s + cool * (1.0 - s);
                //outColor = texture(tBaseColor, v_uv);
                outColor = vec4(shaded, 1.0);
            }
        `,
        uniforms: {view: view},
    });
    const context = {gl: gl, scene: scene, canvas: canvasElem, raycast: raycast,
                     renderer: renderer, camera: camera, assets: assets, msgBus: msgBus};
    const terrain = new Terrain(context);
    const editMode = new EditMode(context, terrain);

    async function loadAssets() {
        const gltf = await GLTFLoader.load(gl, `assets.glb`);
        console.log(gltf);
        const s = gltf.scene || gltf.scenes[0];
        s.forEach((root) => {
            root.traverse((node) => {
                if (node.geometry && node.extras.asset_id) {assets.items[node.extras.asset_id] = node}
                if (node.extras.wall_id) {assets.walls[node.extras.wall_id] = node}
                if (node.program) {
                    const material = node.program.gltfMaterial || {};
                    node.program = program;
                }
            });
        });

        const skybox = new SkyBox(gl);
        skybox.setParent(scene);
        msgBus.send("onAssetsLoaded");
    }

    requestAnimationFrame(update);
    function update() {
        requestAnimationFrame(update);
        controls.update();
        view.set(0, 0, 1);
        view.applyQuaternion(camera.quaternion);
        program.uniforms.view.value = view;
        renderer.render({ scene, camera, sort: false, frustumCull: false });
    }
}

init();
