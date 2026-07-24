/**
 * faceTrackingUtils.js
 * Utilidades para el seguimiento facial con MediaPipe FaceMesh.
 *
 * Proporciona:
 * - Índices de landmarks de la oreja (izquierda y derecha) y puntos guía.
 * - Conversión de coordenadas de landmarks normalizados a coordenadas 3D de Three.js.
 * - Cálculo de pose de la cabeza (matriz 4×4 de FaceLandmarker).
 * - Suavizado temporal (smoothing) para movimiento natural.
 * - Función onFaceLandmarkerResults para actualizar posiciones y rotaciones de los aretes.
 *
 * SISTEMA DE COORDENADAS:
 *
 *  MediaPipe FaceMesh (coordenadas normalizadas):
 *    X: 0 (izquierda de la imagen) → 1 (derecha de la imagen)
 *    Y: 0 (arriba) → 1 (abajo)
 *    Z: negativo hacia la cámara, positivo alejándose
 *
 *  Three.js (escena, cámara ortográfica en +Z mirando al origen):
 *    X: negativo a la izquierda, positivo a la derecha
 *    Y: negativo abajo, positivo arriba
 *    Z: positivo hacia la cámara (+Z), negativo alejándose
 *
 *  CSS del canvas: transform: scaleX(-1)
 *    Esto espeja horizontalmente lo renderizado por Three.js.
 *    El usuario se ve como en un espejo: su mano izquierda real
 *    aparece en el lado izquierdo de la pantalla.
 *
 *  Relación landmark → Three.js → pantalla espejada:
 *    Landmark 454 (tragion izquierdo de la persona, lado DERECHO de la imagen)
 *      → X positivo en Three.js
 *      → Aparece en el LADO IZQUIERDO de la pantalla (por espejo CSS)
 *      → Coincide con la oreja izquierda real del usuario ✓
 *
 *    Landmark 234 (tragion derecho de la persona, lado IZQUIERDO de la imagen)
 *      → X negativo en Three.js
 *      → Aparece en el LADO DERECHO de la pantalla (por espejo CSS)
 *      → Coincide con la oreja derecha real del usuario ✓
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Índices de landmarks faciales de MediaPipe
// ---------------------------------------------------------------------------

export const FACIAL_LANDMARKS = {
  // Puntos para estimar la oreja derecha (aparece a la izquierda en la pantalla por el espejo)
  RIGHT_EAR_PTS: [234, 93, 132],

  // Puntos para estimar la oreja izquierda (aparece a la derecha en la pantalla)
  LEFT_EAR_PTS: [454, 323, 361],

  // Puntos de referencia para la pose de la cabeza
  NOSE_TIP: 1,             // Punta de la nariz
  CHIN: 152,               // Barbilla
  FOREHEAD: 10,            // Frente (entre las cejas)
};

// ---------------------------------------------------------------------------
// Pool de Objetos Pre-asignados para Evitar Garbage Collection en tiempo real
// ---------------------------------------------------------------------------
const _vNose = new THREE.Vector3();
const _vChin = new THREE.Vector3();
const _vForehead = new THREE.Vector3();
const _vLeftT = new THREE.Vector3();
const _vRightT = new THREE.Vector3();
const _vCenter = new THREE.Vector3();
const _vUp = new THREE.Vector3();
const _vForward = new THREE.Vector3();
const _vRight = new THREE.Vector3();
const _vMatrix = new THREE.Matrix4();

const _vHeadPosition = new THREE.Vector3();
const _qHeadQuaternion = new THREE.Quaternion();
const _vHeadScale = new THREE.Vector3();

const _vForeheadPos = new THREE.Vector3();
const _vChinPos = new THREE.Vector3();

const _vLeftLobeEstimate = new THREE.Vector3();
const _vRightLobeEstimate = new THREE.Vector3();
const _vTmp = new THREE.Vector3();

const _vLeftTargetPos = new THREE.Vector3();
const _vRightTargetPos = new THREE.Vector3();

const _qSmoothQ = new THREE.Quaternion();
const _vSmoothLeft = new THREE.Vector3();
const _vSmoothRight = new THREE.Vector3();

// Estado del suavizado
const _prevLeftPos = new THREE.Vector3();
const _prevRightPos = new THREE.Vector3();
const _prevQuaternion = new THREE.Quaternion();
let _hasPrev = false;
let _lastDetectionTime = 0;

// ---------------------------------------------------------------------------
// Conversión de coordenadas MediaPipe → Three.js
// ---------------------------------------------------------------------------

/**
 * Convierte un landmark de MediaPipe (coordenadas normalizadas 0-1)
 * a coordenadas del espacio 3D de Three.js.
 *
 * Transformaciones aplicadas:
 *   X: (landmark.x - 0.5) * videoWidth    → Centra el origen en el medio del video
 *   Y: -(landmark.y - 0.5) * videoHeight  → Invierte Y (MediaPipe Y-abajo → Three.js Y-arriba)
 *   Z: -landmark.z * videoWidth           → Niega Z (MediaPipe Z-negativo-hacia-cámara → Three.js Z-positivo-hacia-cámara)
 */
export function getLandmark3D(landmark, videoWidth, videoHeight, target = new THREE.Vector3()) {
  return target.set(
    (landmark.x - 0.5) * videoWidth,
    -(landmark.y - 0.5) * videoHeight,
    -landmark.z * videoWidth
  );
}

// ---------------------------------------------------------------------------
// Cálculo de Pose Facial (Matriz 4×4)
// ---------------------------------------------------------------------------

/**
 * Calcula una matriz de transformación 4×4 que representa la orientación
 * y posición de la cabeza en el espacio 3D de Three.js.
 *
 * Base ortonormal construida con:
 *   UP      = forehead - chin   (eje Y local: barbilla → frente)
 *   FORWARD = nose - center     (eje Z local: centro → nariz, hacia la cámara)
 *   RIGHT   = UP × FORWARD      (eje X local: derecha, convención mano derecha)
 *
 * Luego se re-ortogonaliza UP = FORWARD × RIGHT para garantizar perpendicularidad.
 */
export function computeHeadPoseMatrix(landmarks, videoWidth, videoHeight, targetMatrix = _vMatrix) {
  const nose     = getLandmark3D(landmarks[FACIAL_LANDMARKS.NOSE_TIP],      videoWidth, videoHeight, _vNose);
  const chin     = getLandmark3D(landmarks[FACIAL_LANDMARKS.CHIN],          videoWidth, videoHeight, _vChin);
  const forehead = getLandmark3D(landmarks[FACIAL_LANDMARKS.FOREHEAD],      videoWidth, videoHeight, _vForehead);
  const leftT    = getLandmark3D(landmarks[FACIAL_LANDMARKS.LEFT_EAR_PTS[0]],  videoWidth, videoHeight, _vLeftT);
  const rightT   = getLandmark3D(landmarks[FACIAL_LANDMARKS.RIGHT_EAR_PTS[0]], videoWidth, videoHeight, _vRightT);

  // Centro geométrico de la cabeza (promedio de 5 puntos clave)
  _vCenter.set(0, 0, 0)
    .add(nose).add(chin).add(forehead).add(leftT).add(rightT)
    .multiplyScalar(0.2); // 1/5

  // Construir base ortonormal (sistema mano derecha)
  _vUp.subVectors(forehead, chin).normalize();
  _vForward.subVectors(nose, _vCenter).normalize();
  _vRight.crossVectors(_vUp, _vForward).normalize();

  // Re-ortogonalizar UP para eliminar errores numéricos
  _vUp.crossVectors(_vForward, _vRight).normalize();

  targetMatrix.makeBasis(_vRight, _vUp, _vForward);
  targetMatrix.setPosition(_vCenter);

  return targetMatrix;
}

// ---------------------------------------------------------------------------
// Suavizado temporal (Smoothing) para movimiento natural
// ---------------------------------------------------------------------------

function smoothVec3(prev, target, smoothFactor, out) {
  if (!_hasPrev) {
    out.copy(target);
    return out;
  }
  out.lerpVectors(prev, target, smoothFactor);
  return out;
}

function smoothQuat(prev, target, smoothFactor, out) {
  if (!_hasPrev) {
    out.copy(target);
    return out;
  }
  out.copy(prev).slerp(target, smoothFactor);
  return out;
}

/**
 * Resetea el estado de suavizado. Llamar al desmontar el componente
 * para que al volver a montar no haya "saltos" desde la posición anterior.
 */
export function resetSmoothing() {
  _hasPrev = false;
  _lastDetectionTime = 0;
}

// ---------------------------------------------------------------------------
// Procesamiento de Resultados de FaceMesh (MediaPipe → Three.js)
// ---------------------------------------------------------------------------

/**
 * Procesa los resultados de MediaPipe FaceLandmarker para actualizar los grupos
 * de Three.js de los aretes izquierdo y derecho.
 */
export function onFaceLandmarkerResults(
  result,
  leftEarringGroup,
  rightEarringGroup,
  videoWidth,
  videoHeight,
  setFaceDetected,
  offsetX = 0,
  offsetY = 0,
  offsetZ = 0,
  sizeOffset = 0
) {
  const landmarks = result.faceLandmarks?.[0];
  const matrices = result.facialTransformationMatrixes?.[0];

  if (!landmarks || !matrices || landmarks.length === 0) {
    // Sin cara detectada: ocultar aretes y resetear suavizado
    if (leftEarringGroup) leftEarringGroup.visible = false;
    if (rightEarringGroup) rightEarringGroup.visible = false;
    if (setFaceDetected) setFaceDetected(false);
    resetSmoothing();
    return;
  }

  try {
    // ── 1. Pose de la cabeza ──────────────────────────────────────────
    const poseMatrix = computeHeadPoseMatrix(landmarks, videoWidth, videoHeight, _vMatrix);
    poseMatrix.decompose(_vHeadPosition, _qHeadQuaternion, _vHeadScale);

    // Extraer ejes locales reales del rostro
    poseMatrix.extractBasis(_vRight, _vUp, _vForward);
    _vRight.normalize();
    _vUp.normalize();
    _vForward.normalize();

    // ── 2. Escala adaptativa del rostro ────────────────────────────────
    const foreheadPos = getLandmark3D(landmarks[FACIAL_LANDMARKS.FOREHEAD], videoWidth, videoHeight, _vForeheadPos);
    const chinPos     = getLandmark3D(landmarks[FACIAL_LANDMARKS.CHIN],     videoWidth, videoHeight, _vChinPos);
    const faceHeight  = foreheadPos.distanceTo(chinPos);

    const baseFaceHeight = 150; // Altura de referencia en píxeles de la escena
    const scaleMultiplier = Math.max(0.4, Math.min(6.0, faceHeight / baseFaceHeight));

    // ── 3. Estimación de la posición del lóbulo (Método A y B) ────────
    _vLeftLobeEstimate.set(0, 0, 0);
    FACIAL_LANDMARKS.LEFT_EAR_PTS.forEach(id => {
      getLandmark3D(landmarks[id], videoWidth, videoHeight, _vTmp);
      _vLeftLobeEstimate.add(_vTmp);
    });
    _vLeftLobeEstimate.multiplyScalar(1 / FACIAL_LANDMARKS.LEFT_EAR_PTS.length);

    _vRightLobeEstimate.set(0, 0, 0);
    FACIAL_LANDMARKS.RIGHT_EAR_PTS.forEach(id => {
      getLandmark3D(landmarks[id], videoWidth, videoHeight, _vTmp);
      _vRightLobeEstimate.add(_vTmp);
    });
    _vRightLobeEstimate.multiplyScalar(1 / FACIAL_LANDMARKS.RIGHT_EAR_PTS.length);

    // ── 4. Offsets finos en coordenadas locales de la cabeza ──────────
    const outwardPx = 3 * scaleMultiplier; 
    const downPx    = 10 * scaleMultiplier; 

    // Arete izquierdo
    _vLeftTargetPos.copy(_vLeftLobeEstimate)
      .addScaledVector(_vRight, outwardPx)
      .addScaledVector(_vUp, -downPx);

    // Arete derecho
    _vRightTargetPos.copy(_vRightLobeEstimate)
      .addScaledVector(_vRight, -outwardPx)
      .addScaledVector(_vUp, -downPx);

    // ── 5. Suavizado temporal adaptativo ──────────────────────────────
    const now = performance.now();
    let dt = 0.016;
    if (_lastDetectionTime > 0) {
      dt = (now - _lastDetectionTime) / 1000;
    }
    _lastDetectionTime = now;
    dt = Math.min(dt, 0.1);

    const tau = 0.02; // Constante de tiempo para la respuesta de suavizado (20ms para reducir latencia)
    const smoothFactor = 1.0 - Math.exp(-dt / tau);

    smoothVec3(_prevLeftPos, _vLeftTargetPos, smoothFactor, _vSmoothLeft);
    smoothVec3(_prevRightPos, _vRightTargetPos, smoothFactor, _vSmoothRight);
    smoothQuat(_prevQuaternion, _qHeadQuaternion, smoothFactor, _qSmoothQ);

    _prevLeftPos.copy(_vSmoothLeft);
    _prevRightPos.copy(_vSmoothRight);
    _prevQuaternion.copy(_qSmoothQ);
    _hasPrev = true;

    // ── 6. Oclusión lateral ───────────────────────────────────────────
    const OCCLUSION_THRESHOLD = 0.25;
    const isLeftOccluded  = _vForward.x > OCCLUSION_THRESHOLD;
    const isRightOccluded = _vForward.x < -OCCLUSION_THRESHOLD;

    // ── 7. Aplicar transformaciones a los grupos ──────────────────────
    if (leftEarringGroup) {
      if (isLeftOccluded) {
        leftEarringGroup.visible = false;
      } else {
        leftEarringGroup.position.copy(_vSmoothLeft);
        leftEarringGroup.position.x += offsetX;
        leftEarringGroup.position.y += offsetY;
        leftEarringGroup.position.z += offsetZ;
        leftEarringGroup.quaternion.copy(_qSmoothQ);
        leftEarringGroup.scale.setScalar(scaleMultiplier * (1 + sizeOffset / 100));
        leftEarringGroup.visible = true;
      }
    }

    if (rightEarringGroup) {
      if (isRightOccluded) {
        rightEarringGroup.visible = false;
      } else {
        rightEarringGroup.position.copy(_vSmoothRight);
        rightEarringGroup.position.x += offsetX;
        rightEarringGroup.position.y += offsetY;
        rightEarringGroup.position.z += offsetZ;
        rightEarringGroup.quaternion.copy(_qSmoothQ);
        rightEarringGroup.scale.setScalar(scaleMultiplier * (1 + sizeOffset / 100));
        rightEarringGroup.visible = true;
      }
    }

    if (setFaceDetected) setFaceDetected(true);
  } catch (err) {
    console.warn('⚠️ Error en FaceLandmarker:', err);
    if (leftEarringGroup) leftEarringGroup.visible = false;
    if (rightEarringGroup) rightEarringGroup.visible = false;
  }
}

// ---------------------------------------------------------------------------
// Helpers adicionales (mantenidos para compatibilidad)
// ---------------------------------------------------------------------------

/**
 * Aplica una matriz de transformación 4x4 a un punto 3D.
 */
export function applyMatrix4ToPoint(point, matrix) {
  const vector = new THREE.Vector3(point.x, point.y, point.z);
  return vector.applyMatrix4(matrix);
}

/**
 * Convierte la matriz de transformación 4×4 de MediaPipe (column-major)
 * al sistema de coordenadas de Three.js, corrigiendo la orientación de ejes.
 */
export function convertPoseMatrixToThree(matrixData, targetMatrix) {
  targetMatrix.elements.set(matrixData);
  targetMatrix.elements[1]  *= -1;
  targetMatrix.elements[5]  *= -1;
  targetMatrix.elements[9]  *= -1;
  targetMatrix.elements[13] *= -1;
}

/**
 * Convierte un landmark de coordenadas normalizadas (0–1) a coordenadas
 * de píxeles basadas en las dimensiones del video.
 */
export function landmarkToPixel(landmark, videoWidth, videoHeight) {
  return {
    x: landmark.x * videoWidth,
    y: landmark.y * videoHeight,
    z: landmark.z * videoWidth,
  };
}

/**
 * Espeja la coordenada X de un landmark horizontalmente.
 */
export function mirrorLandmarkX(landmark) {
  return {
    x: 1.0 - landmark.x,
    y: landmark.y,
    z: landmark.z,
  };
}

/**
 * Oculta un grupo de Three.js estableciendo visible = false.
 */
export function hideGroup(group) {
  if (group) group.visible = false;
}

/**
 * Muestra un grupo de Three.js estableciendo visible = true.
 */
export function showGroup(group) {
  if (group) group.visible = true;
}

