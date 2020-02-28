
var scene, camera, renderer, controls;

// Need this to call RhinoCommon functions
// wait for the rhino3dm web assembly to load asynchronously
let rhino = null;
rhino3dm().then(function(m) {
    rhino = m; // global
  });

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x221f34);

    camera = new THREE.PerspectiveCamera( 10, window.innerWidth/window.innerHeight, 1, 100000 );
    camera.position.set(2600,2600,275) //Set target in ../../resources/OrbitControls.js

    //Directional light (lights work like cameras and need a LOT of settings)
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
    directionalLight.position.set(100, 100, 100);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.shadow.camera.near = 0.5;       
    directionalLight.shadow.camera.far = 1000;      
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.mapSize.width = 512;  // 512 default
    directionalLight.shadow.mapSize.height = 512; // 512 default
    directionalLight.castShadow = true; //tell the light to cast shadows
    scene.add(directionalLight);

    //Directional light in opposite direction
    var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.2 );
    directionalLight2.position.set(-100, -100, -100);
    directionalLight2.target.position.set(0, 0, 0);
    directionalLight2.shadow.camera.near = 0.5;       
    directionalLight2.shadow.camera.far = 1000;      
    directionalLight2.shadow.camera.left = -500;
    directionalLight2.shadow.camera.bottom = -500;
    directionalLight2.shadow.camera.right = 500;
    directionalLight2.shadow.camera.top = 500;
    directionalLight2.shadow.mapSize.width = 512;  // 512 default
    directionalLight2.shadow.mapSize.height = 512; // 512 default
    directionalLight2.castShadow = true; //tell the light to cast shadows
    scene.add(directionalLight2);

    //Helper to view directionalLight
    //const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    //scene.add(cameraHelper);

    //var ambientLight = new THREE.AmbientLight(0xbebad6);
    var ambientLight = new THREE.AmbientLight(0xa39fbf);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true; //turn on shadows in the renderer
    
    var canvas = document.getElementById("canvas");
    canvas.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement  );

    window.addEventListener( 'resize', onWindowResize, false );
    animate();
}

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    animate();
}

function meshToThreejs(mesh, material) {
    let loader = new THREE.BufferGeometryLoader();
    var geometry = loader.parse(mesh.toThreejsJSON());
    return new THREE.Mesh(geometry, material);
}

function curveToThreejs(curve, material) {
    let loader = new THREE.BufferGeometryLoader();
    var geometry = loader.parse(curve.toJSON());
    return new THREE.Line(geometry, material);
}

function curveToLineSegments(curve, material) {
    var geometry = new THREE.Geometry();
    var domain = curve.domain;
    var start = domain[0];
    var range = domain[1] - domain[0];
    var interval = range / 50.0;
    for (var i = 0; i < 51; i++) {
        t = start + i * interval;
        var pt = curve.pointAt(t);
        geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
    }
    return new THREE.Line(geometry, material);
}

function moveObj(object) {
    let movement = new rhino.Transform.translation(100, 100, -100);
    // console.log(movement);
    // console.log(object);
    // console.log(object.isClosed);
    // let result = object.transform(movement);
    // let moveVec = new rhino.Vector3d(100, 100, -100);
    let result = object.translate([100, 100, -100]);
    return object
}