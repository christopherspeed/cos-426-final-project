/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 * It loads all of the meshes and collision bodies.
 */

import { WebGLRenderer, PerspectiveCamera, Vector3, SphereGeometry, MeshNormalMaterial, Mesh, BoxGeometry, TextureLoader, sRGBEncoding, PlaneGeometry, MeshLambertMaterial, Group, Scene, BufferGeometry, MeshBasicMaterial, Color, ConvexGeometry, DoubleSide, FogExp2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { MakeAudio } from './components/audio';
import { InputControl } from './components/input';

import { FrustumCulling, GameScene } from './components/scenes';
import { World, Vec3, Body, Sphere, Plane, Box, Material, Cylinder, Ray, Trimesh, Quaternion, ConvexPolyhedron } from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Road from './components/objects/Road/Road';


// Initialize core ThreeJS components
// const scene = new SeedScene();
const scene = new GameScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

const frustCull = new FrustumCulling(scene, camera);
const sound = new MakeAudio(camera);

// Set up camera
camera.position.set(0, 30, -100);
camera.lookAt(new Vector3(0, 0, 0));


// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// scene.fog = new FogExp2(new Color(0x1b2e4d), .02);

/*
// NOT PROPERLY IMPLEMENTED YET, NEEDS TO BE UNCOMMENTED/TWEAKED.
// UNCOMMENT LINES 230-231 WHEN WORKING
// SMOKE TEXTURE
// adapted from: https://www.youtube.com/watch?v=otavCmIuEhY

const smokeTextureLocation = require("./components/textures/Smoke15Frames.png").default;
const smokeTexture = new TextureLoader().load(smokeTextureLocation);
smokeTexture.encoding = sRGBEncoding; // default is linear
const smokeGeometry = new PlaneGeometry(100, 100);

// LambertMaterial for nonshiny surfaces
const smokeMaterial = new MeshLambertMaterial( {
    color: 0x0000ff, // white for debugging
    map: smokeTexture,
    emissive: 0x222222,
    opacity: .9,
    transparent: true
});

const smoke = new Group();

for (let i = 0; i < 20; i++) {
    // can tweak i for more or less layers
    let smokeElement = new Mesh(smokeGeometry, smokeMaterial);
    smokeElement.scale.set(2,2,2);

    // position textures at random xy positions
    smokeElement.position.set(Math.random() * 200 - 50, Math.random() * 200 - 50, -20);
    // probably have to adjust z

    // set smoke texture rotations to random amounts on z axis
    smokeElement.rotateOnAxis.z = Math.random * 360;
    smoke.add(smokeElement);

    console.log(smokeElement.visible);

}
scene.add(smoke);
*/

// Set up controls
// ????
// const controls = new FirstPersonControls( camera, canvas );
// controls.movementSpeed = 150;
// controls.lookSpeed = 0.01;

// Ew Orbit controls trash
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 1000;
controls.update();

// physics
const world = new World(
    {
        gravity: new Vec3(0, -9.82 * 1.5, 0),
    }
)

const boxBody = new Body({
    shape: new Sphere(1),
    mass: 100,
    linearDamping: 0.8,
    angularDamping: 0.8,
    material: new Material({
        friction: 0.5
    }),
    fixedRotation: true
})
boxBody.position.set(-20, 120, 0)

const inputControl = new InputControl(camera, scene, boxBody, sound);

const material = new MeshNormalMaterial()
const box_geo = new BoxGeometry(1, 1, 2);
const boxMesh = new Mesh(box_geo, material);
scene.add(boxMesh)

world.addBody(boxBody)
// testing the trigger
// const triggerBody = new Body({
//     isTrigger: true,
//     type: Body.STATIC,
//     position: new Vec3(0, 1.5, -10),
//     shape: new Box(new Vec3(4, 1, 2),)
// })

// function printTrigger(event) {
//     console.log(event)
//     console.log(triggerBody.world)
//     bodiesToRemove.push(triggerBody)
//     triggerBody.removeEventListener("collide", printTrigger)
// }
// triggerBody.addEventListener("collide", printTrigger)
// const bodiesToRemove = []

const testMat = new MeshBasicMaterial({
    color: new Color(0x82898c),
    side: DoubleSide
})
const mountainMat = new MeshBasicMaterial({
    color: new Color(0x00898c),
    side: DoubleSide
})
// load in the road models from the scene file list
const models = scene.models;

const loader = new GLTFLoader()
loadRoads(models)

function loadRoads(roadModelsToLoad){
    for (let i = 0; i < roadModelsToLoad.length; i++) {
        loader.load(roadModelsToLoad[i], (gltf) => {
            let mat;
            if (i == 1){
                mat = mountainMat;
            } else mat = testMat;
            const road = new Road(gltf, mat);
            world.addBody(road.body);
            scene.add(road.mesh);
            if (i == 1) road.translate(0, 0, -10)
            scene.roads.push(road);
        })
    }
}

const cannonDebugger = new CannonDebugger(scene, world);
const onAnimationFrameHandler = (timeStamp) => {

    controls.update();
    inputControl.update();
    sound.update();
    world.fixedStep();

    cannonDebugger.update();

    // smoke.rotation.z += 1; UNCOMMENT WHEN WE GET SMOKE WORKING
    // smoke.position.z += 1;
    
    // if (bodiesToRemove.length > 0) {
    //     world.removeBody(bodiesToRemove[0])
    // }
    // move all physics things and move their three visualizations along with them
    boxMesh.position.copy(boxBody.position)
    boxMesh.quaternion.copy(boxBody.quaternion)
    frustCull.update();
    renderer.render(scene, camera);
    scene.update && scene.update(boxBody.position);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);
