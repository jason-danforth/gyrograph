"use strict";

var scene, camera, renderer, controls;

// Need this to call RhinoCommon functions
// wait for the rhino3dm web assembly to load asynchronously
//This not originally commented out
//let rhino = null;

var options = {
    'backdrop' : 'true'
}
$('#basicModal').modal(options);

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
    // Limit framerate to boost performance
    // setTimeout( function() {
    //     requestAnimationFrame( animate );
    //     controls.update();
    //     renderer.render( scene, camera );
    //     TWEEN.update();
    //     camera.updateProjectionMatrix();
    // }, 1000 / 60 ); // 1000 / fps

    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
    TWEEN.update();
    camera.updateProjectionMatrix();
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
    let geometry = new THREE.Geometry();
    let domain = curve.domain;
    let start = domain[0];
    let range = domain[1] - domain[0];
    let max = 50.0;
    let interval = range / max;
    for (let i = 0; i < (max + 1); i++) {
        let t = start + i * interval;
        let pt = curve.pointAt(t);
        geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
    }
    return new THREE.Line(geometry, material);
}


function refine_pts(init_pts) {
    /*The lines created from the drawing machines are polylines, and for machines wil long arms,
    the points are far enough away that the straight segments of the lines are visible. This function
    creates intermediate points by converting the initial point list into a nurbs curve and adding 
    points between the initial points, and then returning that full list*/

    //Convert init_pts to PointList3d
    let init_pts_capacity = init_pts.length;
    let init_pts_array = new rhino.Point3dList(init_pts_capacity);
    for (let i = 0; i < init_pts.length; i++) {
        init_pts_array.add(init_pts[i].location[0], init_pts[i].location[1], init_pts[i].location[2]);
    }

    //Create initial curve
    let init_crv;
    if (init_pts.length <= 4) {
        init_crv = rhino.NurbsCurve.create(false, 1, init_pts_array);
    }
    else {
        init_crv = rhino.NurbsCurve.create(false, 3, init_pts_array);
    }
    let domain_end = init_crv.domain[1]

    //Initalize new list
    let new_pts = [];
    let new_pt_1;
    let new_pt_2;
    let new_pt_3;
    let new_pt_4;

    for (let i = 0; i < (domain_end ); i++) {
        //Create points at intermediate params
        new_pt_1 = new rhino.Point(init_crv.pointAt(i));
        new_pt_2 = new rhino.Point(init_crv.pointAt(i + 0.25));
        new_pt_3 = new rhino.Point(init_crv.pointAt(i + 0.5));
        new_pt_4 = new rhino.Point(init_crv.pointAt(i + 0.75));
        new_pts.push(new_pt_1);
        new_pts.push(new_pt_2);
        new_pts.push(new_pt_3);
        new_pts.push(new_pt_4);
    }

    new_pts.push(new rhino.Point(init_crv.pointAt(domain_end))); //Include end point
    return new_pts;
}


function axonView() {
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
    
    /*The unsolved problem is the camera rotates so 
    suddenly when changing to top view. This behavior can be seen if you change the
    duration to something huge like 10000 and are already in top view but with a 
    different rotation (in which case the rotation happens right away) or are in front 
    view (in which case the rotation happens after the position Tween). In either case,
    the rotation is still smooth, but it is MUCH faster than the change in position.
    The rotation happens solely because of the position tween, and note that what appears
    to be a 45 degree angle, is actually aligned with the x and y axes (the model is rotated)*/ 
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





//------------------------------------------Controls-------------------------------------------------------------------------------------------------------------------------------------

var colorWheel = new iro.ColorPicker("#colorWheel", {
    color: '#ffff00', //this value should match line_color
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
    //update color for last nib and redraw scene
    line_color = color.hexString;
    let num_nibs = Object.keys(nib_objects).length;
    let last_nib = num_nibs - 1;
    let last_index = last_nib.toString();
    nib_objects[last_index]['color'] = line_color;
    draw();
})

var sliderLineWeight = document.getElementById("lineWeightSlider");
sliderLineWeight.oninput = function() {
    /* Updating line weights for nibs is more complicated than updating colors, bc the sphere needs to be scaled
    and the only way to do that is to undo() and then add_part(nib) with new line weight. However, undo() will
    destory the lines if in Play mode (but paused), so we have to store those points and add them back to nib_objects */
    
    line_weight = this.value //Set thickness of lines
    let slider_thickness = line_weight.concat('px'); //Convet to "pixels"
    let slider_margin = (parseInt(14) - line_weight).toString().concat('px'); //.sliderLines.margin_bottom + 3 in style.css
    document.getElementById("lineWeightSlider").style.height = slider_thickness; //Update CSS property
    document.getElementById("lineWeightSlider").style.marginBottom = slider_margin; //Update CSS property

    //Find selection index, remove nib and recreate with updated line_weight
    let num_nibs = Object.keys(nib_objects).length;
    let last_nib = num_nibs - 1;
    let last_nib_index = last_nib.toString();
    let nib_points = nib_objects[last_nib_index]['points'];

    let num_parts = Object.keys(parts).length;
    let last_part = num_parts - 1;
    let last_part_index = last_part.toString();
    let last_selection_index = parts[last_part_index]['selection_index'];
    
    undo();
    nib_creation();
    add_part('Nib', last_selection_index);
    nib_objects[last_nib_index]['points'] = nib_points;
    draw();
}

// Scroll Bar https://jamesflorentino.github.io/nanoScrollerJS/
function activateScroll() {
    $(".nano").nanoScroller();
}


// These values represent the speed at which the tube 2/3 motors rotate relative to tube 1 motors
// The values will be divided by 100, so 100 = 1x speed, 1.5 = 1.5x speed, etc. 
// JQuery doesn't seem to like dealing with floats, so x100 to create integers

var dotsValue = [100, 120, 125, 133, 150, 180, 195, 200];

$.fn.roundSlider.prototype.defaults.create = function() {
  let dotsCount = dotsValue.length;

  let o = this.options, tickInterval = 0.01;
  let min = o.max, max = o.min;
  for (let i = 0; i < dotsCount; i += 1) {
    let value = dotsValue[i];
    let angle = this._valueToAngle(value);
    let numberTag = this._addSeperator(angle, "");
    let number = numberTag.children().removeClass();
    let dot = number.clone();

    dot.addClass("rs-dots").attr("data-value", value).appendTo(numberTag);
  }

  this.control.find(".rs-dots").click((e) => {
    if (this.options.disabled) return;
    let dotValue = $(e.currentTarget).attr("data-value");
    this.setValue(dotValue);
  });
}


// Circular slider from here: https://www.npmjs.com/package/round-slider
// Code above is based on this js fiddle: https://jsfiddle.net/soundar24/Ln09a2uc/5/    
$("#circularSlider").roundSlider({
    sliderType: "default",
    showTooltip: true,
    editableTooltip: true,
    radius: 70,
    width: 2,
    handleSize: "+13",
    readOnly: false,
    min: 100,
    max: 200,
    startValue: 0,
    value: 200,
    startAngle: 180,
    endAngle: "+340",
    tooltipFormat: function (e) {
        let prefix = "x ";
        return prefix.concat((e.value / 100).toFixed(2));
      },
    // events
    valueChange: function (e) {
        update_angle_factor_B(e.value / 100);
    },
    // SVG related properties
    svgMode: true,
    borderWidth: 0,
    borderColor: null,
    pathColor: '#ffffff',
    rangeColor: '#ffffff',
    circleShape: "full",
    handleShape: "dot",
    lineCap: "round",
    tooltipColor: '#ffffff'
});


function update_angle_factor_B(value) {
    angle_factor_B = value;
}





//------------------------------------------Animate-------------------------------------------------------------------------------------------------------------------------------------


function run() {
    //Animation loop is always running
    //In in Play mode, geometry updates and rotates, and lines are drawn
    //If not in Play mode, rotation arrows rotate around motors
    renderer.setAnimationLoop( function () {       
        if (play_bool) {            
            count = 0; //reset on each loop for iterating over parts{}
            rotation_angle = rotation_increment * 0.0174533; //Convert angle from degrees to radians
            angle_A = rotation_angle * angle_factor_A;
            angle_B = rotation_angle * angle_factor_B;         
            draw(); 
            renderer.render( scene, camera );
            play_count += 1;
        }
        else {
            //Remove rotation curves from scene
            for (let i=0; i<scene.children.length; i++) {
                if (scene.children[i].type == 'Line') {
                    scene.remove(scene.children[i]);
                    i = i-1;
                }    
            } 
            //Update rotation curves and add to scene
            let rot_crv_angle
            for (const [key, value] of Object.entries(parts)) {
                if (parts[key]['name'] == 'Motor 1' || parts[key]['name'] == 'Motor 2' || parts[key]['name'] == 'Motor 3') {
                    rot_crv_angle = 0.0174533 * (angle_factor_B ** 2);
                }
                else {
                    rot_crv_angle = 0.0174533 * angle_factor_A;
                }

                if (parts[key]['rot_crv']) {
                    for (let i=0; i<parts[key]['rot_crv'].length; i++) {
                        let rot_crv = parts[key]['rot_crv'][i];
                        let rot_axis = parts[key]['rot_axes'][i];
                        let rot_vec =  [rot_axis.pointAt(1)[0] - rot_axis.pointAt(0)[0], rot_axis.pointAt(1)[1] - rot_axis.pointAt(0)[1], rot_axis.pointAt(1)[2] - rot_axis.pointAt(0)[2]];
                        rot_crv.rotate(rot_crv_angle, rot_vec, rot_axis.pointAt(0));

                        let curve = curveToLineSegments(rot_crv, curve_material);
                        scene.add(curve);           
                    } 
                }
            }
        }
    })
}


function play() {
    freeze_src(); //Disable all buttons other than play/pause/reset
    play_bool = true;
}


function pause() {
    play_bool = false;
}


function stop() {
    $("#circularSlider").roundSlider("enable"); //enable slider
    document.getElementById("circularSlider").classList.remove("circularUnavailable");
    document.getElementById("circularSlider").classList.add("circularAvailable");
    update_src(); //enable all other buttons;

    //Remove lines
    for (let i=0; i<Object.keys(nib_objects).length; i++) {nib_objects[i].points = [];}

    play_bool = false;
    play_count = 0;
    draw();
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
    let nib_index = (Object.keys(nib_objects).length).toString();
    nib_objects[nib_index] = {"sphere": "",
                            "color": line_color,
                            "weight": line_weight,
                            "points": []
                            }    
}


function undo() {    
    //Remove most recently added part
    let num_parts = Object.keys(parts).length;

    let last_num = num_parts - 1;
    let last_index = last_num.toString();
    let last_part_name = parts[last_index]['name'];
    
    //If removing a Nib then need to remove it from nib_objects too
    if (last_part_name == "Nib") {
        let last_nib = Object.keys(nib_objects).length - 1;
        delete nib_objects[last_nib];
        nib_item -= 1;
    }

    //If new last part is nib then enable nib_UI, otherwise disable
    let new_last_name = parts[(last_num -1).toString()].name;
    if (new_last_name == "Nib") {
        nib_UI_bool = true;
        nib_UI();            
    }
    else {
        nib_UI_bool = false;
        nib_UI();
    } 

    delete parts[last_index];
    count -= 1;
    
    if (Object.keys(parts).length < 2) {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconUnavailable";
        element_undo.setAttribute( "onClick", " " );
    }

    draw();
}


function next() {
    //Update selection index for most recently added part, remove it, and add it back
    let num_parts = Object.keys(parts).length;

    let last_num = num_parts - 1;
    let last_index = last_num.toString();
    let last_part_name = parts[last_index]['name'];
    let last_selection_index = parts[last_index]['selection_index'];
    let new_selection_index = last_selection_index + 1;

    if (last_part_name == 'Nib') {nib_item -= 1};
    
    delete parts[last_index];
    count -= 1;

    add_part(last_part_name, new_selection_index);
    
    if (Object.keys(parts).length < 2) {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconUnavailable";
        element_undo.setAttribute( "onClick", " " );
    }

    draw();
  }


function previous() {
    //Update selection index for most recently added part, remove it, and add it back
    let num_parts = Object.keys(parts).length;

    let last_num = num_parts - 1;
    let last_index = last_num.toString();
    let last_part_name = parts[last_index]['name'];
    let last_selection_index = parts[last_index]['selection_index'];
    let new_selection_index;

    if (last_selection_index != 0) {new_selection_index = last_selection_index - 1;}
    else {new_selection_index = pair_list.length - 1;} //Pair list will be defined by the last part function run

    if (last_part_name == 'Nib') {nib_item -= 1};

    delete parts[last_index];
    count -= 1;

    add_part(last_part_name, new_selection_index);
    
    if (Object.keys(parts).length < 2) {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconUnavailable";
        element_undo.setAttribute( "onClick", " " );
    }

    draw();
  }


function clear_scene() {
    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if ((scene.children[i].type == 'Mesh') || (scene.children[i].type == 'Line') || (scene.children[i].type == 'Line2')) {
            scene.remove(scene.children[i]);
            i = i-1;
        }    
    } 
}


function addToScene(geo) {
    let threeMesh = meshToThreejs(geo, meshMaterial);
    threeMesh.castShadow = true;
    threeMesh.receiveShadow = true;
    scene.add(threeMesh);
}


function draw() {    
    /* If machine is in play mode (play_bool = true) then update the positions everytime draw() is called,
    i.e. every degree of rotation. If not in play mode, then update_src to allow user to add the next part. */
    if (play_bool) {
        //Reset Nib
        nib_item = 0;
        //Update position of each part in the machine by itearting over parts{} and calling add_part(part.name, part.selection_index)
        for (const [key, value] of Object.entries(parts)) {            
            selection_index = parts[key]['selection_index'];
            add_part(parts[key]['name'], selection_index);
        }
    }

    // Add new geometry to threejs scene
    clear_scene(); // Clear previous geometry from threejs scene
    for (const [key, value] of Object.entries(parts)) {
        parts[key]['geo'].forEach(addToScene);
        if (parts[key]['rot_crv']) {
            for (let i=0; i<parts[key]['rot_crv'].length; i++) {
                let curve = curveToLineSegments(parts[key]['rot_crv'][i], curve_material);
                scene.add(curve);           
            } 
        }
    }

    //Draw nibs + lines
    for (let i=0; i<Object.keys(nib_objects).length; i++) {
        let nib_index = i.toString();
        let nib_color;

        if (nib_objects[nib_index]['color']) {
            nib_color = nib_objects[nib_index]['color'];
        }
        else {nib_color = line_color;}

        let nibMaterial = new THREE.MeshBasicMaterial({color: nib_color});
        let geo = nib_objects[nib_index]['sphere'];        
        let threeMesh = meshToThreejs(geo, nibMaterial);
        scene.add(threeMesh);

        let points = [...nib_objects[nib_index]['points']];

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

            if (points.length > 2) { points = refine_pts(points); }

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
    if (Object.keys(parts).length > 1) {
        let element_undo = document.getElementById("undo");
        element_undo.className = "iconAvailable"; //Change to CSS class with hover 
        element_undo.setAttribute( "onClick", "undo(), update_src()" );

        let element_previous = document.getElementById("previous");
        element_previous.className = "iconAvailable"; //Change to CSS class with hover 
        element_previous.setAttribute( "onClick", "previous()" );
    
        let element_next = document.getElementById("next");
        element_next.className = "iconAvailable"; //Change to CSS class with hover 
        element_next.setAttribute( "onClick", "next()" );
    }

    //Iterate over target_tags and update icons base on whether or not they are available (i.e. in target_tags)
    let current_count = (count - 1).toString();
    let target_tags = parts[current_count]['target_tags'];

    let tag_set = new Set();
    for (let i=0; i<target_tags.length; i++) {
        let individual_tags = target_tags[i].split(", ");
        for (let j=0; j<individual_tags.length; j++) {
            tag_set.add(individual_tags[j].split("_")[0]);
        }
    }

    if (tag_set.has("tube1")) {
        let element = document.getElementById("tube1");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Tube 1', 0), update_src()" );
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
        element1.setAttribute( "onClick", "add_part('Tube 2', 0), update_src()" );

        let element2 = document.getElementById("tube3");
        element2.className = "iconAvailable"; //Change to CSS class with hover 
        element2.setAttribute( "onClick", "add_part('Tube 3', 0), update_src()" );
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
        element.setAttribute( "onClick", "add_part('Motor 1', 0), update_src()" );
    }
    else {
        let element = document.getElementById("motor1");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor2")) {
        let element = document.getElementById("motor2");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 2', 0), update_src()" );
    }
    else {
        let element = document.getElementById("motor2");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }

    if (tag_set.has("motor3")) {
        let element = document.getElementById("motor3");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 3', 0), update_src()" );
    }
    else {
        let element = document.getElementById("motor3");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor4")) {
        let element = document.getElementById("motor4");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 4', 0), update_src()" );
    }
    else {
        let element = document.getElementById("motor4");
        element.className = "iconUnavailable";
        element.onclick = "";
    }

    if (tag_set.has("motor5")) {
        let element = document.getElementById("motor5");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "add_part('Motor 5', 0), update_src()" );
    }
    else {
        let element = document.getElementById("motor5");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }

    if (tag_set.has("nib") && Object.keys(parts).length > 1) {
        let element = document.getElementById("nib");
        element.className = "iconAvailable"; //Change to CSS class with hover 
        element.setAttribute( "onClick", "nib_creation(); add_part('Nib', 0), update_src()" );
    }
    else {
        let element = document.getElementById("nib");
        element.className = "iconUnavailable"; 
        element.onclick = "";
    }
}


function freeze_src() {
    //Turn off all controls during play / pause / reset

    //Disable circular slider
    $("#circularSlider").roundSlider("disable");
    document.getElementById("circularSlider").classList.remove("circularAvailable");
    document.getElementById("circularSlider").classList.add("circularUnavailable");

    //Make pause and reset buttons available
    let element_pause = document.getElementById("pause");
    element_pause.className = "iconAvailable";
    element_pause.setAttribute( "onClick", "pause()" );

    let element_reset = document.getElementById("reset");
    element_reset.className = "iconAvailable";
    element_reset.setAttribute( "onClick", "stop()" );


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


function add_part(part_name, selection_index) {
    if (part_name == "Base") {
        base(0);
    }
    else if (part_name == "Tube 1") {
        tube1(selection_index);
    }
    else if (part_name == "Tube 2") {
        tube2(selection_index);
    }        
    else if (part_name == "Tube 3") {
        tube3(selection_index);
    }
    else if (part_name == "Motor 1") {
        motor1(selection_index);
    }        
    else if (part_name == "Motor 2") {
        motor2(selection_index);
    }
    else if (part_name == "Motor 3") {
        motor3(selection_index);
    }
    else if (part_name == "Motor 4") {
        motor4(selection_index);
    }
    else if (part_name == "Motor 5") {
        motor5(selection_index);
    }
    else if (part_name == "Nib") {
        nib(selection_index);
    }

    /*When adding parts from the UI, draw() will always be called after add_part()
    When in play mode (i.e. play_bool = true) add_part() will be called from within draw()
    as we iterate over parts{} to update part positions on every degree of rotation */
    if (play_bool) {}
    else {
        draw();
    }
}

function generate_selection_pairs(source_tags, target_tags) {
    //Generate list of tuples containing indices for all permutations of available source/target pairs
    pair_list = []
    
    for (let i=0; i<target_tags.length; i++) {
        for (let j=0; j<source_tags.length; j++) {
            if (target_tags[i].split(", ").includes(source_tags[j])) {
                pair_list.push([j, i]);
            }
        }
    }    
   
    return pair_list;
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

function orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides) {
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

    for (let i=0; i<geo_to_orient.length; i++) {geo_to_orient[i].rotate(angle_1, cross_product, source_axis.pointAt(0))};
    source_axis.rotate(angle_1, cross_product, source_axis.pointAt(0));
    source_guide.rotate(angle_1, cross_product, source_axis.pointAt(0));
    for (let i=0; i<source_axes.length; i++) {source_axes[i].rotate(angle_1, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<source_guides.length; i++) {source_guides[i].rotate(angle_1, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_1, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_1, cross_product, source_axis.pointAt(0));}
    
    
    //Step 2: move the source geometry to the target geometry
    let movement = [target_axis.pointAt(0)[0] - source_axis.pointAt(0)[0], target_axis.pointAt(0)[1] - source_axis.pointAt(0)[1], target_axis.pointAt(0)[2] - source_axis.pointAt(0)[2]];
    for (let i=0; i<geo_to_orient.length; i++) {geo_to_orient[i].translate(movement)};
    source_axis.translate(movement);
    source_guide.translate(movement);
    for (let i=0; i<source_axes.length; i++) {source_axes[i].translate(movement);} 
    for (let i=0; i<source_guides.length; i++) {source_guides[i].translate(movement);} 
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

    if (angle_2.toFixed(10) == 3.14159 && Math.abs(cross_sum.toFixed(10)) == 0) {
        cross_product = [source_axis.pointAt(1)[0] - source_axis.pointAt(0)[0], source_axis.pointAt(1)[1] - source_axis.pointAt(0)[1], source_axis.pointAt(1)[2] - source_axis.pointAt(0)[2]];
    }

    for (let i=0; i<geo_to_orient.length; i++) {geo_to_orient[i].rotate(angle_2, cross_product, source_axis.pointAt(0))};
    for (let i=0; i<source_axes.length; i++) {source_axes[i].rotate(angle_2, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<source_guides.length; i++) {source_guides[i].rotate(angle_2, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_2, cross_product, source_axis.pointAt(0));} 
    for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_2, cross_product, source_axis.pointAt(0));}
    
    
    //No point in returning source_axis and source_guide b/c they aren't needed anymore
    let return_objects = [geo_to_orient, source_axes, source_guides, potential_axes, potential_guides];
    return return_objects;
}







//------------------------------------------Drawing Machine Parts-------------------------------------------------------------------------------------------------------------------------------------

function base(selection_index) {
    let sphere;
    let tube;
    let axis;
    let guide;
    let rot_crv;
    
    if (play_bool) {
        //Reuse geometry
        sphere = parts['0']['geo'][0];
        tube = parts['0']['geo'][1];
        axis = parts['0']['source_axes'][0];
        guide = parts['0']['source_guides'][0];
        rot_crv = parts['0']['rot_crv'][0];
    }
    else {
        //Add object to parts
        parts['0'] = {'name': 'Base'};
        
        //Define geometry
        sphere = base_sphere.duplicate();
        tube = base_tube.duplicate();
        axis = base_axis.duplicate();
        guide = base_guide.duplicate();
        rot_crv = base_rotationCurve.duplicate();
    }

    //Transform
    let pt1 = axis.pointAt(1);
    let pt2 = axis.pointAt(0.5);
    let axis_vector = [pt1[0] - pt2[0], pt1[1] - pt2[1], pt1[2] - pt2[2]];
    
    tube.rotate(angle_A, axis_vector, pt1);
    axis.rotate(angle_A, axis_vector, pt1);
    guide.rotate(angle_A, axis_vector, pt1);
    rot_crv.rotate(rotation_angle, axis_vector, pt1);
    
    parts['0']['selection_index'] = 0;
    parts['0']['geo'] = [sphere, tube];
    parts['0']['rot_crv'] = [rot_crv];
    parts['0']['rot_axes'] = [axis];

    parts['0']['source_axes'] = [axis];
    parts['0']['source_guides'] = [guide];

    parts['0']['target_axes'] = [axis, axis.duplicate()];
    parts['0']['target_guides'] = [guide, guide.duplicate()];
    parts['0']['target_tags'] = [tag_tube1_a_outer, tag_tube1_a_inner];

    count += 1;
}


function tube1(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/

    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_guide_1;
    let b_axis_1;
    let b_guide_1;

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        b_axis_1 = parts[parts_count]['source_axes'][1];
        b_guide_1 = parts[parts_count]['source_guides'][1];
    }
    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Tube 1'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = tube1_geo.duplicate();
        a_axis_1 = tube1_a_axis_1.duplicate();
        a_guide_1 = tube1_a_guide_1.duplicate();
        b_axis_1 = tube1_b_axis_1.duplicate();
        b_guide_1 = tube1_b_guide_1.duplicate();
    }
    


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
    let source_axes = [a_axis_1, a_axis_1.duplicate(), b_axis_1, b_axis_1.duplicate()];
    let source_guides = [a_guide_1, a_guide_1.duplicate(), b_guide_1, b_guide_1.duplicate()];

    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];
    

    
    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides.*/
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    
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
    let geo_to_orient = [geo];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    

    
    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = [source_axes[0], source_axes[2]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[2]];
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;

    count += 1;
}


function tube2(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let parts_count = count.toString();
    
    let geo;
    let a_axis_1;
    let a_guide_1;
    let mid_axis_1;
    let mid_guide_1;
    let b_axis_1;
    let b_guide_1;

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        mid_axis_1 = parts[parts_count]['source_axes'][1];
        b_axis_1 = parts[parts_count]['source_axes'][2];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        mid_guide_1 = parts[parts_count]['source_guides'][1];
        b_guide_1 = parts[parts_count]['source_guides'][2];
    }
    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Tube 2'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = tube2_geo.duplicate();
        a_axis_1 = tube2_a_axis_1.duplicate();
        b_axis_1 = tube2_b_axis_1.duplicate();
        mid_axis_1 = tube2_mid_axis_1.duplicate();
        a_guide_1 = tube2_a_guide_1.duplicate();
        b_guide_1 = tube2_b_guide_1.duplicate();
        mid_guide_1 = tube2_mid_guide_1.duplicate();
    }


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
    
    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides.*/
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    


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
    let geo_to_orient = [geo];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    


    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = source_axes;
    parts[parts_count]['source_guides'] = source_guides;
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;

    count += 1;
}


function tube3(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (part_list_output/tags/axes/guides)*/
    
    //Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_guide_1;
    let a_guide_2;
    let a_guide_3;
    let a_guide_4;
    let b_axis_1;
    let b_guide_1;
    let b_guide_2;
    let b_guide_3;
    let b_guide_4;

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        a_guide_2 = parts[parts_count]['source_guides'][1];
        a_guide_3 = parts[parts_count]['source_guides'][2];
        a_guide_4 = parts[parts_count]['source_guides'][3];
        b_axis_1 = parts[parts_count]['source_axes'][4];
        b_guide_1 = parts[parts_count]['source_guides'][4];
        b_guide_2 = parts[parts_count]['source_guides'][5];
        b_guide_3 = parts[parts_count]['source_guides'][6];
        b_guide_4 = parts[parts_count]['source_guides'][7];
    }
    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Tube 3'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = tube3_geo.duplicate();
        a_axis_1 = tube3_a_axis_1.duplicate();
        a_guide_1 = tube3_a_guide_1.duplicate();
        a_guide_2 = tube3_a_guide_2.duplicate();
        a_guide_3 = tube3_a_guide_3.duplicate();
        a_guide_4 = tube3_a_guide_4.duplicate();
        b_axis_1 = tube3_b_axis_1.duplicate();
        b_guide_1 = tube3_b_guide_1.duplicate();
        b_guide_2 = tube3_b_guide_2.duplicate();
        b_guide_3 = tube3_b_guide_3.duplicate();
        b_guide_4 = tube3_b_guide_4.duplicate();
    }
    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    let source_tags = ['tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer'];
    let source_axes = [a_axis_1, a_axis_1.duplicate(), a_axis_1.duplicate(), a_axis_1.duplicate(), b_axis_1, b_axis_1.duplicate(), b_axis_1.duplicate(), b_axis_1.duplicate()];
    let source_guides = [a_guide_1, a_guide_2, a_guide_3, a_guide_4, b_guide_1, b_guide_2, b_guide_3, b_guide_4];

    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    /*Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides.*/
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    


    /*Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All items with "potential_" prefix are used to define the new targets on the new part once it is placed in position.
    The naming conventions are super confusing, bc these are all "targets", but even targets need a source_tag (recall that the 
    source tag is the name of the placement and the target tag is the name of all the geometry that can be placed there).
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
    let geo_to_orient = [geo];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    


    /*Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = source_axes;
    parts[parts_count]['source_guides'] = source_guides;
    
    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }

    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;

    count += 1;
}


function motor1(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
        
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_axis_2;
    let a_guide_1;
    let a_guide_2;
    let b_axis_1;
    let b_axis_2;
    let b_guide_1;
    let b_guide_2;
    let rot_crv;
    let potential_axes;
    let potential_guides;
    let potential_source_tags = ['motor1_tube2_a', 'motor1_tube2_b'];
    let potential_target_tags = [tag_motor1_tube2_a, tag_motor1_tube2_b];

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        // a_axis_2 = parts[parts_count]['source_axes'][1];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        // a_guide_2 = parts[parts_count]['source_guides'][1];
        // b_axis_1 = parts[parts_count]['source_axes'][2];
        b_axis_2 = parts[parts_count]['source_axes'][1];
        b_guide_1 = parts[parts_count]['source_guides'][1];
        // b_guide_2 = parts[parts_count]['source_guides'][3];
        rot_crv = parts[parts_count]['rot_crv'][0];

        /* Define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
        All of this geometry will be transformed according to the selected source/target geometry. This is because it needs to track
        with the rotated geometry. Note that the .duplicate() method is necessary to avoid Transforms on the same geometry. We need 
        potential_source_tags and potential_target_tags for the final step. In the case of Motor1, there are 2 potential targets: 
        a (with motor) and b (without)*/    
        potential_axes = parts[parts_count]['potential_axes'];
        potential_guides = parts[parts_count]['potential_guides'];
    }

    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Motor 1'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = motor1_geo.duplicate();
        a_axis_1 = motor1_tube2a_axis_1.duplicate();
        a_axis_2 = motor1_tube2a_axis_2.duplicate();
        a_guide_1 = motor1_tube2a_guide_1.duplicate();
        a_guide_2 = motor1_tube2a_guide_2.duplicate();
        b_axis_1 = motor1_tube2b_axis_1.duplicate();
        b_axis_2 = motor1_tube2b_axis_2.duplicate();
        b_guide_1 = motor1_tube2b_guide_1.duplicate();
        b_guide_2 = motor1_tube2b_guide_2.duplicate();
        rot_crv = motor1_rotationCurve.duplicate();

        potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate()];
    }

    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    // let source_tags = ['motor1_tube2_a', 'motor1_tube2_a', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b'];
    // let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1.duplicate(), b_axis_2.duplicate()];
    // let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2.duplicate(), b_guide_1.duplicate()];

    let source_tags = ['motor1_tube2_a', 'motor1_tube2_b'];
    let source_axes = [a_axis_1, b_axis_2];
    let source_guides = [a_guide_1, b_guide_1];

    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    

    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 4A: Rotate Motor (and guides if necessary)*/

    let new_axis = a_axis_1;
    let new_axis_vector = [new_axis.pointAt(1)[0] - new_axis.pointAt(0)[0], new_axis.pointAt(1)[1] - new_axis.pointAt(0)[1], new_axis.pointAt(1)[2] - new_axis.pointAt(0)[2]];
    
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/

    if (source_tag_selection == "motor1_tube2_a") {
        geo.rotate(angle_B, new_axis_vector, new_axis.pointAt(0));
        rot_crv.rotate(angle_B, new_axis_vector, new_axis.pointAt(0));
        // rot_curve.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        potential_axes[1].rotate(angle_B, new_axis_vector, new_axis.pointAt(0)); //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_B, new_axis_vector, new_axis.pointAt(0));}
    }

    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {
        potential_guides[0].rotate(angle_B, new_axis_vector, new_axis.pointAt(0));
        rot_crv.rotate(angle_B, new_axis_vector, new_axis.pointAt(0));
    }
    
    //Step 4B: Add Motor to target geometry
    let geo_to_orient = [geo, rot_crv];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);


    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    // parts[parts_count]['source_axes'] = [source_axes[0], source_axes[1], source_axes[2], source_axes[3]];
    // parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1], source_guides[2], source_guides[3]];
    parts[parts_count]['source_axes'] = [source_axes[0], source_axes[1]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1]];
    parts[parts_count]['potential_axes'] = potential_axes;
    parts[parts_count]['potential_guides'] = potential_guides;
    parts[parts_count]['rot_crv'] = [rot_crv];
    parts[parts_count]['rot_axes'] = [a_axis_1];

    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;

    count += 1;
}


function motor2(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
        
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_axis_2;
    let a_guide_1;
    let a_guide_2;
    let b_axis_1;
    let b_axis_2;
    let b_guide_1;
    let b_guide_2;
    let rot_crv_1;
    let rot_crv_2;
    let rot_axis_1;
    let rot_axis_2;
    let potential_axes;
    let potential_guides;
    let potential_source_tags = ['motor2_tube2_a', 'motor2_tube2_b'];
    let potential_target_tags = [tag_motor2_tube2_a, tag_motor2_tube2_b];

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_axis_2 = parts[parts_count]['source_axes'][1];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        a_guide_2 = parts[parts_count]['source_guides'][1];
        // b_axis_1 = parts[parts_count]['source_axes'][2];
        // b_axis_2 = parts[parts_count]['source_axes'][3];
        // b_guide_1 = parts[parts_count]['source_guides'][2];
        // b_guide_2 = parts[parts_count]['source_guides'][3];
        rot_crv_1 = parts[parts_count]['rot_crv'][0];
        rot_crv_2 = parts[parts_count]['rot_crv'][1];
        rot_axis_1 = parts[parts_count]['rot_axes'][0];
        rot_axis_2 = parts[parts_count]['rot_axes'][1];

        /* Define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
        All of this geometry will be transformed according to the selected source/target geometry. This is because it needs to track
        with the rotated geometry. Note that the .duplicate() method is necessary to avoid Transforms on the same geometry. We need 
        potential_source_tags and potential_target_tags for the final step. In the case of Motor1, there are 2 potential targets: 
        a (with motor) and b (without)*/    
        potential_axes = parts[parts_count]['potential_axes'];
        potential_guides = parts[parts_count]['potential_guides'];
    }

    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Motor 2'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = motor2_geo.duplicate();
        a_axis_1 = motor2_tube2a_axis_1.duplicate();
        a_axis_2 = motor2_tube2a_axis_2.duplicate();
        a_guide_1 = motor2_tube2a_guide_1.duplicate();
        a_guide_2 = motor2_tube2a_guide_2.duplicate();
        b_axis_1 = motor2_tube2b_axis_1.duplicate();
        b_axis_2 = motor2_tube2b_axis_2.duplicate();
        b_guide_1 = motor2_tube2b_guide_1.duplicate();
        b_guide_2 = motor2_tube2b_guide_2.duplicate();
        rot_crv_1 = motor2_rotationCurve_1.duplicate();
        rot_crv_2 = motor2_rotationCurve_2.duplicate();
        rot_axis_1 = b_axis_1.duplicate();
        rot_axis_2 = a_axis_1.duplicate();

        potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate()];
    }



    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    // let source_tags = ['motor2_tube2_a', 'motor2_tube2_a', 'motor2_tube2_b', 'motor2_tube2_b'];
    // let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2];
    // let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2];

    let source_tags = ['motor2_tube2_a', 'motor2_tube2_a'];
    let source_axes = [a_axis_1, a_axis_2];
    let source_guides = [a_guide_1, a_guide_2];

    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again


    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    
    Step 4A: Rotate Motor (and guides if necessary)
    Note that when the "motor" connection rotates around the target, the entire part and all axes/guides 
    will rotate with it. But we do NOT transform the source_guide, as we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/

    let axis_vector_1 = [potential_axes[0].pointAt(1)[0] - potential_axes[0].pointAt(0)[0], potential_axes[0].pointAt(1)[1] - potential_axes[0].pointAt(0)[1], potential_axes[0].pointAt(1)[2] - potential_axes[0].pointAt(0)[2]];
    let axis_vector_2 = [potential_axes[1].pointAt(1)[0] - potential_axes[1].pointAt(0)[0], potential_axes[1].pointAt(1)[1] - potential_axes[1].pointAt(0)[1], potential_axes[1].pointAt(1)[2] - potential_axes[1].pointAt(0)[2]];

    if (source_tag_selection == "motor2_tube2_a") {
        //Rotate around first axis
        geo.rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        rot_crv_1.rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        rot_crv_2.rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        rot_axis_1.rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        rot_axis_2.rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        potential_axes[1].rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0)); //First axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        potential_guides[1].rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
        //Rotate around second axis
        potential_guides[1].rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
    }
    else {
        //Rotate around first axis
        geo.rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        rot_crv_1.rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        rot_crv_2.rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        rot_axis_1.rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        rot_axis_2.rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        potential_axes[0].rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0)); //Second axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        potential_guides[1].rotate(angle_B, axis_vector_2, potential_axes[1].pointAt(0));
        //Rotate around second axis
        potential_guides[0].rotate(angle_B, axis_vector_1, a_axis_1.pointAt(0));
    }

    //Step 4B: Add Motor to target geometry
    let geo_to_orient = [geo, rot_crv_1, rot_crv_2, rot_axis_1, rot_axis_2];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);

    
    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = [source_axes[0], source_axes[1]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1]];
    parts[parts_count]['potential_axes'] = potential_axes;
    parts[parts_count]['potential_guides'] = potential_guides;
    parts[parts_count]['rot_crv'] = [rot_crv_1, rot_crv_2];
    parts[parts_count]['rot_axes'] = [rot_axis_1, rot_axis_2];

    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;

    count += 1;
}


function motor3(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/

    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_axis_2;
    let a_guide_1;
    let a_guide_2;
    let b_axis_1;
    let b_axis_2;
    let b_guide_1;
    let b_guide_2;
    let c_axis_1;
    let c_axis_2;
    let c_guide_1;
    let c_guide_2;
    let rot_crv;
    let potential_axes;
    let potential_guides;
    let potential_source_tags = ['motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube1'];
    let potential_target_tags = [tag_motor3_tube2_a, tag_motor3_tube2_b, tag_motor3_tube1];
    
    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_axis_2 = parts[parts_count]['source_axes'][1];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        a_guide_2 = parts[parts_count]['source_guides'][1];
        b_axis_1 = parts[parts_count]['source_axes'][2];
        b_axis_2 = parts[parts_count]['source_axes'][3];
        b_guide_1 = parts[parts_count]['source_guides'][2];
        b_guide_2 = parts[parts_count]['source_guides'][3];
        c_axis_1 = parts[parts_count]['source_axes'][4];
        c_axis_2 = parts[parts_count]['source_axes'][5];
        c_guide_1 = parts[parts_count]['source_guides'][4];
        c_guide_2 = parts[parts_count]['source_guides'][5];
        rot_crv = parts[parts_count]['rot_crv'][0];

        /* Define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
        All of this geometry will be transformed according to the selected source/target geometry. This is because it needs to track
        with the rotated geometry. Note that the .duplicate() method is necessary to avoid Transforms on the same geometry. We need 
        potential_source_tags and potential_target_tags for the final step. In the case of Motor1, there are 2 potential targets: 
        a (with motor) and b (without)*/    
        potential_axes = parts[parts_count]['potential_axes'];
        potential_guides = parts[parts_count]['potential_guides'];
    }

    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Motor 3'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = motor3_geo.duplicate();
        a_axis_1 = motor3_tube2a_axis_1.duplicate();
        a_axis_2 = motor3_tube2a_axis_2.duplicate();
        a_guide_1 = motor3_tube2a_guide_1.duplicate();
        a_guide_2 = motor3_tube2a_guide_2.duplicate();
        b_axis_1 = motor3_tube2b_axis_1.duplicate();
        b_axis_2 = motor3_tube2b_axis_2.duplicate();
        b_guide_1 = motor3_tube2b_guide_1.duplicate();
        b_guide_2 = motor3_tube2b_guide_2.duplicate();
        c_axis_1 = motor3_tube1_axis_1.duplicate();
        c_axis_2 = motor3_tube1_axis_2.duplicate();
        c_guide_1 = motor3_tube1_guide_1.duplicate();
        c_guide_2 = motor3_tube1_guide_2.duplicate();
        rot_crv = motor3_rotationCurve.duplicate();

        potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    }



    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor3_tube2_a', 'motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1.duplicate(), b_axis_2.duplicate(), c_axis_1, c_axis_2, c_axis_1.duplicate(), c_axis_2.duplicate()];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2.duplicate(), b_guide_1.duplicate(), c_guide_1, c_guide_2, c_guide_2.duplicate(), c_guide_1.duplicate()];
    
    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    
    
    
    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    
    Step 4A: Rotate Motor (and guides if necessary)*/
    
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0], a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
    
    if (source_tag_selection == "motor3_tube2_a") {
        geo.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));}
    }
    
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {
        potential_guides[0].rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_B, axis_vector, a_axis_1.pointAt(0));
    }

    //Step 4B: Add Motor to target geometry
    let geo_to_orient = [geo, rot_crv];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    
    

    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = [source_axes[0], source_axes[1], source_axes[2], source_axes[3], source_axes[6], source_axes[7]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1], source_guides[2], source_guides[3], source_guides[6], source_guides[7]];
    parts[parts_count]['potential_axes'] = potential_axes;
    parts[parts_count]['potential_guides'] = potential_guides;
    parts[parts_count]['rot_crv'] = [rot_crv];
    parts[parts_count]['rot_axes'] = [a_axis_1];


    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;
    
    count += 1;
}


function motor4(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_axis_2;
    let a_guide_1;
    let a_guide_2;
    let b_axis_1;
    let b_axis_2;
    let b_guide_1;
    let b_guide_2;
    let c_axis_1;
    let c_axis_2;
    let c_guide_1;
    let c_guide_2;
    let rot_crv;
    let potential_axes;
    let potential_guides;
    let potential_source_tags = ['motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube2'];
    let potential_target_tags = [tag_motor4_tube1_a, tag_motor4_tube1_b, tag_motor4_tube2];
    
    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_axis_2 = parts[parts_count]['source_axes'][1];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        a_guide_2 = parts[parts_count]['source_guides'][1];
        b_axis_1 = parts[parts_count]['source_axes'][2];
        b_axis_2 = parts[parts_count]['source_axes'][3];
        b_guide_1 = parts[parts_count]['source_guides'][2];
        b_guide_2 = parts[parts_count]['source_guides'][3];
        c_axis_1 = parts[parts_count]['source_axes'][4];
        c_axis_2 = parts[parts_count]['source_axes'][5];
        c_guide_1 = parts[parts_count]['source_guides'][4];
        c_guide_2 = parts[parts_count]['source_guides'][5];
        rot_crv = parts[parts_count]['rot_crv'][0];

        /* Define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
        All of this geometry will be transformed according to the selected source/target geometry. This is because it needs to track
        with the rotated geometry. Note that the .duplicate() method is necessary to avoid Transforms on the same geometry. We need 
        potential_source_tags and potential_target_tags for the final step. In the case of Motor1, there are 2 potential targets: 
        a (with motor) and b (without)*/    
        potential_axes = parts[parts_count]['potential_axes'];
        potential_guides = parts[parts_count]['potential_guides'];
    }

    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Motor 4'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = motor4_geo.duplicate();
        a_axis_1 = motor4_tube1a_axis_1.duplicate();
        a_axis_2 = motor4_tube1a_axis_2.duplicate();
        a_guide_1 = motor4_tube1a_guide_1.duplicate();
        a_guide_2 = motor4_tube1a_guide_2.duplicate();
        b_axis_1 = motor4_tube1b_axis_1.duplicate();
        b_axis_2 = motor4_tube1b_axis_2.duplicate();
        b_guide_1 = motor4_tube1b_guide_1.duplicate();
        b_guide_2 = motor4_tube1b_guide_2.duplicate();
        c_axis_1 = motor4_tube2_axis_1.duplicate();
        c_axis_2 = motor4_tube2_axis_2.duplicate();
        c_guide_1 = motor4_tube2_guide_1.duplicate();
        c_guide_2 = motor4_tube2_guide_2.duplicate();
        rot_crv = motor4_rotationCurve.duplicate();

        potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    }


    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor4_tube1_a', 'motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2'];
    let source_axes = [a_axis_2, a_axis_1, b_axis_1, b_axis_2, b_axis_1.duplicate(), b_axis_2.duplicate(), c_axis_1, c_axis_2, c_axis_1.duplicate(), c_axis_2.duplicate()];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2.duplicate(), b_guide_1.duplicate(), c_guide_1, c_guide_2, c_guide_2.duplicate(), c_guide_1.duplicate()];
    
    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again

    
    
    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    
    Step 4A: Rotate Motor (and guides if necessary)*/
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0],a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
        
    if (source_tag_selection == "motor4_tube1_a") {
        geo.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++){potential_axes[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));}
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {
        potential_guides[0].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
    }
    
    //Step 4B: Add Motor to target geometry
    let geo_to_orient = [geo, rot_crv];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    
    

    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = [source_axes[1], source_axes[0], source_axes[2], source_axes[3], source_axes[6], source_axes[7]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1], source_guides[2], source_guides[3], source_guides[6], source_guides[7]];
    parts[parts_count]['potential_axes'] = potential_axes;
    parts[parts_count]['potential_guides'] = potential_guides;
    parts[parts_count]['rot_crv'] = [rot_crv];
    parts[parts_count]['rot_axes'] = [a_axis_1];

    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;
    
    count += 1;
}


function motor5(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/
    
    let parts_count = count.toString();

    let geo;
    let a_axis_1;
    let a_axis_2;
    let a_guide_1;
    let a_guide_2;
    let b_axis_1;
    let b_axis_2;
    let b_guide_1;
    let b_guide_2;
    let c_axis_1;
    let c_axis_2;
    let c_guide_1;
    let c_guide_2;
    let rot_crv;
    let potential_axes;
    let potential_guides;
    let potential_source_tags = ['motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube2'];
    let potential_target_tags = [tag_motor5_tube1_a, tag_motor5_tube1_b, tag_motor5_tube2];

    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        a_axis_1 = parts[parts_count]['source_axes'][0];
        a_axis_2 = parts[parts_count]['source_axes'][1];
        a_guide_1 = parts[parts_count]['source_guides'][0];
        a_guide_2 = parts[parts_count]['source_guides'][1];
        b_axis_1 = parts[parts_count]['source_axes'][2];
        b_axis_2 = parts[parts_count]['source_axes'][3];
        b_guide_1 = parts[parts_count]['source_guides'][2];
        b_guide_2 = parts[parts_count]['source_guides'][3];
        c_axis_1 = parts[parts_count]['source_axes'][4];
        c_axis_2 = parts[parts_count]['source_axes'][5];
        c_guide_1 = parts[parts_count]['source_guides'][4];
        c_guide_2 = parts[parts_count]['source_guides'][5];
        rot_crv = parts[parts_count]['rot_crv'][0];

        /* Define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
        All of this geometry will be transformed according to the selected source/target geometry. This is because it needs to track
        with the rotated geometry. Note that the .duplicate() method is necessary to avoid Transforms on the same geometry. We need 
        potential_source_tags and potential_target_tags for the final step. In the case of Motor1, there are 2 potential targets: 
        a (with motor) and b (without)*/    
        potential_axes = parts[parts_count]['potential_axes'];
        potential_guides = parts[parts_count]['potential_guides'];
    }

    else {
        //Hide Nib UI if enabled
        nib_UI_bool = false;
        nib_UI();

        //Add object to parts
        parts[parts_count] = {'name': 'Motor 5'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = motor5_geo.duplicate();
        a_axis_1 = motor5_tube1a_axis_1.duplicate();
        a_axis_2 = motor5_tube1a_axis_2.duplicate();
        a_guide_1 = motor5_tube1a_guide_1.duplicate();
        a_guide_2 = motor5_tube1a_guide_2.duplicate();
        b_axis_1 = motor5_tube1b_axis_1.duplicate();
        b_axis_2 = motor5_tube1b_axis_2.duplicate();
        b_guide_1 = motor5_tube1b_guide_1.duplicate();
        b_guide_2 = motor5_tube1b_guide_2.duplicate();
        c_axis_1 = motor5_tube2_axis_1.duplicate();
        c_axis_2 = motor5_tube2_axis_2.duplicate();
        c_guide_1 = motor5_tube2_guide_1.duplicate();
        c_guide_2 = motor5_tube2_guide_2.duplicate();
        rot_crv = motor5_rotationCurve.duplicate();

        potential_axes = [a_axis_1.duplicate(), b_axis_1.duplicate(), c_axis_1.duplicate()];
        potential_guides = [a_guide_1.duplicate(), b_guide_1.duplicate(), c_guide_1.duplicate()];
    }
    

    
    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['motor5_tube1_a', 'motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2'];
    let source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1.duplicate(), b_axis_2.duplicate(), c_axis_1, c_axis_2, c_axis_1.duplicate(), c_axis_2.duplicate()];
    let source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2.duplicate(), b_guide_1.duplicate(), c_guide_1, c_guide_2, c_guide_2.duplicate(), c_guide_1.duplicate()];
    
    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    

    
    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 4A: Rotate Motor (and guides if necessary)*/
    
    let axis_vector = [a_axis_1.pointAt(1)[0] - a_axis_1.pointAt(0)[0],a_axis_1.pointAt(1)[1] - a_axis_1.pointAt(0)[1], a_axis_1.pointAt(1)[2] - a_axis_1.pointAt(0)[2]];
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/

    if (source_tag_selection == "motor5_tube1_a") {
        geo.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        for (let i=0; i<potential_axes.length; i++) {potential_axes[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));} 
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {
        potential_guides[0].rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
        rot_crv.rotate(angle_A, axis_vector, a_axis_1.pointAt(0));
    }
    
    //Step 4B: Add Motor to target geometry
    let geo_to_orient = [geo, rot_crv];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);
    


    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['source_axes'] = [source_axes[0], source_axes[1], source_axes[2], source_axes[3], source_axes[6], source_axes[7]];
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[1], source_guides[2], source_guides[3], source_guides[6], source_guides[7]];
    parts[parts_count]['potential_axes'] = potential_axes;
    parts[parts_count]['potential_guides'] = potential_guides;
    parts[parts_count]['rot_crv'] = [rot_crv];
    parts[parts_count]['rot_axes'] = [a_axis_1];

    for (let i=0; i<potential_source_tags.length; i++) {
        if (potential_source_tags[i] == source_tag_selection) {}
        else {
            target_axes.push(potential_axes[i]);
            target_guides.push(potential_guides[i]);
            target_tags.push(potential_target_tags[i]);
        }
    }
    
    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;
    
    count += 1;
}


function nib(selection_index) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
    /*Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2*/

    let parts_count = count.toString();

    let geo;
    let sphere;
    let point;
    let tube1_axis_1;
    let tube1_axis_2;
    let tube1_guide_1;
    let tube2_axis_1;
    let tube2_axis_2;
    let tube2_guide_1;
    let motors1_axis_1;
    let motors1_axis_2;
    let motors2_axis_1;
    let motors2_axis_2;
    let motors1_guide_1;
    let motors2_guide_1;
    let potential_source_tags = []; //Nibs don't create any new placemnet opportunities
    let potential_target_tags = [];
    let potential_axes = [];
    let potential_guides = [];

    nib_key = nib_item.toString();


    if (play_bool) {
        //Reuse geometry
        geo = parts[parts_count]['geo'][0];
        sphere = parts[parts_count]['sphere'];
        point = parts[parts_count]['point'];
        tube1_axis_1 = parts[parts_count]['source_axes'][0];
        tube1_axis_2 = parts[parts_count]['source_axes'][1];
        tube1_guide_1 = parts[parts_count]['source_guides'][0];
        tube2_axis_1 = parts[parts_count]['source_axes'][2];
        tube2_axis_2 = parts[parts_count]['source_axes'][3];
        tube2_guide_1 = parts[parts_count]['source_guides'][1];
        motors1_axis_1 = parts[parts_count]['source_axes'][4];
        motors1_axis_2 = parts[parts_count]['source_axes'][5];
        motors2_axis_1 = parts[parts_count]['source_axes'][6];
        motors2_axis_2 = parts[parts_count]['source_axes'][7];
        motors1_guide_1 = parts[parts_count]['source_guides'][2];
        motors2_guide_1 = parts[parts_count]['source_guides'][3];
    }

    else {
        //Show Nib UI if enabled
        nib_UI_bool = true;
        nib_UI();
        
        //Add object to parts
        parts[parts_count] = {'name': 'Nib'};
        parts[parts_count]['selection_index'] = selection_index;

        //Define source geometry
        geo = nib_geo.duplicate();
        sphere = nib_sphere.duplicate();
        point = nib_pt.duplicate();
        tube1_axis_1 = nib_tube1_axis_1.duplicate();
        tube1_axis_2 = nib_tube1_axis_2.duplicate();
        tube1_guide_1 = nib_tube1_guide_1.duplicate();
        tube2_axis_1 = nib_tube2_axis_1.duplicate();
        tube2_axis_2 = nib_tube2_axis_2.duplicate();
        tube2_guide_1 = nib_tube2_guide_1.duplicate();
        motors1_axis_1 = nib_motors1_axis_1.duplicate();
        motors1_axis_2 = nib_motors1_axis_2.duplicate();
        motors1_guide_1 = nib_motors1_guide_1.duplicate();
        motors2_axis_1 = nib_motors2_axis_1.duplicate();
        motors2_axis_2 = nib_motors2_axis_2.duplicate();
        motors2_guide_1 = nib_motors2_guide_1.duplicate();

        sphere.scale(nib_objects[nib_key]["weight"] / 3);
    }



    /*Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function*/
    
    let source_tags = ['nib_tube1_a', 'nib_tube1_b', 'nib_tube2_a', 'nib_tube2_b', 'nib_motors_1', 'nib_motors_1', 'nib_motors_2', 'nib_motors_2'];
    let source_axes = [tube1_axis_1, tube1_axis_2, tube2_axis_1, tube2_axis_2, motors1_axis_1, motors1_axis_2, motors2_axis_1, motors2_axis_2];
    let source_guides = [tube1_guide_1, tube1_guide_1.duplicate(), tube2_guide_1, tube2_guide_1.duplicate(), motors1_guide_1, motors1_guide_1.duplicate(), motors2_guide_1, motors2_guide_1.duplicate()];
    
    let previous_count = (count - 1).toString()
    let target_tags = [...parts[previous_count]['target_tags']]; //shallow copy
    let target_axes = [...parts[previous_count]['target_axes']];
    let target_guides = [...parts[previous_count]['target_guides']];



    //Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    pair_list = generate_selection_pairs(source_tags, target_tags);
    let source_target_pair = pair_list[selection_index % pair_list.length];
    let source_tag_selection = source_tags[source_target_pair[0]]; //a special name for a special tag (see final step)
    let source_axis = source_axes[source_target_pair[0]].duplicate();
    let source_guide = source_guides[source_target_pair[0]].duplicate();
    let target_tag = target_tags[source_target_pair[1]];
    target_tags.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_axis = target_axes[source_target_pair[1]];
    target_axes.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    let target_guide = target_guides[source_target_pair[1]];
    target_guides.splice(source_target_pair[1], 1); //Remove this one bc the associated position will be occupied by the part and it can't be used again
    

    
    /*Step 4. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.*/

    let geo_to_orient = [geo, sphere, point];
    orient3d(geo_to_orient, source_axis, source_guide, target_axis, target_guide, source_axes, source_guides, potential_axes, potential_guides);



    /*Step 5. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    Nibs don't add any new targets, so there's no need to iterate over the potential_source_tags for tags/axes/guides as with other parts.
    However, if Nib is placed in a Tube 2/3 inner position, then we have to remove the corresponding Tube 2/3 outer tag so that a Tube 1 
    can't be placed over it (but a Motor still could)*/
    
    parts[parts_count]['selection_index'] = selection_index;
    parts[parts_count]['geo'] = [geo];
    parts[parts_count]['sphere'] = sphere;
    parts[parts_count]['point'] = point;
    parts[parts_count]['source_axes'] = source_axes;
    parts[parts_count]['source_guides'] = [source_guides[0], source_guides[2], source_guides[4], source_guides[6]];

    parts[parts_count]['target_tags'] = target_tags;
    parts[parts_count]['target_axes'] = target_axes;
    parts[parts_count]['target_guides'] = target_guides;
    
    count += 1;



    //Step 6: confirm target is Tube 2/3
    if (target_tag == "nib_tube2_a" || target_tag == "nib_tube2_b") {
    //Step 7B: confirm which outer tag is referenced (could be tube2_a, tube2_b, tube3_a, or tube3_b)
        if (target_tags[source_target_pair[1] - 1] == tag_tube2_a_outer || target_tags[source_target_pair[1] - 1] == tag_tube2_b_outer || target_tags[source_target_pair[1] - 1] == tag_tube3_a_outer || target_tags[source_target_pair[1] - 1] == tag_tube3_b_outer) {
            //Step 7C: define new target that removes tube1_outer as possible placement
            target_tags[source_target_pair[1] - 1] = "motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
        }
    }
    
    //Step 8: update nib object
    let current_angle = rotation_angle / 0.0175

    if (play_bool == false) {
        //Update sphere
        nib_objects[nib_key]["sphere"] = sphere;
    }

    else if (play_bool && play_count == 0) {
        //Create "points" value when Play button is pressed
        nib_objects[nib_key]["sphere"] = sphere;
        nib_objects[nib_key]["points"] = [point.duplicate()];    
    }

    else if (play_bool && play_count > 0  && current_angle < 3701) {
        //Add additional points and Play continues
        /*If machine has made 10 full rotations (3600 degrees + 100 potential degrees from slider = 3700), 
        the lines being drawn are guaranteed to be complete, and there's no need to continue adding points 
        (the machine will still be allowed to rotate)*/
        nib_objects[nib_key]["sphere"] = sphere;
        nib_objects[nib_key]["points"].push(point.duplicate());
    }

    nib_item += 1;
}