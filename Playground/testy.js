/**
 * Created by Sven on 23.06.2016.
 */
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

//------------------------------------------
// Globals
//------------------------------------------
var stats, cameraRTT, camera, sceneRTT, scene, renderer;
var rtTexture, rtTexture2;
var simRes = 128;
var cUniforms, cUniforms2;
var initBuf;
var waterMat;

var renderTargetLinearFloatParams = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RenderTargetWrapping,
    wrapT: THREE.RenderTargetWrapping,
    format: THREE.RGBFormat,
    stencilBuffer: true,
    depthBuffer: true,
    type: THREE.FloatType
};


//------------------------------------------
// Main init and loop
//------------------------------------------
init();
animate();


//------------------------------------------
// Initialization
//------------------------------------------
function init() {
    setupRTTScene();

    setupMainScene();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x808080);
    renderer.autoClear = false;

    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.left = '0px';
    document.body.appendChild(stats.domElement);

    controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', render);
}


//------------------------------------------
// Setup the render-to-texture scene
//------------------------------------------
function setupRTTScene() {
    cameraRTT = new THREE.OrthographicCamera(simRes / -2, simRes / 2, simRes / 2, simRes / -2, -10000, 10000);

    sceneRTT = new THREE.Scene();

    initBuf = generateDataTexture(simRes, simRes, new THREE.Color(0x000000));
    rtTexture = new THREE.WebGLRenderTarget(simRes, simRes, renderTargetLinearFloatParams);
    rtTexture2 = new THREE.WebGLRenderTarget(simRes, simRes, renderTargetLinearFloatParams);

    var delta = 1.0 / simRes;
    cUniforms = {
        texture: {
            type: "t",
            value: initBuf
        },
        delta: {
            type: "v2",
            value: new THREE.Vector2(delta, delta)
        }
    };
    var screenMat = new THREE.ShaderMaterial({
        uniforms: cUniforms,
        vertexShader: document.getElementById('vs_rt').textContent,
        fragmentShader: document.getElementById('fs_rt').textContent
    });
    var screenGeo = new THREE.PlaneGeometry(simRes, simRes);
    screenQuad = new THREE.Mesh(screenGeo, screenMat);
    screenQuad.position.z = -100;
    sceneRTT.add(screenQuad);
}


//------------------------------------------
// Setup the main scene
//------------------------------------------
function setupMainScene() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;

    scene = new THREE.Scene();

    cUniforms2 = {
        texture: {
            type: "t",
            value: rtTexture
        },
        delta: {
            type: "v2",
            value: new THREE.Vector2(1.0 / simRes, 1.0 / simRes)
        }
    };
    waterMat = new THREE.ShaderMaterial({
        uniforms: cUniforms2,
        vertexShader: document.getElementById('vs_rt').textContent,
        fragmentShader: document.getElementById('fs_setColor').textContent,
        wireframe: true
    });
    var waterGeo = new THREE.PlaneGeometry(512, 512, simRes - 1, simRes - 1);
    water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = THREE.Math.degToRad(-45);
    scene.add(water);


    // add a basic directional light
    var lt = new THREE.DirectionalLight(0xffffff);
    lt.position.set(300, 400, 0);
    lt.target.position.set(0, 0, 0);
    scene.add(lt);

}


//------------------------------------------
// Custom RGBA data texture. Debugging by setting
// center point to red.
//------------------------------------------
function generateDataTexture(width, height, color) {
    var size = width * height;
    var data = new Uint8Array(4 * size);

    for (var i = 0; i < size; i++) {
        if (i == size / 2 + width / 2) {
            data[i * 4] = 255;
        } else {
            data[i * 4] = 0;
        }
        data[i * 4 + 1] = 0;
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 255;
    }

    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;

    return texture;
}


//------------------------------------------
// Main loop
//------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    render();

    stats.update();
    controls.update();
}


//------------------------------------------
// Main rendering
//------------------------------------------
function render() {
    renderer.clear();

    stepSim();
    stepSim();

    renderer.render(scene, camera);
}


//------------------------------------------
// A single simulation step
//------------------------------------------
function stepSim() {
    renderer.render(sceneRTT, cameraRTT, rtTexture, true);

    // swap buffers
    var a = rtTexture2;
    rtTexture2 = rtTexture;
    rtTexture = a;
    cUniforms.texture.value = rtTexture2;
}