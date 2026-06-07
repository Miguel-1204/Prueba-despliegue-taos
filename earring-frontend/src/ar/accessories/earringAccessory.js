import * as THREE from 'three';

export const computeEarAccessoryPose = ({ landmarks, width, height, currentScale }) => {
  const leftEarTragus = landmarks[454];
  const rightEarTragus = landmarks[234];

  const faceWidth = Math.abs(leftEarTragus.x - rightEarTragus.x) * width;
  const lobeOffsetX = faceWidth * 0.1;
  const lobeOffsetY = currentScale * height * 0.16;
  const lobeZDepth = 0.27;

  const rawLeftLobe = {
    x: (leftEarTragus.x * width) - lobeOffsetX,
    y: (leftEarTragus.y * height) + lobeOffsetY,
    z: (leftEarTragus.z || 0) * width * lobeZDepth
  };

  const rawRightLobe = {
    x: (rightEarTragus.x * width) + lobeOffsetX,
    y: (rightEarTragus.y * height) + lobeOffsetY,
    z: (rightEarTragus.z || 0) * width * lobeZDepth
  };

  const nose = landmarks[1];
  const leftEarVisible = (leftEarTragus.x - nose.x) > 0.03 &&
                         leftEarTragus.x >= 0 && leftEarTragus.x <= 1 &&
                         leftEarTragus.y >= 0 && leftEarTragus.y <= 1;
  const rightEarVisible = (nose.x - rightEarTragus.x) > 0.03 &&
                          rightEarTragus.x >= 0 && rightEarTragus.x <= 1 &&
                          rightEarTragus.y >= 0 && rightEarTragus.y <= 1;

  const earLineAngle = Math.atan2(
    (leftEarTragus.y - rightEarTragus.y) * height,
    (leftEarTragus.x - rightEarTragus.x) * width
  );

  const faceYaw = (nose.x - 0.5) * 0.9;
  const facePitch = (nose.y - 0.5) * 0.5;

  return {
    rawLeftLobe,
    rawRightLobe,
    leftEarVisible,
    rightEarVisible,
    earLineAngle,
    faceYaw,
    facePitch
  };
};

export const smoothPosition = (prev, current, alpha = 0.35) => {
  if (!prev) return current;
  return {
    x: prev.x + alpha * (current.x - prev.x),
    y: prev.y + alpha * (current.y - prev.y),
    z: prev.z + alpha * (current.z - prev.z)
  };
};

export const computeVelocity = (prev, current) => {
  if (!prev) return { x: 0, y: 0, z: 0 };
  return {
    x: current.x - prev.x,
    y: current.y - prev.y,
    z: current.z - prev.z
  };
};

export const computeSwing = (velocity) => ({
  x: -velocity.x * 0.08,
  y: Math.max(0, -velocity.y) * 0.05,
  z: -velocity.z * 0.05
});

export const applyAccessoryTransform = ({
  group,
  position,
  offsetY,
  offsetZ,
  swing,
  width,
  height,
  faceYaw,
  facePitch,
  earLineAngle,
  axisXRotationRad,
  axisYRotationRad,
  axisRotationRad,
  showMirror,
  visible
}) => {
  if (!group) return;
  group.position.set(
    position.x - width / 2 + offsetY,
    height / 2 - position.y + offsetY + swing.y,
    position.z + offsetZ + swing.z
  );
  group.rotation.set(
    axisXRotationRad,
    faceYaw + axisYRotationRad,
    earLineAngle + axisRotationRad
  );
  group.visible = visible;
};
