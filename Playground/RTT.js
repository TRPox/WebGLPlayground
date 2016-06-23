/**
 * Created by Sven on 23.06.2016.
 */
/// <reference path="../three.d.ts"/>
var simWidth = 64, simHeight = 32;
function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 300);
    renderer.setClearColor(0x808080);
    return renderer;
}
function createScene() {
    return new THREE.Scene();
}
function createWebGLRenderTarget(width, height) {
    return new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });
}
function createDataTexture(width, height) {
    var size = width * height * 4;
    var data = new Uint8Array(size);
    for (var i = 0; i < size;) {
        if (i >= (size - width * 4)) {
            data[i++] = 255;
            data[i++] = 0;
            data[i++] = 0;
            data[i++] = 255;
        }
        else {
            data[i++] = 255;
            data[i++] = 0;
            data[i++] = 0;
            data[i++] = 255;
        }
    }
    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
}
function createShaderMaterial(uniforms, vertexShader, fragmentShader) {
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
}
function createOrthographicCamera() {
    return new THREE.OrthographicCamera(simWidth / -2, simWidth / 2, simHeight / 2, simHeight / -2, -10000, 10000);
}
var bufferScene;
var textureA, textureB;
var bufferMaterial;
var simulationPlane;
var cameraRTT;
function setUpRTTScene() {
    bufferScene = createScene();
    cameraRTT = createOrthographicCamera();
    var simulationGeometry = new THREE.PlaneBufferGeometry(simWidth, simHeight);
    textureA = createWebGLRenderTarget(simWidth, simHeight);
    textureB = createWebGLRenderTarget(simWidth, simHeight);
    bufferMaterial = createShaderMaterial({
        texture: { type: 't', value: createDataTexture(simWidth, simHeight) },
        time: { type: 'f', value: 0.0 },
        delta: {
            type: "v2",
            value: new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight)
        }
    }, document.getElementById('vertex').textContent, document.getElementById('fragment').textContent);
    simulationPlane = new THREE.Mesh(simulationGeometry, bufferMaterial);
    bufferScene.add(simulationPlane);
}
var mainScene;
var mainCamera;
var fluidMaterial;
var fluidPlane;
function setUpMainScene() {
    mainScene = createScene();
    mainCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    mainCamera.position.z = 250;
    fluidMaterial = createShaderMaterial({
        texture: { type: 't', value: textureA },
        time: { type: 'f', value: 0.0 },
        delta: {
            type: "v2",
            value: new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight)
        }
    }, document.getElementById('vertex').textContent, document.getElementById('fragment').textContent);
    // fluidMaterial.wireframe = true;
    fluidMaterial.needsUpdate = true;
    var fluidGeometry = new THREE.PlaneBufferGeometry(500, 250, simWidth, simHeight);
    fluidPlane = new THREE.Mesh(fluidGeometry, fluidMaterial);
    mainScene.add(fluidPlane);
}
window.onload = function () {
    var renderer = createRenderer();
    document.body.appendChild(renderer.domElement);
    setUpRTTScene();
    setUpMainScene();
    var render = function () {
        requestAnimationFrame(render);
        renderer.render(bufferScene, cameraRTT, textureA, true);
        // //swap
        var temp = textureB;
        textureB = textureA;
        textureA = temp;
        bufferMaterial.uniforms.time.value += 0.001;
        fluidMaterial.uniforms.time.value += 0.001;
        bufferMaterial.uniforms.texture.value = textureB;
        renderer.render(mainScene, mainCamera);
    };
    render();
};
//# sourceMappingURL=RTT.js.map