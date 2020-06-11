
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






//------------------------------------------Animate-------------------------------------------------------------------------------------------------------------------------------------

var slider = document.getElementById("myRange");
slider.oninput = function() {
    rotation_angle = this.value * 0.0175; //Convert angle from degrees to radians
 
    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if (scene.children[i].type == 'Mesh') {
            scene.remove(scene.children[i]);
            i = i-1;
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
  }





//------------------------------------------Modal Popup-------------------------------------------------------------------------------------------------------------------------------------

// Get the modal
var modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
var previousButton = document.getElementsByClassName("previous")[0];
var nextButton = document.getElementsByClassName("next")[0];
var exitButton = document.getElementsByClassName("exit")[0];

// When the user clicks on the button, open the modal
function openModal() {
    modal.style.display = "block";
}

nextButton.onclick = function() {
    let lastIndex = selection_list.length - 1;
    selection_list[lastIndex] = selection_list[lastIndex] + 1;
    
    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if (scene.children[i].type == 'Mesh') {
            scene.remove(scene.children[i]);
            i = i-1;
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
  }

  previousButton.onclick = function() {
    let lastIndex = selection_list.length - 1;
    
    if (selection_list[lastIndex] != 0) {selection_list[lastIndex] = selection_list[lastIndex] - 1;}
    else {selection_list[lastIndex] = pair_list.length - 1;}
    
    //Remove previously drawn objects from the scene
    for (let i=0; i<scene.children.length; i++) {
        if (scene.children[i].type == 'Mesh') {
            scene.remove(scene.children[i]);
            i = i-1;
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
  }

exitButton.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}


//------------------------------------------Helper Functions-------------------------------------------------------------------------------------------------------------------------------------

function draw() {
    let meshMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, shininess: 150});
    let curveMaterial = new THREE.LineBasicMaterial( { color: 0x9c9c9c } );
    
    for (let i=0; i<part_list_output.length; i++) {
        let geo = part_list_output[i];
        let threeMesh = meshToThreejs(geo, meshMaterial);
        threeMesh.castShadow = true;
        threeMesh.receiveShadow = true;
        scene.add(threeMesh);
    }
}


function update_src() {
    //Iterate over target_tags and update icons base on whether or not they are available (i.e. in target_tags)

    //Make undo button available
    let element_undo = document.getElementById("undo");
    element_undo.onmouseover = function() {this.src='/static/images/icons_undo_mouseover.png';}
    element_undo.setAttribute( "onClick", "undo()" );

    let tag_set = new Set();
    for (let i=0; i<target_tags.length; i++) {
        individual_tags = target_tags[i].split(", ");
        for (j=0; j<individual_tags.length; j++) {
            tag_set.add(individual_tags[j].split("_")[0]);
        }
    }

    if (tag_set.has("tube1")) {
        let element = document.getElementById("tube1");
        element.src="/static/images/icons_tube1_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_tube1_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_tube1_available.png';};
        element.setAttribute( "onClick", "add_part('Tube 1')" );
    }
    else {
        let element = document.getElementById("tube1");
        element.src="/static/images/icons_tube1_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_tube1_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_tube1_unavailable.png';};
        element.onclick = "";
    }

    //The "tube2" tag is used for Tube 2 and Tube 3 since they share all the same placements
    if (tag_set.has("tube2")) {
        let element1 = document.getElementById("tube2");
        element1.src="/static/images/icons_tube2_available.png";
        element1.onmouseover = function() {this.src='/static/images/icons_tube2_onclick.png';}
        element1.onmouseout = function() {this.src='/static/images/icons_tube2_available.png';};
        element1.setAttribute( "onClick", "add_part('Tube 2')" );

        let element2 = document.getElementById("tube3");
        element2.src="/static/images/icons_tube3_available.png";
        element2.onmouseover = function() {this.src='/static/images/icons_tube3_onclick.png';}
        element2.onmouseout = function() {this.src='/static/images/icons_tube3_available.png';};
        element2.setAttribute( "onClick", "add_part('Tube 3')" );
    }
    else {
        let element1 = document.getElementById("tube2");
        element1.src="/static/images/icons_tube2_unavailable.png";
        element1.onmouseover = function() {this.src='/static/images/icons_tube2_unavailable.png';}
        element1.onmouseout = function() {this.src='/static/images/icons_tube2_unavailable.png';};
        element1.onclick = "";

        let element2 = document.getElementById("tube3");
        element2.src="/static/images/icons_tube3_unavailable.png";
        element2.onmouseover = function() {this.src='/static/images/icons_tube3_unavailable.png';}
        element2.onmouseout = function() {this.src='/static/images/icons_tube3_unavailable.png';};
        element2.onclick = "";
    }

    if (tag_set.has("motor1")) {
        let element = document.getElementById("motor1");
        element.src="/static/images/icons_motor1_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor1_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor1_available.png';};
        element.setAttribute( "onClick", "add_part('Motor 1')" );
    }
    else {
        let element = document.getElementById("motor1");
        element.src="/static/images/icons_motor1_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor1_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor1_unavailable.png';};
        element.onclick = "";
    }

    if (tag_set.has("motor2")) {
        let element = document.getElementById("motor2");
        element.src="/static/images/icons_motor2_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor2_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor2_available.png';};
        element.setAttribute( "onClick", "add_part('Motor 2')" );
    }
    else {
        let element = document.getElementById("motor2");
        element.src="/static/images/icons_motor2_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor2_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor2_unavailable.png';};
        element.onclick = "";
    }

    if (tag_set.has("motor3")) {
        let element = document.getElementById("motor3");
        element.src="/static/images/icons_motor3_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor3_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor3_available.png';};
        element.setAttribute( "onClick", "add_part('Motor 3')" );
    }
    else {
        let element = document.getElementById("motor3");
        element.src="/static/images/icons_motor3_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor3_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor3_unavailable.png';};
        element.onclick = "";
    }

    if (tag_set.has("motor4")) {
        let element = document.getElementById("motor4");
        element.src="/static/images/icons_motor4_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor4_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor4_available.png';};
        element.setAttribute( "onClick", "add_part('Motor 4')" );
    }
    else {
        let element = document.getElementById("motor4");
        element.src="/static/images/icons_motor4_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor4_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor4_unavailable.png';};
        element.onclick = "";
    }

    if (tag_set.has("motor5")) {
        let element = document.getElementById("motor5");
        element.src="/static/images/icons_motor5_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor5_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor5_available.png';};
        element.setAttribute( "onClick", "add_part('Motor 5')" );
    }
    else {
        let element = document.getElementById("motor5");
        element.src="/static/images/icons_motor5_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_motor5_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_motor5_unavailable.png';};
        element.onclick = "";
    }

    if (tag_set.has("nib") && selection_list.length > 0) {
        let element = document.getElementById("nib");
        element.src="/static/images/icons_nib_available.png";
        element.onmouseover = function() {this.src='/static/images/icons_nib_onclick.png';}
        element.onmouseout = function() {this.src='/static/images/icons_nib_available.png';};
        element.setAttribute( "onClick", "add_part('Nib')" );
    }
    else {
        let element = document.getElementById("nib");
        element.src="/static/images/icons_nib_unavailable.png";
        element.onmouseover = function() {this.src='/static/images/icons_nib_unavailable.png';}
        element.onmouseout = function() {this.src='/static/images/icons_nib_unavailable.png';};
        element.onclick = "";
    }
}

function undo() {
    //Remove most recently added part
    if (part_list_input.length > 0) {
        part_list_input.pop();
        selection_list.pop();

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

    else {
        let element_undo = document.getElementById("undo");
        element_undo.onmouseover = function() {this.src='/static/images/icons_undo_mouseout.png';}
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

    //Open Modal Popup
    openModal();
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
            try {
                tube1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Tube 2") {
            try {
                tube2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }        
        else if (part_list_input[count] == "Tube 3") {
            try {
                tube3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Motor 1") {
            try {
                motor1(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }        
        else if (part_list_input[count] == "Motor 2") {
            try {
                motor2(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Motor 3") {
            try {
                motor3(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Motor 4") {
            try {
                motor4(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Motor 5") {
            try {
                motor5(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
        }
        else if (part_list_input[count] == "Nib") {
            try {
                nib(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
            catch(err) {
                count += 1;
                next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item);
            }
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
    angle_2 = response[0];
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
    
    // let rotationTransform = new rhino.Transform.rotation(rotation_angle, axis_vector, pt1);

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


function tube3(part_list_output, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (part_list_output/tags/axes/guides)*/
    
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
            target_axes.push(potential_axes[i])
            target_guides.push(potential_guides[i])
            target_tags.push(potential_target_tags[i])
        }
    }

    //Create next block
    count += 1
    next_part(part_list_output, target_axes, target_guides, target_tags, count, nib_item)
}


function motor1(part_list_output, target_axes, target_guides, target_tags, count, nib_item) {
    /*There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)*/
    
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
    // let rotation = rg.Transform.rotation(rotation_sin_2, rotation_cos_2, axis_vector, a_axis_1.pointAt(0));
    /*If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    Note that we do NOT transform the source_guide, we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo*/
    if (source_tag_selection == "motor1_tube2_a") {
        geo.rotate(rotation_angle * 2, axis_vector, a_axis_1.pointAt(0));
        potential_axes[1].rotate(rotation_angle * 2, axis_vector, a_axis_1.pointAt(0)); //First axis doesn't rotate b/c everything is rotating around it
        for (let i=0; i<potential_guides.length; i++) {potential_guides[i].rotate(rotation_angle * 2, axis_vector, a_axis_1.pointAt(0));}
    }
    //Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else {potential_guides[0].rotate(rotation_angle * 2, axis_vector, a_axis_1.pointAt(0));}
    
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