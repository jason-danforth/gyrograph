import * as THREE from 'three';

export const curveToLineSegment = (curve, material) => {
  const geometry = new THREE.Geometry();
  const { domain } = curve;
  const [start, end] = domain;
  const range = end - start;
  const interval = range / 50;

  for (let i = 0; i < 51; i += 1) {
    const t = start + i * interval;
    const [x, y, z] = curve.pointAt(t);
    const vector = new THREE.Vector3(x, y, z);
    geometry.vertices.push(vector);
  }
  return new THREE.Line(geometry, material);
};

export const draw = (partList, scene, nibObjects, lineColor) => {
  const materialOptions = {
    color: 0xffffff,
    shininess: 1000,
  };
  const meshMaterial = new THREE.MeshPhogMaterial(materialOptions);

  partList.forEach((geo) => {
    const threeMesh = meshToThreeJs(geo, meshMaterial);
    threeMesh.castShadow = true;
    threeMesh.receiveShadow = true;
    scene.add(threeMesh);
  });

  nibObjects.forEach((nibObject) => {
    const { color, sphere: geo, points, weight } = nibObject;
    const nibColor = color || lineColor;
    const nibMaterial = new THREE.MeshBasicMaterial({ color: nibColor });
    const threeMesh = meshToThreejs(geo, nibMaterial);

    if (points.length) {
      const pointGeo = new THREE.LineGeometry();
      const pointColor = new THREE.Color(nibColor);
      const { r, g, b } = pointColor;
      const { _colors: colors, _positions: positions } = points.reduce(
        (acc, { location }) => {
          const { _colors, _positions } = acc;
          const [x, y, z] = location;
          _colors.push(r, g, b);
          _positions.push(x, y, z);

          return acc;
        },
        { _colors: [], _positions: [] }
      );
      pointGeo.setPositions(positions);
      pointGeo.setColors(colors);

      const matLine = new THREE.LineMaterial({
        lineWidith: weight,
        vertexColors: threeMesh.VertexColors,
      });

      // TODO: WINDOW_HEIGHT / WINDOW_WIDTH should be calculated
      const WINDOW_WIDTH = 100;
      const WINDOW_HEIGHT = 100;
      matLine.resolution.set(WINDOW_WIDTH, WINDOW_HEIGHT);
      const line = new THREE.Line2(pointGeo, matLine);
      scene.add(line);
    }
  });
};
