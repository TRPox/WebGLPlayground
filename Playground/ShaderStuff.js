/**
 * Created by marcus on 07/06/16.
 **/
/// <reference path="../three.d.ts"/>
var geo;
var length = 1;
var width = 1;
function createGeometry() {
    geo = new THREE.PlaneBufferGeometry(1000, 600, width, length);
    // geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    // var color = new THREE.Color(0x7FA7B5);
    //
    // var colors = new Float32Array(6*3);
    // for(var i = 0; i < 18; i += 3)  {
    //     colors[i+0] = 0.0;
    //     colors[i+1] = 1.0;
    //     colors[i+2] = 0.0;
    //     }
    // console.log(colors[0]);
    // geo.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    return geo;
}
function createData() {
    var size = width * length;
    var data = new Uint8Array(size * 4);
    for (var i = 4; i < size * 4;) {
        data[i++] = 255;
        data[i++] = 0;
        data[i++] = 0;
        data[i++] = 255;
    }
    return data;
}
function createDataTexture(data, width, height) {
    var dataTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    dataTexture.needsUpdate = true;
    return dataTexture;
}
function createRenderTarget() {
    return new THREE.WebGLRenderTarget(width, length, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    });
}
function createShaderMaterial(texture) {
    var shader = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0, type: 'f' },
            color: { type: 'c', value: new THREE.Color(0xffffff) },
            texture: { type: 't', value: texture }
        },
        vertexShader: document.getElementById('vertex').textContent,
        fragmentShader: document.getElementById('fragment').textContent
    });
    shader.needsUpdate = true;
    return shader;
}
function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 300);
    return renderer;
}
window.onload = function () {
    var scene = new THREE.Scene();
    var bufferScene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
    // var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;
    var renderer = createRenderer();
    document.body.appendChild(renderer.domElement);
    var textureA = createRenderTarget();
    var textureB = createRenderTarget();
    // textureB.texture = createDataTexture(createData(), width, length);
    // textureB.texture.needsUpdate = true;
    var geo = createGeometry();
    var bufferMaterial = createShaderMaterial(textureA);
    var bufferObject = new THREE.Mesh(geo, bufferMaterial);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: textureB }));
    bufferScene.add(bufferObject);
    scene.add(mesh);
    var step = 0;
    var render = function () {
        requestAnimationFrame(render);
        renderer.render(bufferScene, camera, textureB, true);
        var temp = textureA;
        textureA = textureB;
        textureB = temp;
        mesh.material.map = textureB;
        bufferMaterial.uniforms.texture.value = textureA;
        renderer.render(scene, camera);
        step++;
    };
    render();
};
//# sourceMappingURL=ShaderStuff.js.map