import TWEEN from '@tweenjs/tween.js';

const VIEW_DURATION = 500;

export const axonView = (cameraPosition, controlsTarget) => {
  const newCameraPosition = {
    x: 2000,
    y: 2000,
    z: 2000,
  };
  const newControlsTarget = {
    x: 0,
    y: 0,
    z: 275,
  };

  const tween1 = new TWEEN.Tween(cameraPosition)
    .to(newCameraPosition, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  const tween2 = new TWEEN.Tween(controlsTarget)
    .to(newControlsTarget, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
};

export const topView = (cameraPosition, controlsTarget) => {
  const newCameraPosition = {
    x: 10,
    y: 10,
    z: 4000,
  };
  const newControlsTarget = {
    x: 0,
    y: 0,
    z: 275,
  };

  const tween1 = new TWEEN.Tween(cameraPosition)
    .to(newCameraPosition, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  const tween2 = new TWEEN.Tween(controlsTarget)
    .to(newControlsTarget, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
};

export const frontView = (cameraPosition, controlsTarget) => {
  const newCameraPosition = {
    x: 0,
    y: 4000,
    z: 275,
  };
  const newControlsTarget = {
    x: 0,
    y: 0,
    z: 275,
  };

  const tween1 = new TWEEN.Tween(cameraPosition)
    .to(newCameraPosition, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  const tween2 = new TWEEN.Tween(controlsTarget)
    .to(newControlsTarget, VIEW_DURATION)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
};
