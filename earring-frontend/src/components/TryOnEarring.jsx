/**
 * TryOnEarring.jsx
 * Componente de probador virtual de aretes con detección facial en tiempo real.
 *
 * Carga MediaPipe FaceMesh de forma local y calcula la posición y rotación
 * de los aretes utilizando las utilidades de tracking actualizadas.
 *
 * Renderiza con Three.js: OrthographicCamera, GLTFLoader y DRACOLoader.
 * Soporta dos aretes independientes (oreja izquierda y derecha).
 *
 * Modo de uso:
 *   <TryOnEarring modelPath="/models/arete.glb" />
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { onFaceLandmarkerResults, resetSmoothing } from '../utils/faceTrackingUtils';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// -----------------------------------------------------------------------
// Constantes de configuración
// -----------------------------------------------------------------------

/** Distancia de la cámara ortográfica al plano Z = 0 */
const CAMERA_DISTANCE = 900;
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

/**
 * Detecta si el usuario está en un dispositivo móvil.
 * Esto permite aplicar configuraciones de rendimiento diferenciadas.
 */
const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Intervalo mínimo entre llamadas a detectForVideo (en ms).
 * 16ms = ~60fps (sin throttling), 50ms = ~20fps (bajo consumo en móvil).
 * Móviles de gama baja se benefician enormemente de reducir esta frecuencia,
 * ya que cada llamada de la IA puede tardar 30-80ms en esos dispositivos.
 */
const DETECTION_INTERVAL_MS = isMobile() ? 50 : 16;

/**
 * Intervalo adaptativo máximo (ms). Si la IA tarda más de este valor en un frame,
 * el sistema automáticamente añade ese tiempo extra al siguiente intervalo.
 * Evita que dispositivos muy lentos bloqueen el hilo principal.
 */
const MAX_ADAPTIVE_INTERVAL_MS = isMobile() ? 200 : 50;

// Ya no usamos FACEMESH_OPTIONS, se configura en initFaceLandmarker

// Nota: Los desplazamientos de tracking y offsets locales de los aretes
// se calculan dinámicamente en src/utils/faceTrackingUtils.js.

// -----------------------------------------------------------------------
// Caché de modelos GLB y singleton de GLTFLoader
// -----------------------------------------------------------------------

/**
 * Caché global de modelos GLB ya procesados.
 * Clave: ruta del modelo (string). Valor: THREE.Group (escena cloneable).
 * Al ser module-level, persiste durante toda la sesión aunque el componente
 * se desmonte y remonte, evitando re-descargas y re-procesamiento.
 */
const glbCache = new Map();

/**
 * Instancia única del GLTFLoader, compartida entre todas las cargas.
 * Evita el overhead de instanciar el loader en cada cambio de modelo.
 */
let sharedLoader = null;
const getLoader = () => {
  if (!sharedLoader) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/gltf/`);
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    dracoLoader.setWorkerLimit(isMobile() ? 1 : 2);

    sharedLoader = new GLTFLoader();
    sharedLoader.setDRACOLoader(dracoLoader);
  }
  return sharedLoader;
};

/** Logger condicional: solo imprime en modo desarrollo */
const DEV = import.meta.env.DEV;
const log  = DEV ? (...a) => console.log(...a)  : () => {};
const warn = DEV ? (...a) => console.warn(...a) : () => {};
const err  = DEV ? (...a) => console.error(...a): () => {};

export default function TryOnEarring({
  modelPath = '/models/arete.glb',
  offsetX = 0,
  offsetY = 0,
  offsetZ = 0,
  sizeOffset = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
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
  /** Timestamp de la última llamada a detectForVideo */
  const lastDetectionTimeRef = useRef(0);
  /**
   * Indica si el stream de la cámara necesita rotación CSS de 90°.
   * Ocurre cuando el sensor de la cámara frontal de Android entrega pixeles
   * en landscape (ancho > alto) mientras el teléfono está en portrait.
   * En ese caso aplicamos rotate(-90deg) via CSS para corregirlo visualmente.
   */
  const videoNeedsRotationRef = useRef(false);
  const [videoTransform, setVideoTransform] = useState('scaleX(-1)');
  /** Intervalo de detección adaptativo en ms (se ajusta según rendimiento real) */
  const adaptiveIntervalRef = useRef(DETECTION_INTERVAL_MS);
  /** Ref para pausar la detección cuando la pestaña está oculta */
  const pageVisibleRef = useRef(true);

  // ---- Estado ----
  const [, setCameraReady] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // ---- Inicializar escena Three.js ----
  /**
   * Limpia los subgrupos de aretes sin disponer geometrías/materiales,
   * ya que los recursos pueden estar referenciados en la caché de modelos.
   * El dispose solo debe ocurrir cuando el componente se desmonta completamente.
   */
  const clearModelGroups = useCallback(() => {
    const clearGroup = (groupRef, modelRef) => {
      if (!groupRef) return;
      while (groupRef.children.length > 0) {
        groupRef.remove(groupRef.children[0]);
      }
      groupRef.position.set(0, 0, 0);
      groupRef.rotation.set(0, 0, 0);
      groupRef.scale.set(1, 1, 1);
      if (modelRef.current) modelRef.current = null;
    };
    clearGroup(leftSubGroupRef.current, leftModelRef);
    clearGroup(rightSubGroupRef.current, rightModelRef);
  }, []);

  /**
   * Carga un modelo GLB en los grupos de aretes izquierdo y derecho.
   *
   * Optimizaciones implementadas:
   * - Caché de modelos: si el path ya fue cargado, reutiliza el THREE.Group
   *   cacheado sin volver a ejecutar GLTFLoader.load().
   * - Singleton de loader: reutiliza una única instancia de GLTFLoader.
   * - Eliminación de doble traverse y doble position/rotation duplicados.
   */
  const loadModelIntoGroups = useCallback((path) => {
    const leftGroup = leftEarringGroupRef.current;
    const rightGroup = rightEarringGroupRef.current;
    if (!leftGroup || !rightGroup) return;

    clearModelGroups();

    const applyModelToGroups = (cachedModel, scaleFactor) => {
      const leftSubGroup = leftSubGroupRef.current;
      const rightSubGroup = rightSubGroupRef.current;
      if (!leftSubGroup || !rightSubGroup) {
        warn('⚠️ No se encontraron los subgrupos de arete para añadir el modelo.');
        return;
      }

      // Clonar desde el modelo cacheado (geometría y materiales se comparten)
      const leftModel = cachedModel.clone(true);
      leftSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
      leftSubGroup.rotation.set(0, Math.PI, 0);
      leftSubGroup.position.set(0, 0, 0);
      leftSubGroup.add(leftModel);
      leftEarringGroupRef.current.visible = true;
      leftModelRef.current = leftModel;

      const rightModel = cachedModel.clone(true);
      rightModel.scale.x *= -1;
      rightSubGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
      rightSubGroup.rotation.set(0, Math.PI, 0);
      rightSubGroup.position.set(0, 0, 0);
      rightSubGroup.add(rightModel);
      rightEarringGroupRef.current.visible = true;
      rightModelRef.current = rightModel;

      setModelLoading(false);
    };

    // ── Cache hit: modelo ya procesado anteriormente ──────────────────────
    if (glbCache.has(path)) {
      log(`⚡ Cache hit: reutilizando modelo para ${path}`);
      const { model, scaleFactor } = glbCache.get(path);
      applyModelToGroups(model, scaleFactor);
      return;
    }

    // ── Cache miss: cargar y procesar por primera vez ─────────────────────
    log(`📦 Cargando modelo por primera vez: ${path}`);
    const loader = getLoader();
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Posicionar y orientar el modelo canónico (se clonará después)
        model.position.set(-center.x, -box.max.y, -center.z);
        model.rotation.set(0, Math.PI, 0);

        // Un único traverse para configurar todos los materiales
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

        // Guardar en caché antes de añadir a la escena
        glbCache.set(path, { model, scaleFactor });
        log(`✅ Modelo cargado y cacheado: ${path}`);

        applyModelToGroups(model, scaleFactor);
      },
      undefined, // sin callback de progreso en producción (evita logs innecesarios)
      (loadErr) => {
        warn('⚠️ No se pudo cargar/decodificar el modelo .glb', loadErr);
        setModelLoading(false);

        if (leftEarringGroupRef.current) leftEarringGroupRef.current.visible = false;
        if (rightEarringGroupRef.current) rightEarringGroupRef.current.visible = false;
      }
    );
  }, [clearModelGroups]);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();

    const canvas = canvasRef.current;
    if (!canvas) {
      warn('⚠️ Canvas ref no disponible, se reintentará después');
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
      err('❌ Error creando WebGLRenderer:', webglErr);
      setError('Tu navegador no soporta WebGL. Prueba con Chrome o Edge.');
      return;
    }
    // En móviles de gama baja, limitamos el pixelRatio a 1.5 para reducir la carga
    // en la GPU. Esto reduce el número de fragmentos a rasterizar sin afectar
    // la fluidez del tracking (que va por separado).
    const maxPixelRatio = isMobile() ? 1.5 : 2;
    renderer.setSize(canvas.clientWidth || VIDEO_WIDTH, canvas.clientHeight || VIDEO_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
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

    // El frustum debe coincidir con el tamaño real del canvas (sin recortes)
    // para que la proporción (aspect ratio) de Three.js no se deforme (squish).
    // Las coordenadas de MediaPipe (effectiveW/H) luego sobresaldrán de este frustum
    // replicando exactamente el recorte (crop) que hace object-fit: cover.
    const aspect = cW / cH;
    const frustumHalfH = cH / 2;
    camera.left = -frustumHalfH * aspect;
    camera.right = frustumHalfH * aspect;
    camera.top = frustumHalfH;
    camera.bottom = -frustumHalfH;
    camera.updateProjectionMatrix();

    renderer.setSize(cW, cH, false);
    const maxPixelRatio = isMobile() ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  }, []);

  // ---- Inicializar cámara ----
  const startCamera = useCallback(async () => {
    try {
      const isPortrait = window.screen.height > window.screen.width;
      const mobile = isMobile();

      // Estrategia de resolución para móvil:
      // Los sensores de cámara frontal en Android son físicamente landscape.
      // Solicitar width < height puede causar que el driver entregue el stream
      // rotado incorrectamente (el bug de la imagen horizontal).
      //
      // Solución: SIEMPRE solicitar en formato landscape (width > height) en móvil,
      // y luego detectar si necesita rotación CSS después de cargar el stream.
      // Esto garantiza que el driver use el sensor nativo sin recorte digital.
      let idealWidth, idealHeight;
      if (mobile) {
        // En móvil siempre pedimos landscape nativo del sensor
        // Si el dispositivo está en portrait, el stream llegará "de lado"
        // y lo corregimos con CSS rotate() después de detectarlo.
        idealWidth  = 640;
        idealHeight = 480;
      } else {
        idealWidth  = isPortrait ? 720 : 1280;
        idealHeight = isPortrait ? 1280 : 720;
      }

      log(`📷 Resolución solicitada: ${idealWidth}×${idealHeight} (mobile: ${mobile}, portrait: ${isPortrait})`)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: idealWidth, max: mobile ? 1280 : 1920 },
          height: { ideal: idealHeight, max: mobile ? 720 : 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;

      // Esperar a que el video esté en el DOM
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          const vid = videoRef.current;
          if (!vid) return;

          const streamW = vid.videoWidth;
          const streamH = vid.videoHeight;
          const deviceIsPortrait = window.screen.height > window.screen.width;

          // Detectar si el stream está en landscape pero el dispositivo en portrait:
          // Esto indica que el driver entregó pixeles sin rotar y necesitamos
          // compensar visualmente con CSS transform.
          const streamIsLandscape = streamW > streamH;
          const needsRotation = mobile && deviceIsPortrait && streamIsLandscape;
          videoNeedsRotationRef.current = needsRotation;

          if (needsRotation) {
            log(`🔄 Stream landscape (${streamW}×${streamH}) en dispositivo portrait → aplicando rotate(-90deg)`);
            setVideoTransform('scaleX(-1) rotate(-90deg)');
          } else {
            setVideoTransform('scaleX(-1)');
          }

          syncSceneToVideo();
        };
        try {
          await videoRef.current.play();
          log('✅ Cámara iniciada correctamente');
          syncSceneToVideo();
        } catch (playErr) {
          warn('⚠️ play() interrumpido:', playErr);
        }
      } else {
        warn('⚠️ videoRef no disponible, reintentando...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch { /* ignore */ }
        }
      }
      setCameraReady(true);
      return true;
    } catch (cameraErr) {
      err('❌ Error cámara:', cameraErr);
      let msg = 'No se pudo acceder a la cámara. ';
      if (cameraErr.name === 'NotAllowedError' || cameraErr.name === 'PermissionDeniedError') {
        msg += 'Permiso denegado. Acepta los permisos de cámara en tu navegador.';
      } else if (cameraErr.name === 'NotFoundError') {
        msg += 'No se encontró una cámara en este dispositivo.';
      } else if (cameraErr.name === 'NotReadableError') {
        msg += 'La cámara está siendo usada por otra aplicación o pestaña.';
      } else {
        msg += cameraErr.message || 'Error desconocido';
      }
      setError(msg);
      return false;
    }
  }, [syncSceneToVideo]);

  // ---- Inicializar MediaPipe FaceLandmarker ----
  const initFaceLandmarker = useCallback(async () => {
    const tryCreate = async (delegate) => {
      log(`📦 Cargando MediaPipe FaceLandmarker (delegate: ${delegate})...`);
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate,
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });
    };

    try {
      const faceLandmarker = await tryCreate('GPU');
      faceLandmarkerRef.current = faceLandmarker;
      log('✅ FaceLandmarker iniciado con GPU delegate');
      return true;
    } catch (gpuErr) {
      warn('⚠️ GPU delegate falló, intentando con CPU delegate...', gpuErr.message);
      try {
        const faceLandmarker = await tryCreate('CPU');
        faceLandmarkerRef.current = faceLandmarker;
        log('✅ FaceLandmarker iniciado con CPU delegate (modo compatibilidad)');
        return true;
      } catch (cpuErr) {
        err('❌ Error inicializando FaceLandmarker:', cpuErr);
        setError('Error al inicializar la detección facial. Verifica tu conexión a internet.');
        return false;
      }
    }
  }, []);

  // ---- Bucle de animación ----
  const startLoop = useCallback(() => {
    if (animationIdRef.current) return;
    isRunningRef.current = true;

    // ── Page Visibility API: pausar detección IA cuando la pestaña está oculta ────
    // Esto ahorra CPU/GPU significativamente en dispositivos móviles cuando el usuario
    // cambia de pestaña o bloquea la pantalla.
    const handleVisibilityChange = () => {
      pageVisibleRef.current = document.visibilityState === 'visible';
      log(`📱 Página ${pageVisibleRef.current ? 'visible' : 'oculta'} → detección ${pageVisibleRef.current ? 'reanudada' : 'pausada'}`);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Bucle de detección IA (throttled + adaptativo) ──────────────────────────
    // Intervalo adaptativo: mide el tiempo real de cada llamada y ajusta el siguiente
    // intervalo para evitar bloquear el hilo principal en dispositivos lentos.
    const runDetection = async () => {
      if (!isRunningRef.current) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        return;
      }

      // Saltear detección si la pestaña está oculta (ahorra batería y CPU)
      if (!pageVisibleRef.current) {
        setTimeout(runDetection, 250);
        return;
      }

      const now = performance.now();
      const timeSinceLast = now - lastDetectionTimeRef.current;

      const video = videoRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        faceLandmarker &&
        timeSinceLast >= adaptiveIntervalRef.current
      ) {
        lastDetectionTimeRef.current = now;
        const detectionStart = performance.now();

        try {
          const result = faceLandmarker.detectForVideo(video, now);
          if (result) {
            const canvas = canvasRef.current;
            const cW = canvas ? canvas.clientWidth : VIDEO_WIDTH;
            const cH = canvas ? canvas.clientHeight : VIDEO_HEIGHT;
            const { w: effectiveW, h: effectiveH } = getEffectiveSize(canvas, video);

            // Sincronizar frustum si el contenedor cambió de tamaño
            if (cameraRef.current) {
              const cam = cameraRef.current;
              const frustumW = cam.right - cam.left;
              const frustumH = cam.top - cam.bottom;
              if (Math.abs(frustumW - cW) > 1 || Math.abs(frustumH - cH) > 1) {
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
              propsRef.current.offsetX,
              propsRef.current.offsetY,
              propsRef.current.offsetZ,
              propsRef.current.sizeOffset
            );
          }
        } catch (detectionErr) {
          warn('⚠️ Error en detección facial:', detectionErr);
        }

        // Intervalo adaptativo: si la detección tardó más del intervalo base,
        // ampliar el próximo intervalo para dejar respirar al hilo principal.
        const detectionMs = performance.now() - detectionStart;
        if (detectionMs > DETECTION_INTERVAL_MS) {
          adaptiveIntervalRef.current = Math.min(
            detectionMs * 1.2,  // añadir 20% de margen
            MAX_ADAPTIVE_INTERVAL_MS
          );
        } else {
          // Recuperar intervalo base si el rendimiento mejora
          adaptiveIntervalRef.current = Math.max(
            DETECTION_INTERVAL_MS,
            adaptiveIntervalRef.current * 0.95  // reducir gradualmente
          );
        }
      }

      if (isRunningRef.current) {
        setTimeout(runDetection, adaptiveIntervalRef.current);
      } else {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };

    runDetection();

    // ── Bucle de renderizado (60fps) ──────────────────────────────────────────
    const animate = () => {
      if (!isRunningRef.current) return;

      const currentProps = propsRef.current;
      const leftSubGroup = leftSubGroupRef.current;
      const rightSubGroup = rightSubGroupRef.current;
      const rotationXRad = THREE.MathUtils.degToRad(currentProps.rotationX || 0);
      const rotationYRad = THREE.MathUtils.degToRad(currentProps.rotationY || 0);
      const rotationZRad = THREE.MathUtils.degToRad(currentProps.rotationZ || 0);
      if (leftSubGroup) {
        leftSubGroup.rotation.x = rotationXRad;
        leftSubGroup.rotation.y = rotationYRad;
        leftSubGroup.rotation.z = rotationZRad;
      }
      if (rightSubGroup) {
        rightSubGroup.rotation.x = rotationXRad;
        rightSubGroup.rotation.y = -rotationYRad;
        rightSubGroup.rotation.z = rotationZRad;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [getEffectiveSize, syncSceneToVideo]);

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
      log('🧹 Recursos del probador AR liberados');
    };
  }, [initScene, loadModelIntoGroups]);

  // ---- Renderizado ----
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 
        El video es el fondo de la cámara. visibility:hidden en vez de display:none
        para que el navegador no detenga el stream mientras la IA lo procesa.
        videoTransform incluye:
          - scaleX(-1): efecto espejo (cámara frontal)
          - rotate(-90deg): corrección cuando el driver Android entrega landscape en portrait
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
          transform: videoTransform,
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
          transform: 'scaleX(-1)',  // el canvas Three.js siempre se espeja (no necesita rotate)
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
            Para usar la cámara en el dispositivo debes aceptar el permiso del navegador.
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
