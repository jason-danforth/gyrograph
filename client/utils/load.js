import fs from 'fs';
import path from 'path';
import {
  GUID_BASE,
  GUID_MOTOR1,
  GUID_MOTOR2,
  GUID_MOTOR3,
  GUID_MOTOR4,
  GUID_MOTOR5,
  GUID_NIB,
  GUID_TUBE1,
  GUID_TUBE2,
  GUID_TUBE3,
} from '../constants/guidConstants';

const rhino3dm = require('rhino')();

const loadGeometry = () => {
  // read in the models
  const drawingMachineModels = fs.readFileSync(
    path.join(__dirname, '/static/models/Drawing_Machine.3dm')
  );

  const rhinoDoc = rhino3dm.File3dm.fromByteArray(new Uint8Array(drawingMachineModels));

  THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

  // init();

  const geometry = {};

  const objects = rhinoDoc.objects(); // Creates a File3dmObjectTable object

  for (let i = 0; i < objects.count; i += 1) {
    const { id } = objects.get(i).attributes();
    const geo = objects.get(i).geometry();
    switch (id) {
      case GUID_BASE.guid_base_sphere:
        geometry.base_sphere = geo;
        break;
      case GUID_BASE.guid_base_tube:
        geometry.base_tube = geo;
        break;
      case GUID_BASE.guid_base_axis:
        geometry.base_axis = geo;
        break;
      case GUID_BASE.guid_base_guide:
        geometry.base_guide = geo;
        break;
      default:
        break;
    }
  }
};
export default loadGeometry;
