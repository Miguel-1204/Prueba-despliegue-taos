/**
 * TryOnEarring.jsx
 * Componente de probador virtual de aretes con detección facial en tiempo real.
 *
 * Carga MediaPipe FaceMesh de forma local y calcula la posición y rotación
 * de los aretes utilizando las utilidades de tracking actualizadas.
 *
 * Renderiza con Three.js: OrthographicCamera, VideoTexture, GLTFLoader.
 * Soporta dos aretes independientes (oreja izquierda y derecha).
 *
 * Modo de uso:
 *   <TryOnEarring modelPath="/models/arete.glb" />
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { onFaceLandmarkerResults, resetSmoothing } from '../utils/faceTrackingUtils';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// -----------------------------------------------------------------------
// Constantes de configuración
// -----------------------------------------------------------------------

/** Resolución del video de la cámara (baja para rendimiento) */
const VIDEO_WIDTH = 960;
const VIDEO_HEIGHT = 720;

/** Distancia de la cámara ortográfica al plano Z = 0 */
const CAMERA_DISTANCE = 900;

// Ya no usamos FACEMESH_OPTIONS, se configura en initFaceLandmarker

// Nota: Los desplazamientos de tracking y offsets locales de los aretes
// se calculan dinámicamente en src/utils/faceTrackingUtils.js.

export default function TryOnEarring({
  modelPath = '/models/arete.glb',
  showCanvas = true,
}) {
  // ---- Refs ----
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Grupos individuales para los aretes izquierdo y derecho
  const leftEarringGroupRef = useRef(null);
  const rightEarringGroupRef = useRef(null);
  const leftModelRef = useRef(null);
  const rightModelRef = useRef(null);

  const faceLandmarkerRef = useRef(null);
  const animationIdRef = useRef(null);
  const isRunningRef = useRef(false);
  const modelPathRef = useRef(modelPath);

  // ---- Estado ----
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // ---- Inicializar escena Three.js ----  
  const clearModelGroups = useCallback(() => {
    const leftGroup = leftEarringGroupRef.current;
    const rightGroup = rightEarringGroupRef.current;

    if (leftGroup) {
      while (leftGroup.children.length > 1) {
        const child = leftGroup.children[1];
        leftGroup.remove(child);
      }
      if (leftModelRef.current) {
        leftModelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material?.dispose?.());
            } else {
              child.material?.dispose?.();
            }
          }
        });
        leftModelRef.current = null;
      }
    }

    if (rightGroup) {
      while (rightGroup.children.length > 1) {
        const child = rightGroup.children[1];
        rightGroup.remove(child);
      }
      if (rightModelRef.current) {
        rightModelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material?.dispose?.());
            } else {
              child.material?.dispose?.();
            }
          }
        });
        rightModelRef.current = null;
      }
    }
  }, []);

  const loadModelIntoGroups = useCallback((path) => {
    const leftGroup = leftEarringGroupRef.current;
    const rightGroup = rightEarringGroupRef.current;
    if (!leftGroup || !rightGroup) return;

    clearModelGroups();

    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        console.log('📦 Bounding Box Original del Modelo:', {
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z }
        });

        model.position.set(-center.x, -box.max.y, -center.z);
        model.rotation.set(0, Math.PI, 0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            if (child.material) {
              child.material.depthWrite = true;
              child.material.depthTest = true;
              child.material.needsUpdate = true;
            }
          }
        });

        const heightVal = size.y > 0 ? size.y : (size.x > 0 ? size.x : 1);
        const scaleFactor = 40 / heightVal;

        console.log(`📏 Factor de escala calculado: ${scaleFactor} (Tamaño original en Y: ${size.y})`);

        const leftSubGroup = new THREE.Group();
        leftSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        leftSubGroup.rotation.set(0, Math.PI, 0);
        leftSubGroup.position.set(0, 0, 0);
        leftSubGroup.add(model);
        leftGroup.add(leftSubGroup);
        leftEarringGroupRef.current.visible = true;
        leftModelRef.current = model;

        const rightSubGroup = new THREE.Group();
        rightSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        rightSubGroup.rotation.set(0, Math.PI, 0);
        rightSubGroup.position.set(0, 0, 0);

        const rightModel = model.clone(true);
        rightModel.scale.x *= -1;
        rightSubGroup.add(rightModel);
        rightGroup.add(rightSubGroup);
        rightEarringGroupRef.current.visible = true;
        rightModelRef.current = rightModel;

        setModelLoading(false);
        console.log('✅ Modelo .glb cargado, centrado y escalado correctamente.');
      },
      (xhr) => {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        if (pct % 25 === 0) console.log(`📦 Modelo: ${pct}%`);
      },
      () => {
        console.warn('⚠️ No se encontró modelo .glb (se usarán placeholders)');
        setModelLoading(false);

        const createPlaceholderCube = (colorVal) => {
          const geometry = new THREE.BoxGeometry(20, 20, 20);
          const material = new THREE.MeshStandardMaterial({
            color: colorVal,
            metalness: 0.8,
            roughness: 0.2,
          });
          return new THREE.Mesh(geometry, material);
        };

        const leftSubGroup = new THREE.Group();
        leftSubGroup.add(createPlaceholderCube(0xc5a880));
        leftGroup.add(leftSubGroup);
        leftEarringGroupRef.current.visible = true;

        const rightSubGroup = new THREE.Group();
        rightSubGroup.add(createPlaceholderCube(0xc5a880));
        rightGroup.add(rightSubGroup);
        rightEarringGroupRef.current.visible = true;
      }
    );
  }, [clearModelGroups]);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();

    // Usamos una escena base con proporciones estándar; luego se ajusta al tamaño
    // real del stream de la cámara para evitar desalineaciones en móvil.
    const aspect = VIDEO_WIDTH / VIDEO_HEIGHT;
    const frustumHalf = VIDEO_HEIGHT / 2;
    const camera = new THREE.OrthographicCamera(
      -frustumHalf * aspect,
      frustumHalf * aspect,
      frustumHalf,
      -frustumHalf,
      0.1,
      2000
    );
    camera.position.set(0, 0, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Plano de fondo con textura del video.
    // IMPORTANTE: El color debe ser 0xffffff para que la textura del video
    // no se vea oscura (se multiplica el color del material por la textura).
    const bgGeometry = new THREE.PlaneGeometry(VIDEO_WIDTH, VIDEO_HEIGHT);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8e8e8,
      side: THREE.DoubleSide,
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -CAMERA_DISTANCE + 1;
    scene.add(bgMesh);

    // Iluminación simple (sin sombras)
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(0, 0, CAMERA_DISTANCE);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(0, -200, CAMERA_DISTANCE);
    scene.add(fillLight);

    // Grupo para el arete izquierdo
    const leftEarringGroup = new THREE.Group();
    leftEarringGroup.visible = false;
    scene.add(leftEarringGroup);
    leftEarringGroupRef.current = leftEarringGroup;

    // Subgrupo para offset local del arete izquierdo
    const leftSubGroup = new THREE.Group();
    leftEarringGroup.add(leftSubGroup);

    // Grupo para el arete derecho
    const rightEarringGroup = new THREE.Group();
    rightEarringGroup.visible = false;
    scene.add(rightEarringGroup);
    rightEarringGroupRef.current = rightEarringGroup;

    // Subgrupo para offset local del arete derecho
    const rightSubGroup = new THREE.Group();
    rightEarringGroup.add(rightSubGroup);

    sceneRef.current = scene;

    // Renderer (con manejo seguro si el canvas no está listo)
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('⚠️ Canvas ref no disponible, se reintentará después');
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (webglErr) {
      console.error('❌ Error creando WebGLRenderer:', webglErr);
      setError('Tu navegador no soporta WebGL. Prueba con Chrome o Edge.');
      return;
    }
    renderer.setSize(VIDEO_WIDTH, VIDEO_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

  }, []);

  const syncSceneToVideo = useCallback(() => {
    const video = videoRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    if (!video || !renderer || !camera || !scene) return;

    const width = video.videoWidth || VIDEO_WIDTH;
    const height = video.videoHeight || VIDEO_HEIGHT;

    if (!width || !height || width <= 0 || height <= 0) return;

    const aspect = width / height;
    const frustumHalf = height / 2;
    camera.left = -frustumHalf * aspect;
    camera.right = frustumHalf * aspect;
    camera.top = frustumHalf;
    camera.bottom = -frustumHalf;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const bgMesh = scene.children.find(
      (child) => child.isMesh && child.material?.type === 'MeshBasicMaterial'
    );
    if (bgMesh && bgMesh.geometry) {
      const currentWidth = bgMesh.geometry.parameters?.width;
      const currentHeight = bgMesh.geometry.parameters?.height;
      if (currentWidth !== width || currentHeight !== height) {
        bgMesh.geometry.dispose();
        bgMesh.geometry = new THREE.PlaneGeometry(width, height);
      }
    }
  }, []);

  // ---- Inicializar cámara ----
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: VIDEO_WIDTH },
          height: { ideal: VIDEO_HEIGHT },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;

      // Esperar a que el video esté en el DOM
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          syncSceneToVideo();
        };
        try {
          await videoRef.current.play();
          console.log('🎥 Cámara iniciada correctamente');
          syncSceneToVideo();
        } catch (playErr) {
          console.warn('⚠️ play() interrumpido:', playErr);
        }
      } else {
        console.warn('⚠️ videoRef no disponible, reintentando...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch { /* ignore */ }
        }
      }
      setCameraReady(true);
      return true;
    } catch (err) {
      console.error('❌ Error cámara:', err);
      let msg = 'No se pudo acceder a la cámara. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg += 'Permiso denegado. Acepta los permisos de cámara en tu navegador.';
      } else if (err.name === 'NotFoundError') {
        msg += 'No se encontró una cámara en este dispositivo.';
      } else if (err.name === 'NotReadableError') {
        msg += 'La cámara está siendo usada por otra aplicación o pestaña.';
      } else {
        msg += err.message || 'Error desconocido';
      }
      setError(msg);
      return false;
    }
  }, [syncSceneToVideo]);

  // ---- Inicializar MediaPipe FaceLandmarker ----
  const initFaceLandmarker = useCallback(async () => {
    try {
      console.log('📦 Cargando MediaPipe FaceLandmarker...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      faceLandmarkerRef.current = faceLandmarker;

      console.log('✅ MediaPipe FaceLandmarker inicializado correctamente');
      return true;
    } catch (err) {
      console.error('❌ Error inicializando FaceLandmarker:', err);
      setError('Error al inicializar la detección facial. Verifica tu conexión a internet.');
      return false;
    }
  }, []);

  // ---- Bucle de animación ----
  const startLoop = useCallback(() => {
    if (animationIdRef.current) return;
    isRunningRef.current = true;
    let lastVideoTime = -1;

    const animate = () => {
      if (!isRunningRef.current) return;

      const video = videoRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (video && video.readyState >= 2 && faceLandmarker) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;

          const result = faceLandmarker.detectForVideo(video, performance.now());

          if (result) {
            const videoWidth = video.videoWidth || VIDEO_WIDTH;
            const videoHeight = video.videoHeight || VIDEO_HEIGHT;
            onFaceLandmarkerResults(
              result,
              leftEarringGroupRef.current,
              rightEarringGroupRef.current,
              videoWidth,
              videoHeight,
              setFaceDetected
            );
          }
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // ---- Actualizar textura de fondo con el feed de la cámara ----
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !sceneRef.current) return;
    const video = videoRef.current;
    const scene = sceneRef.current;
    const bgMesh = scene.children.find(
      (c) => c.isMesh && c.material?.type === 'MeshBasicMaterial'
    );
    if (bgMesh) {
      const vt = new THREE.VideoTexture(video);
      vt.minFilter = THREE.LinearFilter;
      vt.magFilter = THREE.LinearFilter;
      vt.format = THREE.RGBAFormat;
      bgMesh.material.map = vt;
      bgMesh.material.needsUpdate = true;
      console.log('🎥 Textura de video activa en el fondo');
    }
  }, [cameraReady]);

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    setModelLoading(true);
    loadModelIntoGroups(modelPath);
  }, [modelPath, loadModelIntoGroups]);

  useEffect(() => {
    modelPathRef.current = modelPath;
  }, [modelPath]);

  // ---- Inicialización del componente ----
  useEffect(() => {
    let mounted = true;
    const videoElement = videoRef.current;
    const init = async () => {
      // Esperar dos frames para garantizar que el canvas esté montado en el DOM
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      initScene();
      loadModelIntoGroups(modelPathRef.current);
      const camOk = await startCamera();
      if (!camOk || !mounted) return;

      // Espera pequeña antes de arrancar la red neuronal para garantizar estabilidad del stream
      setTimeout(async () => {
        if (!mounted) return;
        const meshOk = await initFaceLandmarker();
        if (!meshOk || !mounted) return;
        startLoop();
      }, 300);
    };
    init();

    return () => {
      mounted = false;
      isRunningRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoElement) videoElement.srcObject = null;
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const gl = rendererRef.current.domElement.getContext('webgl2') ||
          rendererRef.current.domElement.getContext('webgl');
        if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      if (faceLandmarkerRef.current) {
        try { faceLandmarkerRef.current.close(); } catch { /* ignore */ }
        faceLandmarkerRef.current = null;
      }
      // Resetear estado de suavizado para evitar saltos al remontar
      resetSmoothing();
      console.log('🧹 Recursos del probador AR liberados');
    };
  }, [initScene, startCamera, initFaceLandmarker, startLoop, loadModelIntoGroups]);

  // ---- Renderizado ----
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 
        El video NO debe estar con display:none porque los navegadores detienen su render.
        Lo colocamos en una posición invisible de 1x1 píxeles para mantenerlo activo.
      */}
      <video
        ref={videoRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        playsInline
        muted
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      {showCanvas && (
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            backgroundColor: '#000',
            borderRadius: '8px',
            transform: 'scaleX(-1)', // Espejado para vista natural del usuario
          }}
        />
      )}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        display: 'flex', gap: 8, flexDirection: 'column',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: faceDetected ? 'rgba(0,180,0,0.85)' : 'rgba(180,180,180,0.65)',
          color: '#fff', padding: '5px 12px', borderRadius: 20,
          fontSize: 12, fontWeight: 600,
        }}>
          <span>{faceDetected ? '🟢' : '⚪'}</span>
          {faceDetected ? 'Cara detectada' : 'Sin rostro en cámara'}
        </div>
        {modelLoading && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff',
            padding: '5px 12px', borderRadius: 20, fontSize: 12,
          }}>
            Cargando modelo 3D...
          </div>
        )}
      </div>
      {error && (
        <div style={{
          position: 'absolute', bottom: 15, left: 15, right: 15,
          backgroundColor: 'rgba(210,60,60,0.95)', color: '#fff',
          padding: '12px 16px', borderRadius: 8, fontSize: 13, zIndex: 20,
        }}>
          ❌ {error}
        </div>
      )}
      {modelLoading && !error && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', color: '#ccc',
          fontSize: 14, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8, filter: 'grayscale(30%)' }}>📿</div>
          Inicializando probador virtual...
          <br /><small style={{ color: '#888' }}>Preparando cámara y renderizado 3D</small>
        </div>
      )}
    </div>
  );
}
