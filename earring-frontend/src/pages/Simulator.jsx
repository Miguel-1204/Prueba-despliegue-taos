import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { products } from '../data/products';
import * as THREE from 'three';
import './Simulator.css';

const earringModelUrl = new URL('../assets/TAOS_img/3D/ornate jewelry pendant 3d model_Clone1.glb', import.meta.url).href;

export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // AR State
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [threeReady, setThreeReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Derivar arete seleccionado directamente de la URL
  const productParam = searchParams.get('product');
  const selectedProduct = productParam ? (products.find(p => p.id === productParam) || products[0]) : products[0];

  const handleProductChange = (prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  };
  
  // Controles de ajuste del arete
  const [earringSizeOffset, setEarringSizeOffset] = useState(0); // Ajuste fino manual
  const [earringOpacity, setEarringOpacity] = useState(100); // en porcentaje
  const [showMirrorEarring, setShowMirrorEarring] = useState(true); // por defecto el par completo
  const [earringOffsetX, setEarringOffsetX] = useState(0); // ajuste horizontal en píxeles
  const [earringOffsetY, setEarringOffsetY] = useState(0); // ajuste vertical en píxeles
  const [earringOffsetZ, setEarringOffsetZ] = useState(0); // ajuste de profundidad

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const threeRendererRef = useRef(null);
  const threeSceneRef = useRef(null);
  const threeCameraRef = useRef(null);
  const leftEarringRef = useRef(null);
  const rightEarringRef = useRef(null);
  const threeScaleBaseRef = useRef(1);
  const prevLeftAnchorRef = useRef(null);
  const prevRightAnchorRef = useRef(null);
  
  // Para suavizado (Exponential Moving Average)
  const smoothedLeftRef = useRef(null);
  const smoothedRightRef = useRef(null);
  const smoothedScaleRef = useRef(null);

  // Inicializar MediaPipe
  const initMediaPipe = async () => {
    if (faceLandmarkerRef.current) return;
    
    setIsModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      // Intentamos inicializar con GPU
      try {
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        faceLandmarkerRef.current = landmarker;
      } catch (gpuError) {
        console.warn("GPU FaceLandmarker falló, intentando CPU...", gpuError);
        const landmarkerCPU = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        faceLandmarkerRef.current = landmarkerCPU;
      }
      
      setModelLoaded(true);
    } catch (err) {
      console.error("Error al cargar MediaPipe:", err);
      setCameraError("No pudimos cargar el modelo de Inteligencia Artificial para el filtro.");
    } finally {
      setIsModelLoading(false);
    }
  };

  const initThree = async () => {
    if (!canvasRef.current) return;
    if (threeRendererRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    threeRendererRef.current = renderer;

    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(
      canvas.clientWidth / -2,
      canvas.clientWidth / 2,
      canvas.clientHeight / 2,
      canvas.clientHeight / -2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    threeCameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 100, 100);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, -100, 100);
    scene.add(pointLight);

    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      loader.load(
        earringModelUrl,
        (gltf) => {
          const original = gltf.scene;
          const box = new THREE.Box3().setFromObject(original);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          original.position.sub(center);
          original.position.y -= size.y / 2;
          original.rotation.set(-Math.PI / 2, 0, 0);

          const leftGroup = new THREE.Group();
          leftGroup.add(original);

          const rightGroup = new THREE.Group();
          const mirrored = original.clone(true);
          mirrored.scale.x = -1;
          rightGroup.add(mirrored);

          const baseScale = 1 / maxDim;
          threeScaleBaseRef.current = baseScale;
          leftGroup.scale.setScalar(baseScale);
          rightGroup.scale.set(baseScale, baseScale, baseScale);
          scene.add(leftGroup);
          scene.add(rightGroup);

          leftEarringRef.current = leftGroup;
          rightEarringRef.current = rightGroup;
          setThreeReady(true);
        },
        undefined,
        (error) => {
          console.error('Error cargando el modelo 3D:', error);
          setCameraError('No pudimos cargar el modelo 3D local.');
        }
      );
    } catch (error) {
      console.error('Error inicializando Three.js:', error);
      setCameraError('Error interno al inicializar el visor 3D.');
    }
  };

  const applyModelOpacity = (opacity) => {
    [leftEarringRef.current, rightEarringRef.current].forEach((group) => {
      if (!group) return;
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = opacity < 100;
          child.material.opacity = opacity / 100;
        }
      });
    });
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' 
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Reproducir para asegurar que el video fluye antes de detectar
        videoRef.current.play();
      }
      setCameraActive(true);
      
      // Iniciar el modelo
      await initMediaPipe();
      
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No pudimos acceder a tu cámara. Asegúrate de otorgar permisos o intenta en otro navegador.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
    // Reiniciar suavizado
    smoothedLeftRef.current = null;
    smoothedRightRef.current = null;
    smoothedScaleRef.current = null;
  };

  // Efecto global para controlar encendido/apagado al montar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cameraActive && modelLoaded) {
      initThree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, modelLoaded]);

  useEffect(() => {
    if (threeReady) {
      applyModelOpacity(earringOpacity);
    }
  }, [earringOpacity, threeReady]);

  // Lógica de cálculo y suavizado (EMA)
  const applySmoothing = (prev, current, alpha = 0.4) => {
    if (!prev) return current;
    return {
      x: prev.x + alpha * (current.x - prev.x),
      y: prev.y + alpha * (current.y - prev.y)
    };
  };

  const applySmoothing3D = (prev, current, alpha = 0.4) => {
    if (!prev) return current;
    return {
      x: prev.x + alpha * (current.x - prev.x),
      y: prev.y + alpha * (current.y - prev.y),
      z: prev.z + alpha * (current.z - prev.z)
    };
  };

  // Render Loop para AR
  const renderLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
      canvas.width = width;
      canvas.height = height;
      if (threeRendererRef.current) {
        threeRendererRef.current.setSize(width, height, false);
      }
      if (threeCameraRef.current) {
        const cam = threeCameraRef.current;
        cam.left = -width / 2;
        cam.right = width / 2;
        cam.top = height / 2;
        cam.bottom = -height / 2;
        cam.updateProjectionMatrix();
      }
    }

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.faceLandmarks[0];

        const faceTop = landmarks[10];
        const faceBottom = landmarks[152];
        const dx = faceBottom.x - faceTop.x;
        const dy = faceBottom.y - faceTop.y;
        const faceHeightRaw = Math.sqrt(dx * dx + dy * dy);

        const currentScale = applySmoothing(
          { x: smoothedScaleRef.current, y: 0 },
          { x: faceHeightRaw, y: 0 },
          0.2
        ).x;
        smoothedScaleRef.current = currentScale;

        const baseSize = currentScale * Math.min(width, height) * 0.25;
        const finalEarringSize = Math.max(20, baseSize + earringSizeOffset);

        const leftEarTragus = landmarks[454];
        const rawLeftLobe = {
          x: leftEarTragus.x * width,
          y: (leftEarTragus.y * height) + (currentScale * height * 0.06),
          z: (leftEarTragus.z || 0) * width * 0.22
        };

        const rightEarTragus = landmarks[234];
        const rawRightLobe = {
          x: rightEarTragus.x * width,
          y: (rightEarTragus.y * height) + (currentScale * height * 0.06),
          z: (rightEarTragus.z || 0) * width * 0.22
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

        const smoothLeft = applySmoothing3D(smoothedLeftRef.current, rawLeftLobe, 0.35);
        const smoothRight = applySmoothing3D(smoothedRightRef.current, rawRightLobe, 0.35);
        smoothedLeftRef.current = smoothLeft;
        smoothedRightRef.current = smoothRight;

        const prevLeft = prevLeftAnchorRef.current;
        const prevRight = prevRightAnchorRef.current;
        const leftVelocity = prevLeft ? {
          x: smoothLeft.x - prevLeft.x,
          y: smoothLeft.y - prevLeft.y,
          z: smoothLeft.z - prevLeft.z
        } : { x: 0, y: 0, z: 0 };
        const rightVelocity = prevRight ? {
          x: smoothRight.x - prevRight.x,
          y: smoothRight.y - prevRight.y,
          z: smoothRight.z - prevRight.z
        } : { x: 0, y: 0, z: 0 };

        const leftSwing = {
          x: -leftVelocity.x * 0.08,
          y: Math.max(0, -leftVelocity.y) * 0.05,
          z: -leftVelocity.z * 0.05
        };
        const rightSwing = {
          x: -rightVelocity.x * 0.08,
          y: Math.max(0, -rightVelocity.y) * 0.05,
          z: -rightVelocity.z * 0.05
        };

        if (leftEarringRef.current) {
          leftEarringRef.current.position.set(
            smoothLeft.x - width / 2 + earringOffsetX + leftSwing.x,
            height / 2 - smoothLeft.y + earringOffsetY + leftSwing.y,
            smoothLeft.z + earringOffsetZ + leftSwing.z
          );
          leftEarringRef.current.rotation.set(
            facePitch,
            faceYaw,
            earLineAngle
          );
          leftEarringRef.current.visible = showMirrorEarring && leftEarVisible;
          const scaleValue = threeScaleBaseRef.current * finalEarringSize;
          leftEarringRef.current.scale.set(scaleValue, scaleValue, scaleValue);
        }

        if (rightEarringRef.current) {
          rightEarringRef.current.position.set(
            smoothRight.x - width / 2 + earringOffsetX + rightSwing.x,
            height / 2 - smoothRight.y + earringOffsetY + rightSwing.y,
            smoothRight.z + earringOffsetZ + rightSwing.z
          );
          rightEarringRef.current.rotation.set(
            facePitch,
            faceYaw,
            earLineAngle
          );
          rightEarringRef.current.visible = rightEarVisible;
          const scaleValue = threeScaleBaseRef.current * finalEarringSize;
          rightEarringRef.current.scale.set(scaleValue, scaleValue, scaleValue);
        }

        prevLeftAnchorRef.current = { ...smoothLeft };
        prevRightAnchorRef.current = { ...smoothRight };
      } else {
        setFaceDetected(false);
        if (leftEarringRef.current) leftEarringRef.current.visible = false;
        if (rightEarringRef.current) rightEarringRef.current.visible = false;
      }
    }

    if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
      threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
    }

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [earringSizeOffset, earringOpacity, showMirrorEarring]);

  useEffect(() => {
    if (cameraActive && modelLoaded) {
      requestRef.current = requestAnimationFrame(renderLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cameraActive, modelLoaded, renderLoop]);

  // Tomar captura de pantalla (Descargar simulador)
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Crear un canvas de captura final
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    const video = videoRef.current;
    
    exportCanvas.width = video.videoWidth;
    exportCanvas.height = video.videoHeight;

    // 1. Dibujar el video, pero ESPEJADO horizontalmente para que luzca igual a lo que ve el usuario (el CSS lo espeja)
    ctx.translate(exportCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
    // Restaurar transformación para que el arete (que ya se calculó sobre el frame no-espejado) se dibuje correctamente
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // 2. Dibujar el canvas superpuesto de los aretes (pero este tmb debe ser espejado, ya que sus coordenadas X se calcularon normales)
    ctx.translate(exportCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvasRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 3. Marca de agua TAOS (opcional, en una esquina)
    ctx.fillStyle = "rgba(197, 168, 128, 0.8)";
    ctx.font = "bold 24px Arial";
    ctx.fillText("TAOS", 20, 40);

    const link = document.createElement('a');
    link.download = `TAOS-probador-virtual-${selectedProduct.id}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="simulator-page animate-fade-in">
      <div className="container simulator-grid">
        
        {/* LADO IZQUIERDO: VISUALIZADOR DE CÁMARA (AR) */}
        <section className="simulator-viewport-column">
          <div className="viewport-header">
            <h2 className="ar-title">✧ Filtro de Prueba AR ✧</h2>
            <div className={`status-badge ${faceDetected ? 'status-ok' : 'status-waiting'}`}>
              {faceDetected ? 'Rostro Detectado' : 'Buscando Rostro...'}
            </div>
          </div>

          {cameraError && <div className="camera-error-banner">{cameraError}</div>}
          
          {isModelLoading && (
            <div className="ar-loading-overlay">
              <div className="spinner"></div>
              <p>Cargando modelo de Inteligencia Artificial...</p>
              <p style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', textAlign: 'center', padding: '0 1rem'}}>
                Esto puede tardar unos segundos la primera vez que entras. <br/>Asegúrate de tener buena conexión.
              </p>
            </div>
          )}

          {/* El Viewport Principal AR */}
          <div className="simulator-viewport ar-viewport">
            {/* Feed de la Cámara Web */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="webcam-feed"
            ></video>

            {/* Canvas donde MediaPipe dibuja los aretes */}
            <canvas 
              ref={canvasRef}
              className="ar-overlay-canvas"
            ></canvas>

            {/* Instrucción Overlay */}
            {!faceDetected && !isModelLoading && !cameraError && (
              <div className="viewport-instruction-overlay">
                Por favor, sitúa tu rostro frente a la cámara
              </div>
            )}
          </div>

          {/* Acciones de la cámara */}
          <div className="viewport-actions">
            <button className="gold-btn capture-btn" onClick={handleCapture} disabled={!faceDetected}>
              📸 Descargar Foto
            </button>
          </div>
        </section>

        {/* LADO DERECHO: BARRA LATERAL DE CONTROL Y SELECCIÓN DE PRODUCTOS */}
        <section className="simulator-controls-column">
          <div className="control-card shadow-card">
            <div className="selected-product-header">
              <span className="control-label">PROBANDO AHORA:</span>
              <h3 className="control-product-name">{selectedProduct.name}</h3>
              <span className="control-product-collection">{selectedProduct.collection}</span>
              <div className="control-product-price">{selectedProduct.priceFormatted}</div>
            </div>

            {/* Ajustes de AR */}
            <div className="adjustment-sliders">
              <h4 className="control-section-heading">Ajustar Filtro</h4>
              
              <div className="slider-group">
                <label>Tamaño Relativo: <span>{earringSizeOffset > 0 ? '+' : ''}{earringSizeOffset}</span></label>
                <input 
                  type="range" 
                  min="-50" 
                  max="100" 
                  value={earringSizeOffset} 
                  onChange={(e) => setEarringSizeOffset(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="slider-group">
                <label>Opacidad/Realismo: <span>{earringOpacity}%</span></label>
                <input 
                  type="range" 
                  min="30" 
                  max="100" 
                  value={earringOpacity} 
                  onChange={(e) => setEarringOpacity(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="slider-group">
                <label>Desplazamiento X: <span>{earringOffsetX}px</span></label>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  value={earringOffsetX}
                  onChange={(e) => setEarringOffsetX(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="slider-group">
                <label>Desplazamiento Y: <span>{earringOffsetY}px</span></label>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  value={earringOffsetY}
                  onChange={(e) => setEarringOffsetY(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="slider-group">
                <label>Profundidad Z: <span>{earringOffsetZ}px</span></label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={earringOffsetZ}
                  onChange={(e) => setEarringOffsetZ(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="notice-text">
                El arete se orienta automáticamente con la cabeza. Usa X/Y/Z solo para ajustar la posición del anclaje.
              </div>

              <div className="toggle-group">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={showMirrorEarring} 
                    onChange={(e) => setShowMirrorEarring(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Probar el par completo (2 aretes)
                </label>
              </div>
            </div>
          </div>

          {/* Catálogo rápido para alternar de arete */}
          <div className="quick-catalog-card shadow-card">
            <h4 className="control-section-heading">Cambiar de Arete</h4>
            <div className="quick-catalog-grid">
              {products.map((prod) => (
                <div 
                  key={prod.id} 
                  className={`quick-product-item ${selectedProduct.id === prod.id ? 'active' : ''}`}
                  onClick={() => handleProductChange(prod)}
                >
                  <img src={prod.image} alt={prod.name} className="quick-product-img" />
                  <span className="quick-product-name">{prod.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="back-to-store">
            <Link to="/catalog" className="back-link">
              ← Volver a la Tienda Completa
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
