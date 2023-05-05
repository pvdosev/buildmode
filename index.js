import { Renderer, Camera, Transform, Orbit, Program, Mesh,
         GLTFLoader, BasisManager, Texture, Box, Raycast, Vec2, Vec3 } from './ogl/src/index.mjs';
import {SkyBox} from './skybox.js';

function shallowClone(obj) {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}

function init() {
    const canvasElem = document.querySelector("#renderCanvas");
    const renderer = new Renderer({ dpr: 1, canvas: canvasElem });
    const gl = renderer.gl;
    console.log(canvasElem);

    const program = new Program(gl, {
        vertex: /* glsl */ `#version 300 es
            in vec3 position;
            in vec4 color;
            //in vec2 uv;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            //out vec2 v_uv;
            out vec4 vColor;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vColor = color;
                //v_uv = uv;
            }
        `,
        fragment: /* glsl */ `#version 300 es
            precision highp float;
            //in vec2 v_uv;
            in vec4 vColor;
            out vec4 outColor;
            //uniform sampler2D tBaseColor;
            void main() {
                //outColor = texture(tBaseColor, v_uv);
                outColor = vColor;
            }
        `,
        //uniforms: {tBaseColor:
        //           {value: material.baseColorTexture ? material.baseColorTexture.texture : emptyTex}
        //          },
    });
    const emptyTex = new Texture(gl);
    const camera = new Camera(gl, { near: 0.1, far: 10000 });

    function resize() {
        //renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setSize(canvasElem.parentNode.clientWidth, canvasElem.parentNode.clientHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const controls = new Orbit(camera);

    const objects = {};
    const assets = [];

    camera.position
          .set(0, 0.5, -1)
          .normalize()
          .multiply(2.5)
          .add([5, 5, -5]);
    controls.target.copy([0, 2, 2]);
    controls.forcePosition();

    const scene = new Transform();

    const mouse = new Vec2();
    const raycast = new Raycast(gl);
    const plane = {origin: new Vec3(0, 0, 0),
                   normal: new Vec3(0, 1, 0)};
    document.addEventListener('pointerdown', down, false);
    function down(e) {
        // calculates clipspace coords of pointer
        mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);
        raycast.castMouse(camera, mouse);
        const intersection = raycast.intersectPlane(plane);
        const newBarrel = new Mesh(gl, assets[Math.floor(Math.random() * assets.length)]);
        //newBarrel.program = shallowClone(program);
        newBarrel.setParent(scene);
        newBarrel.position = intersection.clone();

    }

    loadAssets();
    async function loadAssets() {
        // GLTFLoader.setBasisManager(new BasisManager(`ogl/examples/assets/libs/basis/BasisWorker.js`));
        const gltf = await GLTFLoader.load(gl, `assets.glb`);
        console.log(gltf);
        const s = gltf.scene || gltf.scenes[0];
        s.forEach((root) => {
            root.traverse((node) => {
                if (node.geometry && node.extras.asset_id) {assets.push(node)}
                if (node.program) {
                    const material = node.program.gltfMaterial || {};
                    node.program = program;
                    // node.program.uniforms =
                    //  {tBaseColor: {value: material.baseColorTexture ? material.baseColorTexture.texture : emptyTex}};
                }
            });
        });

        function loadImage(src) {
            return new Promise((res) => {
                const img = new Image();
                img.onload = () => res(img);
                img.src = src;
            });
        }

        const images = await Promise.all([
            loadImage('skybox/posx.jpg'),
            loadImage('skybox/negx.jpg'),
            loadImage('skybox/posy.jpg'),
            loadImage('skybox/negy.jpg'),
            loadImage('skybox/posz.jpg'),
            loadImage('skybox/negz.jpg'),
        ]);

        const skybox = new SkyBox(gl, images);
        skybox.setParent(scene);
    }

    requestAnimationFrame(update);
    function update() {
        requestAnimationFrame(update);
        controls.update();
        renderer.render({ scene, camera, sort: false, frustumCull: false });
    }
}

init();
