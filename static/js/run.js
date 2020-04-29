
let fetchPromise = fetch('static/models/drawingmachine_2.3dm');
//let fetchPromise = fetch('../../resources/models/Blocks_Web.3dm');

rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.');
    let rhino = m;

    let res = await fetchPromise;
    let buffer = await res.arrayBuffer();
    let arr = new Uint8Array(buffer);
    let doc = rhino.File3dm.fromByteArray(arr);

    THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1)

    init();
    
    let objects = doc.objects();
    draw(objects);

    //Use button click event to draw meshes
    //document.getElementById('draw_button').addEventListener('click', async () => { draw(objects) });

    function draw(objects) {
        let meshMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, shininess: 150});
        var curveMaterial = new THREE.LineBasicMaterial( { color: 0x9c9c9c } );
        
        for (let i = 0; i < objects.count; i++) {
            let geo = objects.get(i).geometry();
            // if(i == 0) {
            //     //Test rhino3dm.js action
            //     geo = moveObj(geo);
            //     let threeMesh = meshToThreejs(geo, meshMaterial);
            //     threeMesh.castShadow = true;
            //     threeMesh.receiveShadow = true;
            //     scene.add(threeMesh);
            // }
            if (geo instanceof rhino.Mesh) {
                //Convert all meshes in 3dm model into threejs objects
                let threeMesh = meshToThreejs(geo, meshMaterial);
                threeMesh.castShadow = true;
                threeMesh.receiveShadow = true;
                scene.add(threeMesh);
            }

            else if (geo instanceof rhino.Curve) {
                let threeCurve = curveToLineSegments(geo, curveMaterial);
                scene.add(threeCurve);
            }
        }
    }


});