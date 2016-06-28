/**
 * Created by Sven on 23.06.2016.
 */
/// <reference path="../three.d.ts"/>

var simWidth = 10, simHeight = 1;
var dawdlingFactor = 0.4, density = 0.4, maxSpeed = 3;

function createRenderer():THREE.WebGLRenderer {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 300);
    renderer.setClearColor(0x808080);
    return renderer;
}

function createScene():THREE.Scene {
    return new THREE.Scene();
}

function createWebGLRenderTarget(width:number, height:number):THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });
}


function createDataTexture(width:number, height:number):THREE.DataTexture {
    var size = width * height * 4;
    var data = new Uint8Array(size);
    for (var i = 0; i < size;) {
        // if (i >= (size - width * 4)) {
        //     data[i++] = 0;
        //     data[i++] = 200;
        //     data[i++] = 0;
        //     data[i++] = 255;
        // } else {
        //     data[i++] = 0;
        //     data[i++] = 200;
        //     data[i++] = 0;
        //     data[i++] = 255;
        // }
        data[i++] = 0;
        data[i++] = 0;
        data[i++] = 255;
        data[i++] = 255;
    }
    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
}

function createShaderMaterial(uniforms:any, vertexShader:string, fragmentShader:string):THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
}

function createOrthographicCamera():THREE.OrthographicCamera {
    return new THREE.OrthographicCamera(simWidth / -2, simWidth / 2, simHeight / 2, simHeight / -2, -10000, 10000);
}

var bufferScene:THREE.Scene;
var textureA:THREE.WebGLRenderTarget, textureB:THREE.WebGLRenderTarget;
var bufferMaterial:THREE.ShaderMaterial;
var simulationPlane:THREE.Mesh;
var cameraRTT:THREE.OrthographicCamera;
function setUpRTTScene() {
    bufferScene = createScene();

    cameraRTT = createOrthographicCamera();

    var simulationGeometry = new THREE.PlaneBufferGeometry(simWidth, simHeight);

    textureA = createWebGLRenderTarget(simWidth, simHeight);
    textureB = createWebGLRenderTarget(simWidth, simHeight);

    bufferMaterial = createShaderMaterial({
            texture: {type: 't', value: createDataTexture(simWidth, simHeight)},
            time: {type: 'f', value: 0.0},
            delta: {
                type: "v2",
                value: new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight)
            },
            textureRes: {type: 'v2', value: new THREE.Vector2(simWidth, simHeight)},
            maxSpeed: {type: 'i', value: maxSpeed}
        },
        document.getElementById('vertex').textContent,
        document.getElementById('fragment').textContent
    );

    simulationPlane = new THREE.Mesh(simulationGeometry, bufferMaterial);
    bufferScene.add(simulationPlane);
}

var mainScene:THREE.Scene;
var mainCamera:THREE.PerspectiveCamera;
var fluidMaterial:THREE.ShaderMaterial;
var fluidPlane:THREE.Mesh;
function setUpMainScene() {
    mainScene = createScene();

    mainCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    mainCamera.position.z = 250;
    // mainCamera.position.x = 200;
    // mainCamera.rotateY(45);
    fluidMaterial = createShaderMaterial({
            texture: {type: 't', value: textureA},
            time: {type: 'f', value: 0.0},
            delta: {
                type: "v2",
                value: new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight)
            },
            textureRes: {type: 'v2', value: new THREE.Vector2(simWidth, simHeight)},
            density: {type:'f', value: density},
            speed0 : {type: 'v4', value: new THREE.Vector4(0.0, 200./255., 0.0, 1.0)},
            speed1 : {type: 'v4', value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0)},
            speed2 : {type: 'v4', value: new THREE.Vector4(200./255., 1.0, 0.0, 1.0)},
            speed3 : {type: 'v4', value: new THREE.Vector4(1.0, 1.0, 0.0, 1.0)},
            speed4 : {type: 'v4', value: new THREE.Vector4(1.0, 200./255., 0.0, 1.0)},
            speed5 : {type: 'v4', value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0)},
            maxSpeed: {type: 'i', value: maxSpeed}
        },
        document.getElementById('vertex').textContent,
        document.getElementById('fragment').textContent
    );

    // fluidMaterial.wireframe = true;
    fluidMaterial.needsUpdate = true;
    var fluidGeometry = new THREE.PlaneBufferGeometry(500, 50, simWidth, simHeight);
    fluidPlane = new THREE.Mesh(fluidGeometry, fluidMaterial);

    mainScene.add(fluidPlane);
}


function createTrafficData():Uint8Array {
    var size = simWidth * simHeight * 4;
    var data = new Float32Array(size);
    for (var i = 0; i < size;) {
        if (i < simWidth * density * 4) {
            data[i++] = 0.0;
            data[i++] = 200./255.;
            data[i++] = 0.0;
            data[i++] = 1.0;
        } else {
            data[i++] = 0.0;
            data[i++] = 0.0;
            data[i++] = 1.0;
            data[i++] = 1.0;
        }
    }
    return data;
}

function createTrafficDataTexture(data:any, width:number, height:number):THREE.DataTexture {
    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
}

function setUpTrafficRTTScene() {
    bufferScene = createScene();

    cameraRTT = createOrthographicCamera();

    var simulationGeometry = new THREE.PlaneBufferGeometry(simWidth, simHeight);

    textureA = createWebGLRenderTarget(simWidth, simHeight);
    textureB = createWebGLRenderTarget(simWidth, simHeight);

    bufferMaterial = createShaderMaterial({
            texture: {type: 't', value: createTrafficDataTexture(createTrafficData(),simWidth, simHeight)},
            time: {type: 'f', value: 0.0},
            delta: {
                type: "v2",
                value: new THREE.Vector2(1.0 / simWidth, 1.0 / simHeight)
            },
            textureRes: {type: 'v2', value: new THREE.Vector2(simWidth, simHeight)},
            density: {type:'f', value: density},
            speed0 : {type: 'v4', value: new THREE.Vector4(0.0, 200./255., 0.0, 1.0)},
            speed1 : {type: 'v4', value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0)},
            speed2 : {type: 'v4', value: new THREE.Vector4(200./255., 1.0, 0.0, 1.0)},
            speed3 : {type: 'v4', value: new THREE.Vector4(1.0, 1.0, 0.0, 1.0)},
            speed4 : {type: 'v4', value: new THREE.Vector4(1.0, 200./255., 0.0, 1.0)},
            speed5 : {type: 'v4', value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0)}
        },
        document.getElementById('vertex').textContent,
        document.getElementById('fragment').textContent
    );

    simulationPlane = new THREE.Mesh(simulationGeometry, bufferMaterial);
    bufferScene.add(simulationPlane);
}

window.onload = function () {
    var renderer = createRenderer();
    document.body.appendChild(renderer.domElement);

    // setUpRTTScene();
    setUpTrafficRTTScene();
    setUpMainScene();

    var render = function () {
        //requestAnimationFrame(render);

        renderer.render(bufferScene, cameraRTT, textureA, true);

        //swap
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





