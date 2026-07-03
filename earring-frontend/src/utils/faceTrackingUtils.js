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
export function getLandmark3D(landmark, videoWidth, videoHeight) {
  return new THREE.Vector3(
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
export function computeHeadPoseMatrix(landmarks, videoWidth, videoHeight) {
  const nose     = getLandmark3D(landmarks[FACIAL_LANDMARKS.NOSE_TIP],      videoWidth, videoHeight);
  const chin     = getLandmark3D(landmarks[FACIAL_LANDMARKS.CHIN],          videoWidth, videoHeight);
  const forehead = getLandmark3D(landmarks[FACIAL_LANDMARKS.FOREHEAD],      videoWidth, videoHeight);
  const leftT    = getLandmark3D(landmarks[FACIAL_LANDMARKS.LEFT_EAR_PTS[0]],  videoWidth, videoHeight);
  const rightT   = getLandmark3D(landmarks[FACIAL_LANDMARKS.RIGHT_EAR_PTS[0]], videoWidth, videoHeight);

  // Centro geométrico de la cabeza (promedio de 5 puntos clave)
  const center = new THREE.Vector3()
    .add(nose).add(chin).add(forehead).add(leftT).add(rightT)
    .multiplyScalar(1 / 5);

  // Construir base ortonormal (sistema mano derecha)
  const up      = new THREE.Vector3().subVectors(forehead, chin).normalize();
  const forward = new THREE.Vector3().subVectors(nose, center).normalize();
  const right   = new THREE.Vector3().crossVectors(up, forward).normalize();

  // Re-ortogonalizar UP para eliminar errores numéricos
  // forward × right = up (en sistema mano derecha: Z × X = Y)
  up.crossVectors(forward, right).normalize();

  const matrix = new THREE.Matrix4();
  matrix.makeBasis(right, up, forward);
  matrix.setPosition(center);

  return matrix;
}

// ---------------------------------------------------------------------------
// Suavizado temporal (Smoothing) para movimiento natural
// ---------------------------------------------------------------------------

// Estado de suavizado (a nivel de módulo, seguro para el loop de animación)
let _prevLeftPos = null;
let _prevRightPos = null;
let _prevQuaternion = null;

/**
 * Factor de suavizado: 0.0 = sin suavizado (instantáneo), 1.0 = máximo suavizado (mucho lag).
 * Un valor de 0.35 da un movimiento fluido sin lag perceptible.
 */
const SMOOTH_FACTOR = 0.35;

function smoothVec3(prev, target) {
  if (!prev) return target.clone();
  return new THREE.Vector3().lerpVectors(prev, target, 1.0 - SMOOTH_FACTOR);
}

function smoothQuat(prev, target) {
  if (!prev) return target.clone();
  const result = prev.clone();
  result.slerp(target, 1.0 - SMOOTH_FACTOR);
  return result;
}

/**
 * Resetea el estado de suavizado. Llamar al desmontar el componente
 * para que al volver a montar no haya "saltos" desde la posición anterior.
 */
export function resetSmoothing() {
  _prevLeftPos = null;
  _prevRightPos = null;
  _prevQuaternion = null;
}

// ---------------------------------------------------------------------------
// Procesamiento de Resultados de FaceMesh (MediaPipe → Three.js)
// ---------------------------------------------------------------------------

/**
 * Procesa los resultados de MediaPipe FaceLandmarker para actualizar los grupos
 * de Three.js de los aretes izquierdo y derecho.
 *
 * Flujo (Cálculo robusto basado en landmarks anatómicos):
 *   1. Calcular pose exacta de la cabeza usando puntos clave.
 *   2. Calcular escala adaptativa basada en la altura del rostro.
 *   3. Estimar posición del lóbulo con el promedio de puntos clave.
 *   4. Aplicar offsets locales precisos.
 *   5. Suavizar posiciones y rotación.
 *   6. Aplicar transformaciones a los grupos de Three.js.
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
    // Utilizamos computeHeadPoseMatrix que garantiza la alineación perfecta
    // con la cámara de Three.js, evitando las desalineaciones (quirks) 
    // del sistema de coordenadas de la matriz canónica de MediaPipe.
    const poseMatrix = computeHeadPoseMatrix(landmarks, videoWidth, videoHeight);

    const headQuaternion = new THREE.Quaternion();
    const headPosition   = new THREE.Vector3();
    const headScale      = new THREE.Vector3();
    poseMatrix.decompose(headPosition, headQuaternion, headScale);

    // Extraer ejes locales reales del rostro
    const right   = new THREE.Vector3();
    const up      = new THREE.Vector3();
    const forward = new THREE.Vector3();
    poseMatrix.extractBasis(right, up, forward);
    right.normalize();
    up.normalize();
    forward.normalize();

    // ── 2. Escala adaptativa del rostro ────────────────────────────────
    const foreheadPos = getLandmark3D(landmarks[FACIAL_LANDMARKS.FOREHEAD], videoWidth, videoHeight);
    const chinPos     = getLandmark3D(landmarks[FACIAL_LANDMARKS.CHIN],     videoWidth, videoHeight);
    const faceHeight  = foreheadPos.distanceTo(chinPos);

    const baseFaceHeight = 150; // Altura de referencia en píxeles de la escena
    const scaleMultiplier = Math.max(0.4, Math.min(6.0, faceHeight / baseFaceHeight));

    // ── 3. Estimación de la posición del lóbulo (Método A y B) ────────
    // Método A: Promedio ponderado de landmarks cercanos de la mandíbula
    const leftLobeEstimate = new THREE.Vector3(0, 0, 0);
    FACIAL_LANDMARKS.LEFT_EAR_PTS.forEach(id => {
      leftLobeEstimate.add(getLandmark3D(landmarks[id], videoWidth, videoHeight));
    });
    leftLobeEstimate.divideScalar(FACIAL_LANDMARKS.LEFT_EAR_PTS.length);

    const rightLobeEstimate = new THREE.Vector3(0, 0, 0);
    FACIAL_LANDMARKS.RIGHT_EAR_PTS.forEach(id => {
      rightLobeEstimate.add(getLandmark3D(landmarks[id], videoWidth, videoHeight));
    });
    rightLobeEstimate.divideScalar(FACIAL_LANDMARKS.RIGHT_EAR_PTS.length);

    // ── 4. Offsets finos en coordenadas locales de la cabeza ──────────
    // Se ha reducido 'outwardPx' significativamente para evitar que queden alejados de la oreja.
    // Usamos el vector 'right' anatómico derivado de la pose calculada.
    const outwardPx = 3 * scaleMultiplier; 
    const downPx    = 10 * scaleMultiplier; // Bajamos un poco más para llegar al lóbulo

    // Arete izquierdo (persona's left): está en X positivo en Three.js
    // → "outward" = dirección +right (más positivo en X)
    const leftTargetPos = leftLobeEstimate.clone()
      .addScaledVector(right, outwardPx)
      .addScaledVector(up, -downPx);

    // Arete derecho (persona's right): está en X negativo en Three.js
    // → "outward" = dirección -right (más negativo en X)
    const rightTargetPos = rightLobeEstimate.clone()
      .addScaledVector(right, -outwardPx)
      .addScaledVector(up, -downPx);

    // ── 5. Suavizado temporal ─────────────────────────────────────────
    const smoothedLeft  = smoothVec3(_prevLeftPos, leftTargetPos);
    const smoothedRight = smoothVec3(_prevRightPos, rightTargetPos);
    const smoothedQ     = smoothQuat(_prevQuaternion, headQuaternion);

    _prevLeftPos    = smoothedLeft;
    _prevRightPos   = smoothedRight;
    _prevQuaternion = smoothedQ;

    // ── 6. Oclusión lateral (qué oreja está oculta al girar la cabeza) ─
    //
    // El vector `forward` apunta del centro de la cabeza hacia la nariz.
    // En el espacio de Three.js (ANTES del espejo CSS):
    //
    //   forward.x > 0  →  Nariz apunta a la DERECHA en la imagen original (no espejada)
    //                  →  Esto significa que el usuario está mirando a su IZQUIERDA anatómica
    //                  →  Su oreja IZQUIERDA queda detrás de la cabeza → OCULTA
    //
    //   forward.x < 0  →  Nariz apunta a la IZQUIERDA en la imagen original
    //                  →  Esto significa que el usuario está mirando a su DERECHA anatómica
    //                  →  Su oreja DERECHA queda detrás de la cabeza → OCULTA
    //
    const OCCLUSION_THRESHOLD = 0.25;
    const isLeftOccluded  = forward.x > OCCLUSION_THRESHOLD;
    const isRightOccluded = forward.x < -OCCLUSION_THRESHOLD;

    // ── 7. Aplicar transformaciones a los grupos ──────────────────────
    if (leftEarringGroup) {
      if (isLeftOccluded) {
        leftEarringGroup.visible = false;
      } else {
        leftEarringGroup.position.copy(smoothedLeft);
        leftEarringGroup.position.x += offsetX;
        leftEarringGroup.position.y += offsetY;
        leftEarringGroup.position.z += offsetZ;
        leftEarringGroup.quaternion.copy(smoothedQ);
        leftEarringGroup.scale.setScalar(scaleMultiplier * (1 + sizeOffset / 100));
        leftEarringGroup.visible = true;
      }
    }

    if (rightEarringGroup) {
      if (isRightOccluded) {
        rightEarringGroup.visible = false;
      } else {
        rightEarringGroup.position.copy(smoothedRight);
        rightEarringGroup.position.x += offsetX;
        rightEarringGroup.position.y += offsetY;
        rightEarringGroup.position.z += offsetZ;
        rightEarringGroup.quaternion.copy(smoothedQ);
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
