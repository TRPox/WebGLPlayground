/**
 * Created by marcus on 07/06/16.
 **/
/// <reference path="../three.d.ts"/>
var geo;
function createGeometry() {
    // var geo = new THREE.BufferGeometry();
    // geo.vertices.push(new THREE.Vector3(0,0,0));
    // geo.vertices.push(new THREE.Vector3(100,0,0));
    // geo.vertices.push(new THREE.Vector3(100,100,0));
    // geo.vertices.push(new THREE.Vector3(0,100,0));
    //
    // geo.faces.push( new THREE.Face3( 0, 1, 2) );
    // geo.faces.push( new THREE.Face3( 2, 3, 0) );
    geo = new THREE.PlaneGeometry(500, 300, 50, 50);
    var vertices = new Float32Array([
        -100.0, -100.0, 100.0,
        100.0, -100.0, 100.0,
        100.0, 100.0, 100.0
    ]);
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
function createShader() {
    var size = geo.vertices.length * geo.vertices.length;
    var data = new Uint8Array(size * 4);
    for (var i = 0; i < size * 4;) {
        data[i++] = Math.round(Math.random() * 255);
        data[i++] = Math.round(Math.random() * 255);
        data[i++] = Math.round(Math.random() * 255);
        data[i++] = 255;
    }
    var dataTexture = new THREE.DataTexture(data, geo.vertices.length, geo.vertices.length, THREE.RGBAFormat);
    dataTexture.needsUpdate = true;
    var shader = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0, type: 'f' },
            color: { type: 'c', value: new THREE.Color(0xffffff) },
            texture: { type: 't', value: dataTexture }
        },
        vertexShader: document.getElementById('vertex').textContent,
        fragmentShader: document.getElementById('fragment').textContent
    });
    // var shader = new THREE.MeshBasicMaterial();
    // shader.map = dataTexture;
    shader.needsUpdate = true;
    return shader;
}
function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 300);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 300;
    return renderer;
}
window.onload = function () {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 300;
    var renderer = createRenderer();
    document.body.appendChild(renderer.domElement);
    var geo = createGeometry();
    var shader = createShader();
    var mesh = new THREE.Mesh(geo, shader);
    scene.add(mesh);
    var render = function () {
        requestAnimationFrame(render);
        // shader.uniforms.time.value += 0.1;
        renderer.render(scene, camera);
    };
    render();
};
//# sourceMappingURL=ShaderStuff.js.map