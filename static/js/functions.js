// import { LineMaterial } from '../static/js/LineMaterial.js';

var scene, camera, renderer, controls;

// Need this to call RhinoCommon functions
// wait for the rhino3dm web assembly to load asynchronously

//This not originally commented out
//let rhino = null;


rhino3dm().then(function(m) {
    rhino = m; // global
  });


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x221f34);

    camera = new THREE.PerspectiveCamera( 10, window.innerWidth/window.innerHeight, 1, 100000 );
    // camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 1000 );

    camera.position.set(2000,2000,2000); //Set target in ../../resources/OrbitControls.js

    //Directional light (lights work like cameras and need a LOT of settings)
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
    directionalLight.position.set(-100, 100, 100);
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
    var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.1 );
    directionalLight2.position.set(100, -100, -100);
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
    var ambientLight = new THREE.AmbientLight(0x8985a6);
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
    // requestAnimationFrame( animate );
    // controls.update();
    // renderer.render( scene, camera );

    // Limit framerate to boost performance
    setTimeout( function() {
        requestAnimationFrame( animate );
        controls.update();
        renderer.render( scene, camera );
        TWEEN.update();
        camera.updateProjectionMatrix();
    }, 1000 / 30 );
}


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



function axonView() {
    // //Simple controls (no animated transition)
    // controls.target.set( 0, 0, 275 ); //Readjust after panning
    // camera.position.set(-2000,2000,2000);
    // camera.updateProjectionMatrix();

    //With Tweens
    let duration = 500;

    new TWEEN.Tween( camera.position ).to( {
        x: 2000,
        y: 2000,
        z: 2000}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut)
        .start();
    
    new TWEEN.Tween( controls.target ).to( {
        x: 0,
        y: 0,
        z: 275}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut)
        .start();
}


function topView() {
    let duration = 500;

    new TWEEN.Tween( camera.position ).to( {
        x: 10,
        y: 10,
        z: 4000}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut )
        .start();
    
    new TWEEN.Tween( controls.target ).to( {
        x: 0,
        y: 0,
        z: 275}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut )
        .start();


    
    /*The unsolved problem explored in all the code below is the camera rotates so 
    suddenly when changing to top view. This behavior can be seen if you change the
    duration to something huge like 10000 and are already in top view but with a 
    different rotation (in which case the rotation happens right away) or are in front 
    view (in which case the rotation happens after the position Tween). In either case,
    the rotation is still smooth, but it is MUCH faster than the change in position.
    The rotation happens solely because of the position tween, and note that what appears
    to be a 45 degree angle, is actually aligned with the x and y axes (the model is rotated)*/ 
    
    
    
    // // interpolate quaternions with the current tween value
    // //let initQ = new THREE.Quaternion().copy(camera.quaternion);
    // let initQ = new THREE.Quaternion();
    // initQ.copy(camera.quaternion);

    // // let initQ = camera.quaternion.clone();
    // // let endQ = new THREE.Quaternion(0.18734214884075126, 0.4522839565354606, 0.8056007778384423, 0.3336907680389976);
    // let curQ = new THREE.Quaternion();
    // let endQ = new THREE.Quaternion();
    // let euler = new THREE.Euler( 0, 0, 2.5, 'XYZ' );
    // endQ.setFromEuler(euler);        

    // console.log('Init: ', initQ);
    // console.log('End: ', endQ);

    // let time = {t: 0};
    // //This doesn't actually do anything... All the rotation is happening bc of the position tween
    // new TWEEN.Tween( time ).to( {t: 1}, duration )
    //     .easing(TWEEN.Easing.Quadratic.InOut)
    //     .onUpdate(() => {
    //         THREE.Quaternion.slerp(initQ, endQ, curQ, time.t);
    //         camera.quaternion = curQ;
    //         console.log("T: ", time.t);
    //     })
    //     .start();





    
    // // interpolate quaternions with the current tween value
    // let initQ = new THREE.Quaternion().copy(camera.quaternion); //may not even need this
    // let curQ = new THREE.Quaternion();
    // let endQ = new THREE.Quaternion();
    // let euler = new THREE.Euler( 0, 0, 2.5, 'XYZ' );
    // endQ.setFromEuler(euler);

    // THREE.Quaternion.slerp(initQ, endQ, curQ, 0.9);

    // let vec3 = new THREE.Vector3();

    // // apply new quaternion to camera position
    // vec3.x = camera.position.x;
    // vec3.y = camera.position.y;
    // vec3.z = camera.position.z;
    // vec3.applyQuaternion(curQ)
    // camera.position.copy(vec3)

    // // apply new quaternion to camera up
    // vec3 = camera.up.clone();
    // vec3.applyQuaternion(curQ);
    // camera.up.copy(vec3);

    // const currentCamPosition = {x: camera.postion.x, y: camera.position.y, z: camera.position.z};
    // const storedMarkerPosition = new THREE.Vector3(0, 0, 4000);
    // const newCameraTarget = new THREE.Vector3(0, 0, 275);
    // const markerPosition = new THREE.Vector3(...Object.values(newCameraTarget));
    // const startRotation = new THREE.Euler().copy(camera.rotation);

    // camera.lookAt(storedMarkerPosition);
    // const endRotation = new THREE.Euler().copy(camera.rotation);

    // camera.rotation.copy(startRotation);
    
    // new TWEEN.Tween(camera.rotation)
    //     .to(
    //     {
    //         x: endRotation.x,
    //         y: endRotation.y,
    //         z: endRotation.z,
    //     }, 500)
    //     .easing(TWEEN.Easing.Quadratic.InOut)
    //     .onComplete(() => {
    //         new TWEEN.Tween(camera.position)
    //             .to({
    //                 x: marker.cameraPositionX,
    //                 y: camera.position.y,
    //                 z: marker.cameraPositionZ,
    //             })
    //             .easing(TWEEN.Easing.Quadratic.InOut)
    //             .onUpdate(() => {
    //                 camera.lookAt(storedMarkerPosition);
    //             })
    //             .onComplete(() => {
    //                 camera.lookAt(storedMarkerPosition);
    //                 radius = Math.hypot(...Object.values(markerPosition));
    //                 phi = Math.acos(markerPosition.y / radius);
    //                 theta = Math.atan2(markerPosition.z, markerPosition.x);
    //                 lon = THREE.Math.radToDeg(theta);
    //                 lat = 90 - THREE.Math.radToDeg(phi);
    //     })
    //     .start();
    // })
    // .start();

}


function frontView() {
    let duration = 500;

    new TWEEN.Tween( camera.position ).to( {
        x: 0,
        y: 4000,
        z: 275}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut)
        .start();
    
    new TWEEN.Tween( controls.target ).to( {
        x: 0,
        y: 0,
        z: 275}, duration )
        .easing( TWEEN.Easing.Quadratic.InOut)
        .start();
}





//------------------------------------------Nib Input Panel-------------------------------------------------------------------------------------------------------------------------------------

var colorWheel = new iro.ColorPicker("#colorWheel", {
    color: '#ff0077', //this value should match line_color
    layout: [
        { 
          component: iro.ui.Wheel,
          options: {
            wheelLightness: true,
            wheelAngle: 0,
            wheelDirection: "anticlockwise",
            width: 85,
            borderWidth: 1,
            borderColor: '#fff',
            // handleRadius: 5,
            handleSvg: '#handle'
          } 
        }
        ]
});

colorWheel.on('input:end', function(color){
    //'input' settings here: https://www.cssscript.com/sleek-html5-javascript-color-picker-iro-js/
    line_color = color.hexString;
    nib_objects[nib_key].color = line_color;
    reset_scene();
})


var sliderLineWeight = document.getElementById("lineWeightSlider");
sliderLineWeight.oninput = function() {
    let line_weight = this.value //Set thickness of lines
    nib_objects[nib_key].weight = line_weight;

    let slider_thickness = line_weight.concat('px'); //Convet to "pixels"
    let slider_margin = (parseInt(14) - line_weight).toString().concat('px'); //.sliderLines.margin_bottom + 3 in style.css

    document.getElementById("lineWeightSlider").style.height = slider_thickness; //Update CSS property
    document.getElementById("lineWeightSlider").style.marginBottom = slider_margin; //Update CSS property


    reset_scene();
}


// Scroll Bar https://jamesflorentino.github.io/nanoScrollerJS/
function activateScroll() {
    $(".nano").nanoScroller();
}




// var sliderRotation = document.getElementById("rotationSlider");
// sliderRotation.oninput = function() {
//     rotation_angle = this.value * 0.0175; //Convert angle from degrees to radians
//     current_angle = rotation_angle;
//     angle_A = rotation_angle * angle_factor_A;
//     angle_B = rotation_angle * angle_factor_B;
    
//     reset_scene(); 
//   }

// Circular slider from here: https://www.npmjs.com/package/round-slider
$("#circularSlider").roundSlider({
    min: 1.0,
    max: 2.0,
    step: 0.05,
    value: null,
    radius: 70,
    width: 2,
    handleSize: "+10",
    startAngle: 180,
    endAngle: "+340",
    animation: false,
    showTooltip: false,
    editableTooltip: true,
    readOnly: false,
    disabled: false,
    keyboardAction: false,
    mouseScrollAction: false,
    sliderType: "min-range",
    circleShape: "full",
    handleShape: "dot",
    lineCap: "round",

    // the 'startValue' property decides at which point the slider should start.
    // otherwise, by default the slider starts with min value. this is mainly used
    // for min-range slider, where you can customize the min-range start position.
    startValue: null,

    // SVG related properties
    svgMode: true,
    borderWidth: 0,
    borderColor: null,
    pathColor: '#686773',
    rangeColor: '#ffffff',
    tooltipColor: null,

    // events
    beforeCreate: null,
    create: null,
    start: null,
    // 'beforeValueChange' will be triggered before 'valueChange', and it can be cancellable
    beforeValueChange: null,
    drag: null,
    change: null,
    // 'update' event is the combination of 'drag' and 'change'
    update: null,
    // 'valueChange' event is similar to 'update' event, in addition it will trigger
    // even the value was changed through programmatically also.
    valueChange: null,
    stop: null,
    tooltipFormat: null
});

$("#circularSlider").roundSlider("option", "value", 1.9);
$("#circularSlider").roundSlider();
$("#circularSlider").on("valueChange", function (e) {
    update_angle_factor_B(e.value);
})

function update_angle_factor_B(value) {
    angle_factor_B = value;
    angle_B = rotation_angle * angle_factor_B;         
    reset_scene(); 
}





//------------------------------------------Animate-------------------------------------------------------------------------------------------------------------------------------------


function play() {

    freeze_src(); //Disable all buttons other than play/pause/reset

    play_bool = true;
    draw_bool = true;

    renderer.setAnimationLoop( function () {
        if (play_bool) {
            rotation_angle = rotation_angle + (rotation_increment * 0.0175); //Convert angle from degrees to radians
            angle_A = rotation_angle * angle_factor_A;
            angle_B = rotation_angle * angle_factor_B;         

            reset_scene(); 
            renderer.render( scene, camera );
            play_count += 1;
        }
    })
}


function pause() {
    play_bool = false;
    
}


function reset_animation() {
    // document.getElementById("rotationSlider").className = "slider"; //enable slider
    // document.getElementById("rotationSlider").disabled = false;

    $("#circularSlider").roundSlider("enable"); //enable slider
    document.getElementById("circularSlider").className = "circularAvailable";

    update_src(); //enable all other buttons;
    
    rotation_angle = current_angle;
    angle_A = rotation_angle * angle_factor_A;
    angle_B = rotation_angle * angle_factor_B;

    draw_bool = false;
    play_bool = false;
    play_count = 0;
    reset_scene();
}




//------------------------------------------Helper Functions-------------------------------------------------------------------------------------------------------------------------------------

function nib_UI() {
    //Controls whether or not the Nib UI panel is visible
    if (nib_UI_bool) {
        document.getElementById("colorWheel").className = "wheelAvailable"; //enable color wheel
        document.getElementById("lineWeightSlider").className = "sliderLines"; //enable line weight slider
    }

    else {
        document.getElementById("colorWheel").className = "wheelUnavailable"; //disable color wheel
        document.getElementById("lineWeightSlider").className = "sliderLinesUnavailable"; //disable line weight slider
    }
}


function nib_creation() {    
    //Need to create the nib objects outside of the main loop so that values like color and weight persist

    let nib_counter = 0;
    for (i in nib_objects) {nib_counter += 1;}
    
    nib_counter = nib_counter.toString();
    nib_objects[nib_counter] = {"sphere": "",
                            "color": line_color,
                            "weight": line_weight,
                            "points": []
                            }    
}


function next() {
    let lastIndex = selection_list.length - 1;
    selection_list[lastIndex] = selection_list[lastIndex] + 1;
    
    reset_scene();
  }


function previous() {
    let lastIndex = selection_list.length - 1;
    
    if (selection_list[lastIndex] != 0) {selection_list[lastIndex] = selection_list[lastIndex] - 1;}
    else {selection_list[lastIndex] = pair_list.length - 1;}
    
    reset_scene();
  }


function reset_scene() {
    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if ((scene.children[i].type == 'Mesh') || (scene.children[i].type == 'Line2')) {
            scene.remove(scene.children[i]);
            i = i-1;
        }
    } 

    //Clear lists
    part_list_output = [];
    target_axes = [];
    target_guides = [];
    target_tags = [];
    
    //Reset Nibs
    nib_item = 0;
    if (draw_bool == false) {
        for (i in nib_objects) {nib_objects[i].points = [];}
    }

    //Redraw Machine
    base();
    draw();
}


function draw() {
    let meshMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, shininess: 1000});
    //meshMaterial.bumpMap = THREE.ImageUtils.loadTexture('/static/textures/grit.png');
    
    for (let i=0; i<part_list_output.length; i++) {
        let geo = part_list_output[i];
        let threeMesh;

        threeMesh = meshToThreejs(geo, meshMaterial); 
        threeMesh.castShadow = true;
        threeMesh.receiveShadow = true;

        scene.add(threeMesh);
    }

    //Draw nibs + lines
    for (i in nib_objects) {

        let nib_color;
        if (nib_objects[i].color) {
            nib_color = nib_objects[i].color;
        }
        else {nib_color = line_color;}

        let nibMaterial = new THREE.MeshBasicMaterial({color: nib_color});
        let geo = nib_objects[i].sphere;
        let threeMesh = meshToThreejs(geo, nibMaterial);
        scene.add(threeMesh);

        let points = nib_objects[i].points;

        if (points.length > 0) {
            // //Simple line (no ability to control thickness)
            // let curve_material = new THREE.LineBasicMaterial({color: 0xff00aa});
            // let new_points = [];
            // for (let i=0; i<points.length; i++) {
            //     let THREEpt = new THREE.Vector3(points[i].location[0], points[i].location[1], points[i].location[2]);
            //     new_points.push(THREEpt);
            // }
            // let curve_points = new THREE.BufferGeometry().setFromPoints(new_points);                
            // curve_geometry = new THREE.Line( curve_points, curve_material );
            // scene.add(curve_geometry);


            //Lines with variable thickness
            //tutorial: https://dustinpfister.github.io/2018/11/07/threejs-line-fat-width/
            geo = new THREE.LineGeometry();
            let positions = [];
            let colors = []
            let color = new THREE.Color(nib_color);

            for (let i=0; i<points.length; i++) {
                positions.push(points[i].location[0], points[i].location[1], points[i].location[2]);
                colors.push(color.r, color.g, color.b);
            }
            geo.setPositions(positions);
            geo.setColors(colors);

            var matLine = new THREE.LineMaterial({
                linewidth: nib_objects[i].weight, // in pixels
                vertexColors: THREE.VertexColors
            });
        
            matLine.resolution.set(window_width, window_height);
            
            let line = new THREE.Line2(geo, matLine);
            scene.add(line);
        }
    }
}


function update_src() {
    //Make pause and reset buttons Unavailable
    let element_pause = document.getElementById("pause");
    element_pause.className = "iconUnavailable";
    element_pause.setAttribute( "onClick", " " );

    let element_reset = document.getElementById("reset");
    element_reset.className = "iconUnavailable";
    element_reset.setAttribute( "onClick", " " );

    //Make undo, previous, and next buttons available
    if (part_list_input.length > 0) {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconAvailable"; //Change to CSS class with hover 
        element_undo.setAttribute( "onClick", "undo()" );
    }

    let element_previous = document.getElementById("previous");
    element_previous.className = "iconAvailable"; //Change to CSS class with hover 
    element_previous.setAttribute( "onClick", "previous()" );

    let element_next = document.getElementById("next");
    element_next.className = "iconAvailable"; //Change to CSS class with hover 
    element_next.setAttribute( "onClick", "next()" );

    let element_play = document.getElementById("play");
    element_play.className = "iconAvailable"; //Change to CSS class with hover 
    element_play.setAttribute( "onClick", "play()" );



    //Iterate over target_tags and update icons base on whether or not they are available (i.e. in target_tags)
    let tag_set = new Set();
    for (let i=0; i<target_tags.length; i++) {
        individual_tags = target_tags[i].split(", ");
        for (j=0; j<individual_tags.length; j++) {
            tag_set.add(individual_tags[j].split("_")[0]);
        }
    }

    if (tag_set.has("tube1")) {
        let element = document.getElementById("tube1");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Tube 1')" );
    }
    else {
        let element = document.getElementById("tube1");
        element.className = "iconUnavailable";
        element.onclick = " ";
    }

    //The "tube2" tag is used for Tube 2 and Tube 3 since they share all the same placements
    if (tag_set.has("tube2")) {
        let element1 = document.getElementById("tube2");
        element1.className = "iconAvailable"; //Change to CSS class with hover 
        element1.setAttribute( "onClick", "add_part('Tube 2')" );

        let element2 = document.getElementById("tube3");
        element2.className = "iconAvailable"; //Change to CSS class with hover 
        element2.setAttribute( "onClick", "add_part('Tube 3')" );
    }
    else {
        let element1 = document.getElementById("tube2");
        element1.className = "iconUnavailable"; 
        element1.onclick = "";

        let element2 = document.getElementById("tube3");
        element2.className = "iconUnavailable"; 
        element2.onclick = "";
    }

    if (tag_set.has("motor1")) {
        let element = document.getElementById("motor1");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 1')" );
    }
    else {
        let element = document.getElementById("motor1");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor2")) {
        let element = document.getElementById("motor2");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 2')" );
    }
    else {
        let element = document.getElementById("motor2");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }

    if (tag_set.has("motor3")) {
        let element = document.getElementById("motor3");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 3')" );
    }
    else {
        let element = document.getElementById("motor3");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor4")) {
        let element = document.getElementById("motor4");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 4')" );
    }
    else {
        let element = document.getElementById("motor4");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor5")) {
        let element = document.getElementById("motor5");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 5')" );
    }
    else {
        let element = document.getElementById("motor5");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }

    if (tag_set.has("nib") && selection_list.length > 0) {
        let element = document.getElementById("nib");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "nib_creation(), add_part('Nib')" );
    }
    else {
        let element = document.getElementById("nib");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }
}


function freeze_src() {
    //Turn off all controls during play / pause / reset

    // document.getElementById("rotationSlider").className = "sliderUnavailable"; //Disable slider
    // document.getElementById("rotationSlider").disabled = true;

    //Disable circular slider
    $("#circularSlider").roundSlider("disable");
    document.getElementById("circularSlider").className = "circularUnavailable";

    //Make pause and reset buttons available
    let element_pause = document.getElementById("pause");
    element_pause.className = "iconAvailable";
    element_pause.setAttribute( "onClick", "pause()" );

    let element_reset = document.getElementById("reset");
    element_reset.className = "iconAvailable";
    element_reset.setAttribute( "onClick", "reset_animation()" );


    //Make undo, previous, and next buttons unavailable
    let element_undo = document.getElementById("undo");
    element_undo.className = "iconUnavailable";
    element_undo.setAttribute( "onClick", " " );

    let element_previous = document.getElementById("previous");
    element_previous.className = "iconUnavailable";
    element_previous.setAttribute( "onClick", " " );

    let element_next = document.getElementById("next");
    element_next.className = "iconUnavailable";
    element_next.setAttribute( "onClick", " " );

    let element_tube1 = document.getElementById("tube1");
    element_tube1.className = "iconUnavailable";
    element_tube1.setAttribute( "onClick", " " );
    
    let element_tube2 = document.getElementById("tube2");
    element_tube2.className = "iconUnavailable";
    element_tube2.setAttribute( "onClick", " " );

    let element_tube3 = document.getElementById("tube3");
    element_tube3.className = "iconUnavailable";
    element_tube3.setAttribute( "onClick", " " );
    
    let element_motor1 = document.getElementById("motor1");
    element_motor1.className = "iconUnavailable";
    element_motor1.setAttribute( "onClick", " " );

    let element_motor2 = document.getElementById("motor2");
    element_motor2.className = "iconUnavailable";
    element_motor2.setAttribute( "onClick", " " );

    let element_motor3 = document.getElementById("motor3");
    element_motor3.className = "iconUnavailable";
    element_motor3.setAttribute( "onClick", " " );

    let element_motor4 = document.getElementById("motor4");
    element_motor4.className = "iconUnavailable";
    element_motor4.setAttribute( "onClick", " " );

    let element_motor5 = document.getElementById("motor5");
    element_motor5.className = "iconUnavailable";
    element_motor5.setAttribute( "onClick", " " );

    let element_nib = document.getElementById("nib");
    element_nib.className = "iconUnavailable";
    element_nib.setAttribute( "onClick", " " );
}


function undo() {
    //Remove most recently added part
    if (part_list_input.length > 0) {
        let last_part = part_list_input.pop();
        selection_list.pop();

        //If removing a Nib then need to remove it from nib_objects too
        if (last_part == "Nib") {
            let nib_counter = -1;
            for (i in nib_objects) {nib_counter += 1;}
            delete nib_objects[nib_counter];
        }
        
        if (part_list_input.length == 0) {
            let element_undo = document.getElementById("undo");
            element_undo.className = "iconUnavailable";
            element_undo.setAttribute( "onClick", " " );
        }

        reset_scene();
        update_src();
    }

    else {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconUnavailable";
        element_undo.setAttribute( "onClick", " " );
    }
}


function add_part(part_name) {
    part_list_input.push(part_name);
    selection_list.push(0);

    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if (scene.children[i].type == 'Mesh') {
            scene.remove(scene.children[i]);
            i = i - 1;
        }
    } 

    //Clear lists
    part_list_output = [];
    target_axes = [];
    target_guides = [];
    target_tags = [];

    //Redraw Machine
    base();
    draw();
    update_src();
}


function generate_selection_pairs(source_tags, target_tags) {
    //Generate list of tuples containing indices for all permutations of available source/target pairs
    var pair_list = []
    
    for (let i=0; i<target_tags.length; i++) {
        for (let j=0; j<source_tags.length; j++) {
            if (target_tags[i].split(", ").includes(source_tags[j])) {
                pair_list.push([j, i]);
            }
        }
    }    
   
    return pair_list;
}


function next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item) {    
    if (part_list_input.length > count) {
        block = part_list_input[count];
        
        if (part_list_input[count] == "Tube 1") {
            tube1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     tube1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Tube 2") {
            tube2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
        //     try {
        //         tube2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
        //     }
        //     catch(err) {
        //         count += 1;
        //         next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
        //     }
        }        
        else if (part_list_input[count] == "Tube 3") {
            tube3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     tube3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Motor 1") {
            motor1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     motor1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }        
        else if (part_list_input[count] == "Motor 2") {
            motor2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     motor2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Motor 3") {
            motor3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     motor3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Motor 4") {
            motor4(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     motor4(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Motor 5") {
            motor5(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     motor5(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else if (part_list_input[count] == "Nib") {
            nib(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // try {
            //     nib(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
            // catch(err) {
            //     count += 1;
            //     next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            // }
        }
        else {
            // console.log("Block does not exist");
            count += 1;
            next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
        }
    }
    else {
        // console.log("Done");
        return part_list_output, target_axes, target_guides;
    }
}


function angle_cross_product(target, source) {
    /*This function takes two 3D vectors and determines the angle between them (a function of their dot product), 
    and the axis for their rotation (the cross product, which represents a third vector orthogonal to the first two).
    Note that the dot product will only return an angle between 0 and 180, so the orientation of the cross product 
    is used in conjunction with the right-hand rule, with rotation occurring in a counter-clockwise direction.
    
    This function expects a target and source curve, originally drawn in Rhino, that will be
    converted into vectors. The curves can be axes or guides.*/
    
    let target_normal = [target.pointAt(1)[0] - target.pointAt(0)[0], target.pointAt(1)[1] - target.pointAt(0)[1], target.pointAt(1)[2] - target.pointAt(0)[2]];
    let source_normal = [source.pointAt(1)[0] - source.pointAt(0)[0], source.pointAt(1)[1] - source.pointAt(0)[1], source.pointAt(1)[2] - source.pointAt(0)[2]];
    
    //Cross Product [cx, cy, cz] is the normal vector or axis of rotation
    let cx = (source_normal[1] * target_normal[2]) - (source_normal[2] * target_normal[1]);
    let cy = (source_normal[2] * target_normal[0]) - (source_normal[0] * target_normal[2]);
    let cz = (source_normal[0] * target_normal[1]) - (source_normal[1] * target_normal[0]);
    let cross_product = [cx, cy, cz];

    //Dot Product is used to find the angle between the two vectors (calculation is simplified for unit vectors)
    //A dot product of 1 means that the vectors are parallel, a dot product of 0 means that the vectors are orthogonal
    let dot_product = (target_normal[0] * source_normal[0]) + (target_normal[1] * source_normal[1]) + (target_normal[2] * source_normal[2]);

    //math.acos() only accepts -1 <= x <= 1, so the following code avoids errors from numbers like 1.000000000000000000002
    let new_angle = 0;
    
    if (dot_product >= 1) {new_angle = 0;}
    else if (dot_product <= -1) {new_angle = Math.PI;}
    else {new_angle = Math.acos(dot_product);}

    return [new_angle, cross_product];
}


function orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide) {
    /*This function places source geometry (the part itself(geo) and all axes/guides) onto the target geometry,
    and orients the geometry to correctly align in 3d space. The function expects a mesh for the source geometry (geo), 
    a source axis and guide, a target axis and guide (all chosen earlier from available option), as well as lists of
    potential_axes and potential_guides that will eventually be added to the list of target axes/guides in a future step.
    
    In order to accomplish this, the function follows three distint steps:
    
    Step 1: rotate the two axes into alignment in 3d space.
    This step finds the angle and axis of rotation (the cross product) between the source and target axes,
    and then rotates the source geometry into alignment prior to placing the source geometry onto the target.
    
    Step 2: move the source geometry to the target geometry.
    This step is the most straightforward of the three as it is a simple translation.
    
    Step 3: rotate the two guides into alignment in 3d space.
    Because the axis vectors don't track rotation around themselves, source and target part_list_output will typically be oriented
    correctly along their axes, but still in need of additional rotation AROUND those axes to reach final alignment. 
    This is why there are source and target guides, and Step 3 finds the angle between the guidesfor this final rotation.*/
    
    //Step 1: rotate the two axes into alignment in 3d space
    let response = angle_cross_product(target_axis, source_axis);
    let angle_1 = response[0];
    let cross_product = response[1];

    // let rotation = rhino.Transform.rotation(Math.sin(angle), Math.cos(angle), cross_product, source_axis.pointAt(0));
    geo.rotate(angle_1, cross_product, source_axis.pointAt(0));
    source_axis.rotate(angle_1, cross_product, source_axis.pointAt(0));
    source_guide.rotate(angle_1, cross_product, source_axis.pointAt(0));
    for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_1, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_1, cross_product, source_axis.pointAt(0));}
    
    
    //Step 2: move the source geometry to the target geometry
    let movement = [target_axis.pointAt(0)[0] - source_axis.pointAt(0)[0], target_axis.pointAt(0)[1] - source_axis.pointAt(0)[1], target_axis.pointAt(0)[2] - source_axis.pointAt(0)[2]];
    geo.translate(movement);
    source_axis.translate(movement);
    source_guide.translate(movement);
    for (let i=0; i<potential_axes.length; i++) {potential_axes[i].translate(movement);} 
    for (let i=0; i<potential_guides.length; i++) {potential_guides[i].translate(movement);}
    
    
    //Step 3: rotate the two guides into alignment in 3d space
    response = angle_cross_product(target_guide, source_guide);
    let angle_2 = response[0];
    cross_product = response[1];

    /*When cross_product is close to 0 (as happens when vectors are parallel), there's no axis for rotation. 
    This isn't a problem if the angle is 0 (truly parallel), but is a big problem if the angle is 180
    (vectors are inverted). In that condition, the source_axis can be substituted for the cross_product,
    but that is not a generalizeable solution, because the angle will always be between 0 and 180 and
    the direction of rotation will always be determined by the right hand rule, so we need to allow for 
    the direction of the axis to flip.*/
    
    let cross_sum = cross_product[0] + cross_product[1] + cross_product[2];

    if (angle_2.toFixed(5) == 3.14159 && Math.abs(cross_sum.toFixed(6)) == 0) {
        cross_product = [source_axis.pointAt(1)[0] - source_axis.pointAt(0)[0], source_axis.pointAt(1)[1] - source_axis.pointAt(0)[1], source_axis.pointAt(1)[2] - source_axis.pointAt(0)[2]];
    }

    // rotation = rhino.Transform.rotation(Math.sin(angle), Math.cos(angle), cross_product, source_axis.pointAt(0));
    geo.rotate(angle_2, cross_product, source_axis.pointAt(0));
    for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_2, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_2, cross_product, source_axis.pointAt(0));}
    
    
    //No point in returning source_axis and source_guide b/c they aren't needed anymore
    let return_objects = [geo, potential_axes, potential_guides];
    return return_objects;
}







//------------------------------------------Drawing Machine Parts-------------------------------------------------------------------------------------------------------------------------------------

function base() {
    //Define geometry
    let sphere = base_sphere.duplicate();
    let tube = base_tube.duplicate();
    let axis = base_axis.duplicate();
    let guide = base_guide.duplicate();
    
    //Transform
    let pt1 = axis.pointAt(0);
    let pt2 = axis.pointAt(0.5);
    let axis_vector = [pt1[0] - pt2[0], pt1[1] - pt2[1], pt1[2] - pt2[2]];
    
    tube.rotate(rotation_angle, axis_vector, pt1);
    axis.rotate(rotation_angle, axis_vector, pt1);
    guide.rotate(rotation_angle, axis_vector, pt1);
    
    // console.log("Adding Base");
    part_list_output.push(sphere);
    part_list_output.push(tube);
    
    target_axes.push(axis);
    target_axes.push(axis);
    target_guides.push(guide);
    target_guides.push(guide);
    target_tags.push(tag_tube1_a_outer);
    target_tags.push(tag_tube1_a_inner);
    
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function tube1(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }    
    
    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let geo = tube1_geo.duplicate();
    let a_axis_1 = tube1_a_axis_1.duplicate();
    let a_guide_1 = tube1_a_guide_1.duplicate();
    let b_axis_1 = tube1_b_axis_1.duplicate();
    let b_guide_1 = tube1_b_guide_1.duplicate();
    
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    Note: Tube 1 can be positioned according to inner (like plugging onto the end of a smaller Tube 2/3) or outer placements (like slotting into a motor). 
    The Inner and Outer placements share axes/guides but have different tags.*/
    
    let source_tags = ['tube1_a_outer', 'tube1_a_inner', 'tube1_b_outer', 'tube1_b_inner'];
    let source_axes = [a_axis_1, a_axis_1, b_axis_1, b_axis_1];
    let source_guides = [a_guide_1, a_guide_1, b_guide_1, b_guide_1];
    
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);
    
    //If Tube 1 is placed on Tube 2/3, then we have to remove the corresponding Tube 2/3 inner plane
    //I.E. you can't place a Nib in the end of Tube 2/3 that is already in Tube 1
    if (target_tag == tag_tube2_a_outer || target_tag == tag_tube2_b_outer || target_tag == tag_tube3_a_outer || target_tag == tag_tube3_b_outer) {
        target_tags.splice(source_target_pair[1], 1); //Inner plane will always follow the available outer plane 
        target_axes.splice(source_target_pair[1], 1); //Use source_target_pair[1] b/c the index has already been popped, shortening the list, so no need for +1
        target_guides.splice(source_target_pair[1], 1);
    }
    
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step.*/ 
    
    let potential_source_tags = ['tube1_a_outer', 'tube1_a_inner', 'tube1_b_outer', 'tube1_b_inner'];
    let potential_target_tags = [tag_tube1_a_outer, tag_tube1_a_inner, tag_tube1_b_outer, tag_tube1_b_inner];
    let potential_axes = [a_axis_1.duplicate(), a_axis_1.duplicate(), b_axis_1.duplicate(), b_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), a_guide_1.duplicate(), b_guide_1.duplicate(), b_guide_1.duplicate()];
    
    
    //Step 5. Transform (orient and rotate) mesh and all potential_target geo
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    //console.log("Adding Tube 1");
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function tube2(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }    
    
    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let geo = tube2_geo.duplicate();
    let a_axis_1 = tube2_a_axis_1.duplicate();
    let a_guide_1 = tube2_a_guide_1.duplicate();
    let mid_axis_1 = tube2_mid_axis_1.duplicate();
    let mid_guide_1 = tube2_mid_guide_1.duplicate();
    let b_axis_1 = tube2_b_axis_1.duplicate();
    let b_guide_1 = tube2_b_guide_1.duplicate();
       
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['tube2_a_outer', 'tube2_mid_outer', 'tube2_b_outer'];
    let source_axes = [a_axis_1, mid_axis_1, b_axis_1];
    let source_guides = [a_guide_1, mid_guide_1, b_guide_1];
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Tube 2, there are 5 potential targets: a_inner, a_outer, mid_outer, b_inner, b_outer
    but tubes 2/3 are a little more complicated than the other parts, b/c when they are placed
    inside tube1, both the outer placement AND the corresponding inner placement is lost
    i.e. you can't place a nib in the end of tube 2/3 if that tube is already plugged into a tube1
    For that reason, the list of potential_target_axes/guides is related to the chosen target_tag*/
    
    let potential_source_tags = [];
    let potential_target_tags = [];
    let potential_axes = [];
    let potential_guides = [];

    if (target_tag == tag_tube1_a_inner) {
        potential_source_tags = ['tube2_a_outer', 'tube2_a_inner', 'tube2_mid_outer'];
        potential_target_tags = [tag_tube2_a_outer, tag_tube2_a_inner, tag_tube2_mid_outer];
        potential_axes = [a_axis_1.duplicate(), a_axis_1.duplicate(), mid_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), a_guide_1.duplicate(), mid_guide_1.duplicate()];
    }
    else if (target_tag == tag_tube1_b_inner) {
        potential_source_tags = ['tube2_b_outer', 'tube2_b_inner', 'tube2_mid_outer'];
        potential_target_tags = [tag_tube2_b_outer, tag_tube2_b_inner, tag_tube2_mid_outer];
        potential_axes = [b_axis_1.duplicate(), b_axis_1.duplicate(), mid_axis_1.duplicate()];
        potential_guides = [b_guide_1.duplicate(), b_guide_1.duplicate(), mid_guide_1.duplicate()];
    }
    else {
        potential_source_tags = ['tube2_a_outer', 'tube2_a_inner', 'tube2_mid_outer', 'tube2_b_outer', 'tube2_b_inner'];
        potential_target_tags = [tag_tube2_a_outer, tag_tube2_a_inner, tag_tube2_mid_outer, tag_tube2_b_outer, tag_tube2_b_inner];
        potential_axes = [a_axis_1.duplicate(), a_axis_1.duplicate(), mid_axis_1.duplicate(), b_axis_1.duplicate(), b_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), a_guide_1.duplicate(), mid_guide_1.duplicate(), b_guide_1.duplicate(), b_guide_1.duplicate()];
    }
    
    //Step 5. Transform (orient and rotate) mesh and all potential_target geo
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    // console.log("Adding Tube 2");
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function tube3(part_list_output, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (part_list_output/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();
        
    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let geo = tube3_geo.duplicate();
    let a_axis_1 = tube3_a_axis_1.duplicate();
    let a_guide_1 = tube3_a_guide_1.duplicate();
    let a_guide_2 = tube3_a_guide_2.duplicate();
    let a_guide_3 = tube3_a_guide_3.duplicate();
    let a_guide_4 = tube3_a_guide_4.duplicate();
    let b_axis_1 = tube3_b_axis_1.duplicate();
    let b_guide_1 = tube3_b_guide_1.duplicate();
    let b_guide_2 = tube3_b_guide_2.duplicate();
    let b_guide_3 = tube3_b_guide_3.duplicate();
    let b_guide_4 = tube3_b_guide_4.duplicate();
    
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer'];
    let source_axes = [a_axis_1, a_axis_1, a_axis_1, a_axis_1, b_axis_1, b_axis_1, b_axis_1, b_axis_1];
    let source_guides = [a_guide_1, a_guide_2, a_guide_3, a_guide_4, b_guide_1, b_guide_2, b_guide_3, b_guide_4];
    
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of tube3, there are 4 potential targets: a_inner, a_outer, b_inner, b_outer
    but tubes 2/3 are a little more complicated than the other parts, b/c when they are placed
    inside tube1, both the outer placement AND the corresponding inner placement is lost
    i.e. you can't place a nib in the end of tube 2/3 if that tube is already plugged into a tube1
    For that reason, the list of potential_target_axes/guides is related to the chosen target_tag*/
    
    let potential_source_tags = [];
    let potential_target_tags = [];
    let potential_axes = [];
    let potential_guides = [];

    if (target_tag == tag_tube1_a_inner) {
        potential_source_tags = ['tube3_a_outer', 'tube3_a_inner'];
        potential_target_tags = [tag_tube3_a_outer, tag_tube3_a_inner];
        potential_axes = [a_axis_1.duplicate(), a_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), a_guide_1.duplicate()];
    }
    else if (target_tag == tag_tube1_b_inner) {
        potential_source_tags = ['tube3_b_outer', 'tube3_b_inner'];
        potential_target_tags = [tag_tube3_b_outer, tag_tube3_b_inner];
        potential_axes = [b_axis_1.duplicate(), b_axis_1.duplicate()];
        potential_guides = [b_guide_1.duplicate(), b_guide_1.duplicate()];
    }
    else {
        potential_source_tags = ['tube3_a_outer', 'tube3_a_inner', 'tube3_b_outer', 'tube3_b_inner'];
        potential_target_tags = [tag_tube3_a_outer, tag_tube3_a_inner, tag_tube3_b_outer, tag_tube3_b_inner];
        potential_axes = [a_axis_1.duplicate(), a_axis_1.duplicate(), b_axis_1.duplicate(), b_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), a_guide_1.duplicate(), b_guide_1.duplicate(), b_guide_1.duplicate()];
    }
    
    //Step 5. Transform (orient and rotate) mesh and all potential_target geo
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    // console.log("Adding Tube 3");
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function motor1(part_list_output, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();
        
    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = motor1_geo.duplicate();
    let a_axis_1 = motor1_tube2a_axis_1.duplicate();
    let a_axis_2 = motor1_tube2a_axis_2.duplicate();
    let a_guide_1 = motor1_tube2a_guide_1.duplicate();
    let a_guide_2 = motor1_tube2a_guide_2.duplicate();
    let b_axis_1 = motor1_tube2b_axis_1.duplicate();
    let b_axis_2 = motor1_tube2b_axis_2.duplicate();
    let b_guide_1 = motor1_tube2b_guide_1.duplicate();
    let b_guide_2 = motor1_tube2b_guide_2.duplicate();
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor1_tube2_a', 'motor1_tube2_a', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1];

    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);

    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)*/
    
    let potential_source_tags = ['motor1_tube2_a', 'motor1_tube2_b'];
    let potential_target_tags = [tag_motor1_tube2_a, tag_motor1_tube2_b];
    let potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate()];
    

    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)*/
    
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0],a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
    if (source_tag_selection == "motor1_tube2_a") {
        geo.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        potential_axes[1].rotate(angle_B, axis_vector, a_axis_1.pointAt(0)); //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));}
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {potential_guides[0].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));}
    
    //Step 5B: Add Motor to target geometry
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];

    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    // console.log('Adding Motor 1');
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function motor2(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = motor2_geo.duplicate();
    let a_axis_1 = motor2_tube2a_axis_1.duplicate();
    let a_axis_2 = motor2_tube2a_axis_2.duplicate();
    let a_guide_1 = motor2_tube2a_guide_1.duplicate();
    let a_guide_2 = motor2_tube2a_guide_2.duplicate();
    let b_axis_1 = motor2_tube2b_axis_1.duplicate();
    let b_axis_2 = motor2_tube2b_axis_2.duplicate();
    let b_guide_1 = motor2_tube2b_guide_1.duplicate();
    let b_guide_2 = motor2_tube2b_guide_2.duplicate();
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor2_tube2_a', 'motor2_tube2_a', 'motor2_tube2_b', 'motor2_tube2_b'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2];

    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);    
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)*/
    
    let potential_source_tags = ['motor2_tube2_a', 'motor2_tube2_b'];
    let potential_target_tags = [tag_motor2_tube2_a, tag_motor2_tube2_b];
    let potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate()];
    
    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    Note that when the "motor" connection rotates around the target, the entire part and all axes/guides 
    will rotate with it. But we do NOT transform the source_guide, as we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/

    if (source_tag_selection == "motor2_tube2_a") {
        //Rotate around first axis
        let axis_vector = [potential_axes[0].pointAt(1)[0] - potential_axes[0].pointAt(0)[0], potential_axes[0].pointAt(1)[1] - potential_axes[0].pointAt(0)[1], potential_axes[0].pointAt(1)[2] - potential_axes[0].pointAt(0)[2]];
        geo.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        potential_axes[1].rotate(angle_B, axis_vector, a_axis_1.pointAt(0)); //First axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        potential_guides[1].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        //Rotate around second axis
        let axis_vector_2 = [potential_axes[1].pointAt(1)[0] - potential_axes[1].pointAt(0)[0], potential_axes[1].pointAt(1)[1] - potential_axes[1].pointAt(0)[1], potential_axes[1].pointAt(1)[2] - potential_axes[1].pointAt(0)[2]];
        potential_guides[1].rotate(angle_B, axis_vector_2, b_axis_1.pointAt(0));
    }
    else {
        //Rotate around first axis
        let axis_vector = [potential_axes[1].pointAt(1)[0] - potential_axes[1].pointAt(0)[0], potential_axes[1].pointAt(1)[1] - potential_axes[1].pointAt(0)[1], potential_axes[1].pointAt(1)[2] - potential_axes[1].pointAt(0)[2]];
        geo.rotate(angle_B, axis_vector, b_axis_1.pointAt(0));
        potential_axes[0].rotate(angle_B, axis_vector, b_axis_1.pointAt(0)); //Second axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].rotate(angle_B, axis_vector, b_axis_1.pointAt(0));
        potential_guides[1].rotate(angle_B, axis_vector, b_axis_1.pointAt(0));
        //Rotate around second axis
        let axis_vector_2 = [potential_axes[0].pointAt(1)[0] - potential_axes[0].pointAt(0)[0], potential_axes[0].pointAt(1)[1] - potential_axes[0].pointAt(0)[1], potential_axes[0].pointAt(1)[2] - potential_axes[0].pointAt(0)[2]];
        potential_guides[0].rotate(angle_B, axis_vector_2, a_axis_1.pointAt(0));
    }

    //Step 5B: Add Motor to target geometry
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    // console.log('Adding Motor 2');
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function motor3(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = motor3_geo.duplicate();
    let a_axis_1 = motor3_tube2a_axis_1.duplicate();
    let a_axis_2 = motor3_tube2a_axis_2.duplicate();
    let a_guide_1 = motor3_tube2a_guide_1.duplicate();
    let a_guide_2 = motor3_tube2a_guide_2.duplicate();
    let b_axis_1 = motor3_tube2b_axis_1.duplicate();
    let b_axis_2 = motor3_tube2b_axis_2.duplicate();
    let b_guide_1 = motor3_tube2b_guide_1.duplicate();
    let b_guide_2 = motor3_tube2b_guide_2.duplicate();
    let c_axis_1 = motor3_tube1_axis_1.duplicate();
    let c_axis_2 = motor3_tube1_axis_2.duplicate();
    let c_guide_1 = motor3_tube1_guide_1.duplicate();
    let c_guide_2 = motor3_tube1_guide_2.duplicate();
    
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor3_tube2_a', 'motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1];
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);    
    
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)*/
    
    let potential_source_tags = ['motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube1'];
    let potential_target_tags = [tag_motor3_tube2_a, tag_motor3_tube2_b, tag_motor3_tube1];
    let potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    
    
    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)*/
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0], a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
    if (source_tag_selection == "motor3_tube2_a") {
        geo.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));}
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {
        potential_guides[0].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
    }

    //Step 5B: Add Motor to target geometry
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    //console.log('Adding Motor 3');
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function motor4(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = motor4_geo.duplicate();
    let a_axis_1 = motor4_tube1a_axis_1.duplicate();
    let a_axis_2 = motor4_tube1a_axis_2.duplicate();
    let a_guide_1 = motor4_tube1a_guide_1.duplicate();
    let a_guide_2 = motor4_tube1a_guide_2.duplicate();
    let b_axis_1 = motor4_tube1b_axis_1.duplicate();
    let b_axis_2 = motor4_tube1b_axis_2.duplicate();
    let b_guide_1 = motor4_tube1b_guide_1.duplicate();
    let b_guide_2 = motor4_tube1b_guide_2.duplicate();
    let c_axis_1 = motor4_tube2_axis_1.duplicate();
    let c_axis_2 = motor4_tube2_axis_2.duplicate();
    let c_guide_1 = motor4_tube2_guide_1.duplicate();
    let c_guide_2 = motor4_tube2_guide_2.duplicate();
    
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor4_tube1_a', 'motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2'];
    let source_axes = [a_axis_2, a_axis_1, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1];
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);
    
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)*/
    
    let potential_source_tags = ['motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube2'];
    let potential_target_tags = [tag_motor4_tube1_a, tag_motor4_tube1_b, tag_motor4_tube2];
    let potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    
    
    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    
    Step 5A: Rotate Motor (and guides if necessary)*/
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0],a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
        
    if (source_tag_selection == "motor4_tube1_a") {
        geo.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++){potential_axes[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));}
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {potential_guides[0].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));}
    
    //Step 5B: Add Motor to target geometry
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    //console.log('Adding Motor 4');
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function motor5(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Hide Nib UI if enabled
    nib_UI_bool = false;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }    
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = motor5_geo.duplicate();
    let a_axis_1 = motor5_tube1a_axis_1.duplicate();
    let a_axis_2 = motor5_tube1a_axis_2.duplicate();
    let a_guide_1 = motor5_tube1a_guide_1.duplicate();
    let a_guide_2 = motor5_tube1a_guide_2.duplicate();
    let b_axis_1 = motor5_tube1b_axis_1.duplicate();
    let b_axis_2 = motor5_tube1b_axis_2.duplicate();
    let b_guide_1 = motor5_tube1b_guide_1.duplicate();
    let b_guide_2 = motor5_tube1b_guide_2.duplicate();
    let c_axis_1 = motor5_tube2_axis_1.duplicate();
    let c_axis_2 = motor5_tube2_axis_2.duplicate();
    let c_guide_1 = motor5_tube2_guide_1.duplicate();
    let c_guide_2 = motor5_tube2_guide_2.duplicate();
    
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor5_tube1_a', 'motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1];
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);    
    
    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)*/
    
    let potential_source_tags = ['motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube2'];
    let potential_target_tags = [tag_motor5_tube1_a, tag_motor5_tube1_b, tag_motor5_tube2];
    let potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
    let potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    
    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)*/
    
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0],a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/

    if (source_tag_selection == "motor5_tube1_a") {
        geo.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} 
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {potential_guides[0].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));}
    
    //Step 5B: Add Motor to target geometry
    let returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];
    
    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    // console.log('Adding Motor 5');
    part_list_output.push(geo);
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    //Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}


function nib(parts, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Enable Nib UI
    nib_UI_bool = true;
    nib_UI();

    try {
        if (typeof selection_list[count] == 'number') {
            selection_index = selection_list[count];
        }
        else {selection_index = 0;}
    }
    catch(err) {
        selection_index = 0;
    }
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let geo = nib_geo.duplicate();
    let sphere = nib_sphere.duplicate();
    let point = nib_pt.duplicate();
    let tube1_axis_1 = nib_tube1_axis_1.duplicate();
    let tube1_axis_2 = nib_tube1_axis_2.duplicate();
    let tube1_guide_1 = nib_tube1_guide_1.duplicate();
    let tube2_axis_1 = nib_tube2_axis_1.duplicate();
    let tube2_axis_2 = nib_tube2_axis_2.duplicate();
    let tube2_guide_1 = nib_tube2_guide_1.duplicate();
    let motors1_axis_1 = nib_motors1_axis_1.duplicate();
    let motors1_axis_2 = nib_motors1_axis_2.duplicate();
    let motors2_axis_1 = nib_motors2_axis_1.duplicate();
    let motors2_axis_2 = nib_motors2_axis_2.duplicate();
    let motors1_guide_1 = nib_motors1_guide_1.duplicate();
    let motors2_guide_1 = nib_motors2_guide_1.duplicate();
    
    nib_key = nib_item.toString();
    sphere.scale(nib_objects[nib_key]["weight"] / 3);

    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['nib_tube1_a', 'nib_tube1_b', 'nib_tube2_a', 'nib_tube2_b', 'nib_motors_1', 'nib_motors_1', 'nib_motors_2', 'nib_motors_2'];
    let source_axes = [tube1_axis_1, tube1_axis_2, tube2_axis_1, tube2_axis_2, motors1_axis_1, motors1_axis_2, motors2_axis_1, motors2_axis_2];
    let source_guides = [tube1_guide_1, tube1_guide_1, tube2_guide_1, tube2_guide_1, motors1_guide_1, motors1_guide_1, motors2_guide_1, motors2_guide_1];
    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)*/
    
    pair_list = generate_selection_pairs(source_tags, target_tags);

    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]];
    let source_guide = source_guides[source_target_pair[0]];
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1);
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1);
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1);
    
    /*Step 4. Enpty because Nibs don't add any new targets*/
    let potential_source_tags = [];
    let potential_target_tags = [];
    let potential_axes = [];
    let potential_guides = [];
    
    /*Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.*/

    let returned_point = orient3d(point, source_axis.duplicate(), source_guide.duplicate(), potential_axes, potential_guides, target_axis, target_guide); 
    point = returned_point[0];

    let returned_sphere = orient3d(sphere, source_axis.duplicate(), source_guide.duplicate(), potential_axes, potential_guides, target_axis, target_guide); 
    sphere = returned_sphere[0];

    let returned_objects = orient3d(geo, source_axis.duplicate(), source_guide.duplicate(), potential_axes, potential_guides, target_axis, target_guide);
    geo = returned_objects[0];
    potential_axes = returned_objects[1];
    potential_guides = returned_objects[2];

    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    Nibs don't add any new targets, so there's no need to iterate over the potential_source_tags for tags/axes/guides as with other parts.
    However, if Nib is placed in a Tube 2/3 inner position, then we have to remove the corresponding Tube 2/3 outer tag so that a Tube 1 
    can't be placed over it (but a Motor still could)*/
    
    // console.log('Adding Nib');
    part_list_output.push(geo);

    //Step 7: confirm target is Tube 2/3
    if (target_tag == "nib_tube2_a" || target_tag == "nib_tube2_b") {
    //Step 7B: confirm which outer tag is referenced (could be tube2_a, tube2_b, tube3_a, or tube3_b)
        if (target_tags[source_target_pair[1] - 1] == tag_tube2_a_outer || target_tags[source_target_pair[1] - 1] == tag_tube2_b_outer || target_tags[source_target_pair[1] - 1] == tag_tube3_a_outer || target_tags[source_target_pair[1] - 1] == tag_tube3_b_outer) {
            //Step 7C: define new target that removes tube1_outer as possible placement
            target_tags[source_target_pair[1] - 1] = "motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
        }
    }
    
    //Step 8: update nib object
    let current_angle = rotation_angle / 0.0175

    if (draw_bool == false) {
        //Update sphere
        nib_objects[nib_key]["sphere"] = sphere;
    }

    else if (draw_bool && play_count == 0) {
        //Create "points" value when Play button is pressed
        nib_objects[nib_key]["sphere"] = sphere;
        nib_objects[nib_key]["points"] = [point];    
    }

    else if (draw_bool && play_count > 0  && current_angle < 3701) {
        //Add additional points and Play continues
        /*If machine has made 10 full rotations (3600 degrees + 100 potential degrees from slider = 3700), 
        the lines being drawn are guaranteed to be complete, and there's no need to continue adding points 
        (the machine will still be allowed to rotate)*/
        nib_objects[nib_key]["sphere"] = sphere;
        nib_objects[nib_key]["points"].push(point);
    }

    nib_item += 1;
    
    // Create next block
    count += 1;
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
}