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
  offsetX = 0,
  offsetY = 0,
  offsetZ = 0,
  sizeOffset = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  opacity = 100,
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
  const leftSubGroupRef = useRef(null);
  const rightSubGroupRef = useRef(null);
  const leftModelRef = useRef(null);
  const rightModelRef = useRef(null);

  const faceLandmarkerRef = useRef(null);
  const animationIdRef = useRef(null);
  const isRunningRef = useRef(false);
  const modelPathRef = useRef(modelPath);
  const propsRef = useRef({ offsetX: 0, offsetY: 0, offsetZ: 0, sizeOffset: 0, rotationX: 0, rotationY: 0, rotationZ: 0 });

  // ---- Estado ----
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // ---- Inicializar escena Three.js ----  
  const clearModelGroups = useCallback(() => {
    const leftSubGroup = leftSubGroupRef.current;
    const rightSubGroup = rightSubGroupRef.current;

    const clearGroup = (groupRef, modelRef) => {
      if (!groupRef) return;
      while (groupRef.children.length > 0) {
        const child = groupRef.children[0];
        groupRef.remove(child);
        if (child && child.traverse) {
          child.traverse((nested) => {
            if (nested.isMesh) {
              nested.geometry?.dispose?.();
              if (Array.isArray(nested.material)) {
                nested.material.forEach((material) => material?.dispose?.());
              } else {
                nested.material?.dispose?.();
              }
            }
          });
        }
      }
      if (modelRef.current) {
        modelRef.current = null;
      }
    };

    clearGroup(leftSubGroup, leftModelRef);
    clearGroup(rightSubGroup, rightModelRef);
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

        console.log('Bounding Box Original del Modelo:', {
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

        const leftSubGroup = leftSubGroupRef.current;
        const rightSubGroup = rightSubGroupRef.current;
        if (!leftSubGroup || !rightSubGroup) {
          console.warn('⚠️ No se encontraron los subgrupos de arete para añadir el modelo.');
          return;
        }

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

        const leftModel = model;
        leftSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        leftSubGroup.rotation.set(0, Math.PI, 0);
        leftSubGroup.position.set(0, 0, 0);
        leftSubGroup.add(leftModel);
        leftEarringGroupRef.current.visible = true;
        leftModelRef.current = leftModel;

        const rightModel = model.clone(true);
        rightModel.scale.x *= -1;
        rightSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        rightSubGroup.rotation.set(0, Math.PI, 0);
        rightSubGroup.position.set(0, 0, 0);
        rightSubGroup.add(rightModel);
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

        const leftSubGroup = leftSubGroupRef.current;
        const rightSubGroup = rightSubGroupRef.current;
        if (leftSubGroup) {
          leftSubGroup.add(createPlaceholderCube(0xc5a880));
          leftEarringGroupRef.current.visible = true;
        }
        if (rightSubGroup) {
          rightSubGroup.add(createPlaceholderCube(0xc5a880));
          rightEarringGroupRef.current.visible = true;
        }
      }
    );
  }, [clearModelGroups]);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();

    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('⚠️ Canvas ref no disponible, se reintentará después');
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true, // Hacerlo transparente para ver el video HTML debajo
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setClearColor(0x000000, 0); // Fondo totalmente transparente
    } catch (webglErr) {
      console.error('❌ Error creando WebGLRenderer:', webglErr);
      setError('Tu navegador no soporta WebGL. Prueba con Chrome o Edge.');
      return;
    }
    renderer.setSize(canvas.clientWidth || VIDEO_WIDTH, canvas.clientHeight || VIDEO_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Cámara Ortográfica — usa dimensiones CSS del canvas (lo que el usuario ve)
    const initW = canvas.clientWidth || VIDEO_WIDTH;
    const initH = canvas.clientHeight || VIDEO_HEIGHT;
    const aspect = initW / initH;
    const frustumHalf = initH / 2;
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
    leftSubGroupRef.current = leftSubGroup;

    // Grupo para el arete derecho
    const rightEarringGroup = new THREE.Group();
    rightEarringGroup.visible = false;
    scene.add(rightEarringGroup);
    rightEarringGroupRef.current = rightEarringGroup;

    // Subgrupo para offset local del arete derecho
    const rightSubGroup = new THREE.Group();
    rightEarringGroup.add(rightSubGroup);
    rightSubGroupRef.current = rightSubGroup;

    sceneRef.current = scene;
  }, []);

  /**
   * Calcula las dimensiones "efectivas" del video en pantalla, teniendo en cuenta
   * que el CSS usa object-fit: cover para recortar el video.
   */
  const getEffectiveSize = useCallback((canvasEl, videoEl) => {
    const cW = canvasEl.clientWidth;
    const cH = canvasEl.clientHeight;
    if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight || !cW || !cH) {
      return { w: cW || VIDEO_WIDTH, h: cH || VIDEO_HEIGHT };
    }
    const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
    const containerAspect = cW / cH;

    if (videoAspect > containerAspect) {
      // Video más ancho que el contenedor: llena la altura, recorta lados
      return { w: cH * videoAspect, h: cH };
    } else {
      // Video más alto que el contenedor: llena el ancho, recorta arriba/abajo
      return { w: cW, h: cW / videoAspect };
    }
  }, []);

  const syncSceneToVideo = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    if (!canvas || !video || !renderer || !camera) return;

    const cW = canvas.clientWidth;
    const cH = canvas.clientHeight;
    if (!cW || !cH) return;

    // Dimensiones efectivas del video visible (con object-fit:cover)
    const { w: effectiveW, h: effectiveH } = getEffectiveSize(canvas, video);

    const frustumHalfH = effectiveH / 2;
    const frustumHalfW = effectiveW / 2;
    camera.left = -frustumHalfW;
    camera.right = frustumHalfW;
    camera.top = frustumHalfH;
    camera.bottom = -frustumHalfH;
    camera.updateProjectionMatrix();

    renderer.setSize(cW, cH, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [getEffectiveSize]);

  // ---- Inicializar cámara ----
  const startCamera = useCallback(async () => {
    try {
      // Usamos window.screen para evitar que abrir la consola en un lateral confunda la detección
      const isPortrait = window.screen.height > window.screen.width;
      const idealWidth = isPortrait ? 720 : 1280;
      const idealHeight = isPortrait ? 1280 : 720;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
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
          console.log(' Cámara iniciada correctamente');
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
      const currentProps = propsRef.current;

      if (video && video.readyState >= 2 && faceLandmarker) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;

          const result = faceLandmarker.detectForVideo(video, performance.now());

          if (result) {
            const canvas = canvasRef.current;
            const { w: effectiveW, h: effectiveH } = getEffectiveSize(canvas, video);

            // Sincronizar frustum si el contenedor cambió de tamaño
            if (cameraRef.current) {
              const cam = cameraRef.current;
              const frustumW = cam.right - cam.left;
              const frustumH = cam.top - cam.bottom;
              if (Math.abs(frustumW - effectiveW) > 1 || Math.abs(frustumH - effectiveH) > 1) {
                syncSceneToVideo();
              }
            }

            onFaceLandmarkerResults(
              result,
              leftEarringGroupRef.current,
              rightEarringGroupRef.current,
              effectiveW,
              effectiveH,
              setFaceDetected,
              currentProps.offsetX,
              currentProps.offsetY,
              currentProps.offsetZ,
              currentProps.sizeOffset
            );
          }
        }
      }

      const leftSubGroup = leftSubGroupRef.current;
      const rightSubGroup = rightSubGroupRef.current;
      const rotationXRad = THREE.MathUtils.degToRad(currentProps.rotationX || 0);
      const rotationYRad = THREE.MathUtils.degToRad(currentProps.rotationY || 0);
      const rotationZRad = THREE.MathUtils.degToRad(currentProps.rotationZ || 0);
      if (leftSubGroup) {
        leftSubGroup.rotation.x = rotationXRad;
        leftSubGroup.rotation.y = rotationYRad; // left positive Y
        leftSubGroup.rotation.z = rotationZRad;
      }
      if (rightSubGroup) {
        rightSubGroup.rotation.x = rotationXRad;
        rightSubGroup.rotation.y = -rotationYRad; // right opposite Y
        rightSubGroup.rotation.z = rotationZRad;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleStartCamera = useCallback(async () => {
    if (cameraStarted) return;
    setError(null);

    const camOk = await startCamera();
    if (!camOk) {
      setCameraRequested(false);
      return;
    }

    const meshOk = await initFaceLandmarker();
    if (!meshOk) {
      setCameraRequested(false);
      return;
    }

    startLoop();
    setCameraRequested(true);
    setCameraStarted(true);
  }, [cameraStarted, startCamera, initFaceLandmarker, startLoop]);

  // (Textura de video eliminada: ahora usamos el elemento HTML <video> de fondo)

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    setModelLoading(true);
    loadModelIntoGroups(modelPath);
  }, [modelPath, loadModelIntoGroups]);

  useEffect(() => {
    modelPathRef.current = modelPath;
  }, [modelPath]);

  useEffect(() => {
    propsRef.current = { offsetX, offsetY, offsetZ, sizeOffset, rotationX, rotationY, rotationZ };
  }, [offsetX, offsetY, offsetZ, sizeOffset, rotationX, rotationY, rotationZ]);

  useEffect(() => {
    const applyOpacity = (group, value) => {
      if (!group) return;
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = value < 100;
          child.material.opacity = value / 100;
        }
      });
    };
    applyOpacity(leftEarringGroupRef.current, opacity);
    applyOpacity(rightEarringGroupRef.current, opacity);
  }, [opacity, modelLoading]);

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

      if (cameraRequested) {
        const camOk = await startCamera();
        if (!camOk || !mounted) return;

        // Espera pequeña antes de arrancar la red neuronal para garantizar estabilidad del stream
        setTimeout(async () => {
          if (!mounted) return;
          const meshOk = await initFaceLandmarker();
          if (!meshOk || !mounted) return;
          startLoop();
        }, 300);
      }
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
  }, [initScene, loadModelIntoGroups]);

  // ---- Renderizado ----
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 
        El video es el fondo de la cámara. visibility:hidden en vez de display:none
        para que el navegador no detenga el stream mientras la IA lo procesa.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          borderRadius: '8px',
          visibility: cameraStarted ? 'visible' : 'hidden',
        }}
      />
      {/* Canvas siempre montado para que canvasRef esté disponible desde el inicio */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          transform: 'scaleX(-1)',
          opacity: cameraStarted ? 1 : 0,
        }}
      />
      {!cameraRequested && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          color: '#fff',
          zIndex: 20,
          textAlign: 'center',
        }}>
          <button
            type="button"
            onClick={handleStartCamera}
            style={{
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
              border: 'none',
              backgroundColor: '#ff7a59',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Iniciar cámara
          </button>
          <div style={{ maxWidth: 320, fontSize: 13, lineHeight: 1.5 }}>
            Para usar la cámara en el celular debes aceptar el permiso del navegador.
            Asegúrate de abrir la página en HTTPS o localhost para que el navegador lo considere seguro.
          </div>
        </div>
      )}
      <div className="try-on-status-container" style={{
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
