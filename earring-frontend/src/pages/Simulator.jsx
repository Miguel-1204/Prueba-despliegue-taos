import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import './Simulator.css';

const models = [
  { id: 'model-1', name: 'Modelo Sofía', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop' },
  { id: 'model-2', name: 'Modelo Elena', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop' },
  { id: 'model-3', name: 'Modelo Isabella', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop' }
];

export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState('model'); // 'camera' or 'model'
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Derivar arete seleccionado directamente de la URL
  const productParam = searchParams.get('product');
  const selectedProduct = productParam ? (products.find(p => p.id === productParam) || products[0]) : products[0];

  const handleProductChange = (prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  };
  
  // Controles de ajuste del arete
  const [earringSize, setEarringSize] = useState(70); // en píxeles
  const [earringRotation, setEarringRotation] = useState(0); // en grados
  const [earringOpacity, setEarringOpacity] = useState(90); // en porcentaje
  const [showMirrorEarring, setShowMirrorEarring] = useState(false); // mostrar un segundo arete para la otra oreja

  // Posiciones de los aretes (en porcentaje o px dentro del contenedor)
  const [leftPosition, setLeftPosition] = useState({ x: 120, y: 220 });
  const [rightPosition, setRightPosition] = useState({ x: 260, y: 220 });

  // Refs
  const videoRef = useRef(null);
  const viewportRef = useRef(null);
  const streamRef = useRef(null);

  // Estados de arrastre
  const [dragState, setDragState] = useState({
    isActive: false,
    target: null, // 'left' or 'right'
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const startCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' 
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No pudimos acceder a tu cámara. Asegúrate de otorgar permisos o intenta en otro navegador. Usando modo modelo por defecto.');
      setMode('model');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Manejar el flujo de la cámara
  useEffect(() => {
    if (mode === 'camera' && cameraActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, cameraActive]);

  const handleModeChange = (newMode) => {
    if (newMode === 'camera') {
      setMode('camera');
      setCameraActive(true);
    } else {
      setMode('model');
      setCameraActive(false);
    }
  };

  // Drag and Drop Logic
  const handleStartDrag = (e, earringSide) => {
    e.preventDefault();
    const event = e.touches ? e.touches[0] : e;
    const currentPosition = earringSide === 'left' ? leftPosition : rightPosition;

    setDragState({
      isActive: true,
      target: earringSide,
      startX: event.clientX,
      startY: event.clientY,
      initialX: currentPosition.x,
      initialY: currentPosition.y
    });
  };

  const handleDrag = (e) => {
    if (!dragState.isActive) return;
    
    const event = e.touches ? e.touches[0] : e;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    
    // Obtener los límites del contenedor
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();

    let newX = dragState.initialX + deltaX;
    let newY = dragState.initialY + deltaY;

    // Limitar al contenedor
    newX = Math.max(0, Math.min(newX, rect.width - earringSize));
    newY = Math.max(0, Math.min(newY, rect.height - earringSize));

    if (dragState.target === 'left') {
      setLeftPosition({ x: newX, y: newY });
    } else {
      setRightPosition({ x: newX, y: newY });
    }
  };

  const handleEndDrag = () => {
    setDragState(prev => ({ ...prev, isActive: false, target: null }));
  };

  // Restablecer la posición de los aretes
  const handleResetPositions = useCallback(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const midY = rect.height / 2 - earringSize / 2;
      setLeftPosition({ x: rect.width * 0.3 - earringSize / 2, y: midY });
      setRightPosition({ x: rect.width * 0.7 - earringSize / 2, y: midY });
    }
  }, [earringSize]);

  // Ajustar posiciones iniciales al cambiar de modo o modelo
  useEffect(() => {
    // Retrasar ligeramente para permitir el render del viewport
    const timer = setTimeout(() => {
      handleResetPositions();
    }, 300);
    return () => clearTimeout(timer);
  }, [mode, selectedModel, selectedProduct, handleResetPositions]);

  // Tomar captura de pantalla (Descargar simulador)
  const handleCapture = () => {
    if (!viewportRef.current) return;

    // Crear un canvas temporal
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const viewport = viewportRef.current;
    
    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;

    // 1. Dibujar el fondo (video o imagen)
    if (mode === 'model') {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Evitar problemas de origen
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawEarringsOnCanvas(ctx);
        downloadCanvas(canvas);
      };
      img.src = selectedModel.url;
    } else if (mode === 'camera' && videoRef.current) {
      // Dibujar frame del video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1); // Espejar la imagen para que coincida con la cámara web
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Restaurar transformaciones
      
      // Dibujar aretes
      drawEarringsOnCanvas(ctx);
      downloadCanvas(canvas);
    }
  };

  const drawEarringsOnCanvas = (ctx) => {
    const earringImg = new Image();
    earringImg.onload = () => {
      ctx.globalAlpha = earringOpacity / 100;
      
      // Dibujar arete izquierdo
      ctx.save();
      ctx.translate(leftPosition.x + earringSize / 2, leftPosition.y + earringSize / 2);
      ctx.rotate((earringRotation * Math.PI) / 180);
      ctx.drawImage(
        earringImg, 
        -earringSize / 2, 
        -earringSize / 2, 
        earringSize, 
        earringSize
      );
      ctx.restore();

      // Dibujar arete derecho (espejo si está habilitado)
      if (showMirrorEarring) {
        ctx.save();
        ctx.translate(rightPosition.x + earringSize / 2, rightPosition.y + earringSize / 2);
        ctx.rotate((earringRotation * Math.PI) / 180);
        // Espejamos el arete si está en la oreja derecha
        ctx.scale(-1, 1);
        ctx.drawImage(
          earringImg, 
          -earringSize / 2, 
          -earringSize / 2, 
          earringSize, 
          earringSize
        );
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    };
    earringImg.src = selectedProduct.image;
  };

  const downloadCanvas = (canvas) => {
    const link = document.createElement('a');
    link.download = `TAOS-probador-virtual-${selectedProduct.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="simulator-page animate-fade-in">
      <div className="container simulator-grid">
        
        {/* LADO IZQUIERDO: VISUALIZADOR DE CÁMARA O MODELO */}
        <section className="simulator-viewport-column">
          <div className="viewport-header">
            <div className="mode-selector-tabs">
              <button 
                className={`mode-tab ${mode === 'model' ? 'active' : ''}`}
                onClick={() => handleModeChange('model')}
              >
                ❀ Usar Modelo
              </button>
              <button 
                className={`mode-tab ${mode === 'camera' ? 'active' : ''}`}
                onClick={() => handleModeChange('camera')}
              >
                📸 Usar Mi Cámara
              </button>
            </div>
            
            {mode === 'model' && (
              <div className="model-selectors">
                {models.map((m) => (
                  <button 
                    key={m.id}
                    className={`model-btn ${selectedModel.id === m.id ? 'active' : ''}`}
                    onClick={() => setSelectedModel(m)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {cameraError && <div className="camera-error-banner">{cameraError}</div>}

          {/* El Viewport Principal donde arrastramos los aretes */}
          <div 
            ref={viewportRef}
            className="simulator-viewport"
            onMouseMove={handleDrag}
            onTouchMove={handleDrag}
            onMouseUp={handleEndDrag}
            onTouchEnd={handleEndDrag}
            onMouseLeave={handleEndDrag}
          >
            {/* Fondo 1: Video de la Cámara Web */}
            {mode === 'camera' && (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="webcam-feed"
              ></video>
            )}

            {/* Fondo 2: Foto de la Modelo */}
            {mode === 'model' && (
              <img 
                src={selectedModel.url} 
                alt="Modelo de prueba" 
                className="model-background-img" 
                draggable="false"
              />
            )}

            {/* Instrucción Overlay */}
            <div className="viewport-instruction-overlay">
              Arrastra los aretes a tus orejas
            </div>

            {/* ARETE IZQUIERDO (SUPERPUESTO) */}
            <div 
              className={`draggable-earring ${dragState.target === 'left' ? 'dragging' : ''}`}
              style={{
                left: `${leftPosition.x}px`,
                top: `${leftPosition.y}px`,
                width: `${earringSize}px`,
                height: `${earringSize}px`,
                transform: `rotate(${earringRotation}deg)`,
                opacity: earringOpacity / 100
              }}
              onMouseDown={(e) => handleStartDrag(e, 'left')}
              onTouchStart={(e) => handleStartDrag(e, 'left')}
            >
              <img 
                src={selectedProduct.image} 
                alt="Arete Izquierdo" 
                draggable="false"
              />
              <div className="earring-handle"></div>
            </div>

            {/* ARETE DERECHO (OPCIONAL/ESPEJO) */}
            {showMirrorEarring && (
              <div 
                className={`draggable-earring right-earring ${dragState.target === 'right' ? 'dragging' : ''}`}
                style={{
                  left: `${rightPosition.x}px`,
                  top: `${rightPosition.y}px`,
                  width: `${earringSize}px`,
                  height: `${earringSize}px`,
                  transform: `rotate(${earringRotation}deg) scaleX(-1)`, // Espejado
                  opacity: earringOpacity / 100
                }}
                onMouseDown={(e) => handleStartDrag(e, 'right')}
                onTouchStart={(e) => handleStartDrag(e, 'right')}
              >
                <img 
                  src={selectedProduct.image} 
                  alt="Arete Derecho" 
                  draggable="false"
                />
                <div className="earring-handle"></div>
              </div>
            )}
          </div>

          {/* Acciones de la cámara */}
          <div className="viewport-actions">
            <button className="gold-btn-outline icon-btn" onClick={handleResetPositions}>
              Restablecer Posición
            </button>
            <button className="gold-btn capture-btn" onClick={handleCapture}>
              💾 Descargar Foto de Prueba
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

            {/* Ajustes de escala y rotación */}
            <div className="adjustment-sliders">
              <h4 className="control-section-heading">Ajustar Arete</h4>
              
              <div className="slider-group">
                <label>Tamaño: <span>{earringSize}px</span></label>
                <input 
                  type="range" 
                  min="30" 
                  max="150" 
                  value={earringSize} 
                  onChange={(e) => setEarringSize(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>

              <div className="slider-group">
                <label>Rotación: <span>{earringRotation}°</span></label>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  value={earringRotation} 
                  onChange={(e) => setEarringRotation(Number(e.target.value))}
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
