import React, { useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import { useArSimulator } from '../hooks/useArSimulator';
import './Simulator.css';

export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [earringSizeOffset, setEarringSizeOffset] = useState(-6);
  const [earringOpacity, setEarringOpacity] = useState(100);
  const [showMirrorEarring, setShowMirrorEarring] = useState(true);
  const [earringAxisRotation, setEarringAxisRotation] = useState(-90);
  const [earringYAxisRotation, setEarringYAxisRotation] = useState(-1);
  const [earringXAxisRotation, setEarringXAxisRotation] = useState(72);
  const [earringOffsetX, setEarringOffsetX] = useState(44);
  const [earringOffsetY, setEarringOffsetY] = useState(-52);
  const [earringOffsetZ, setEarringOffsetZ] = useState(-11);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const productsWith3D = products.filter((p) => p.glbPath);
  const productParam = searchParams.get('product');
  const selectedProduct = productParam
    ? productsWith3D.find((p) => p.id === productParam) || productsWith3D[0]
    : productsWith3D[0];

  const handleProductChange = (prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  };

  const {
    cameraError,
    isModelLoading,
    loadingModel,
    modelError,
    faceDetected
  } = useArSimulator({
    videoRef,
    canvasRef,
    selectedProduct,
    earringSizeOffset,
    earringOpacity,
    showMirrorEarring,
    earringAxisRotation,
    earringYAxisRotation,
    earringXAxisRotation,
    earringOffsetX,
    earringOffsetY,
    earringOffsetZ
  });

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    const video = videoRef.current;

    exportCanvas.width = video.videoWidth;
    exportCanvas.height = video.videoHeight;

    ctx.translate(exportCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.translate(exportCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvasRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = 'rgba(197, 168, 128, 0.8)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TAOS', 20, 40);

    const link = document.createElement('a');
    link.download = `TAOS-probador-virtual-${selectedProduct.id}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="simulator-page animate-fade-in">
      <div className="container simulator-grid">
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
              <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', textAlign: 'center', padding: '0 1rem' }}>
                Esto puede tardar unos segundos la primera vez que entras. <br />Asegúrate de tener buena conexión.
              </p>
            </div>
          )}

          {loadingModel && !isModelLoading && (
            <div className="ar-loading-overlay">
              <div className="spinner"></div>
              <p>Cargando modelo 3D del arete...</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', textAlign: 'center' }}>{selectedProduct.name}</p>
            </div>
          )}

          {modelError && (
            <div className="camera-error-banner" style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', zIndex: 10 }}>
              {modelError}
            </div>
          )}

          <div className="simulator-viewport ar-viewport">
            <video ref={videoRef} autoPlay playsInline muted className="webcam-feed"></video>
            <canvas ref={canvasRef} className="ar-overlay-canvas"></canvas>
            {!faceDetected && !isModelLoading && !cameraError && (
              <div className="viewport-instruction-overlay">
                Por favor, sitúa tu rostro frente a la cámara
              </div>
            )}
          </div>

          <div className="viewport-actions">
            <button className="gold-btn capture-btn" onClick={handleCapture} disabled={!faceDetected}>
              📸 Descargar Foto
            </button>
          </div>
        </section>

        <section className="simulator-controls-column">
          <div className="control-card shadow-card">
            <div className="selected-product-header">
              <span className="control-label">PROBANDO AHORA:</span>
              <h3 className="control-product-name">{selectedProduct.name}</h3>
              <span className="control-product-collection">{selectedProduct.collection}</span>
              <div className="control-product-price">{selectedProduct.priceFormatted}</div>
            </div>

            <div className="adjustment-sliders">
              <h4 className="control-section-heading">Ajustar Filtro</h4>

              <div className="slider-group">
                <label>
                  Tamaño Relativo: <span>{earringSizeOffset > 0 ? '+' : ''}{earringSizeOffset}</span>
                </label>
                <input type="range" min="-50" max="100" value={earringSizeOffset} onChange={(e) => setEarringSizeOffset(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Opacidad/Realismo: <span>{earringOpacity}%</span>
                </label>
                <input type="range" min="30" max="100" value={earringOpacity} onChange={(e) => setEarringOpacity(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Rotación Eje Z: <span>{earringAxisRotation}°</span>
                </label>
                <input type="range" min="-90" max="90" value={earringAxisRotation} onChange={(e) => setEarringAxisRotation(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Rotación Eje Y: <span>{earringYAxisRotation}°</span>
                </label>
                <input type="range" min="-90" max="90" value={earringYAxisRotation} onChange={(e) => setEarringYAxisRotation(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Rotación Eje X: <span>{earringXAxisRotation}°</span>
                </label>
                <input type="range" min="-90" max="90" value={earringXAxisRotation} onChange={(e) => setEarringXAxisRotation(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Desplazamiento X: <span>{earringOffsetX}px</span>
                </label>
                <input type="range" min="-150" max="150" value={earringOffsetX} onChange={(e) => setEarringOffsetX(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Desplazamiento Y: <span>{earringOffsetY}px</span>
                </label>
                <input type="range" min="-150" max="150" value={earringOffsetY} onChange={(e) => setEarringOffsetY(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="slider-group">
                <label>
                  Profundidad Z: <span>{earringOffsetZ}px</span>
                </label>
                <input type="range" min="-100" max="100" value={earringOffsetZ} onChange={(e) => setEarringOffsetZ(Number(e.target.value))} className="simulator-slider" />
              </div>

              <div className="notice-text">
                El arete se orienta automáticamente con la cabeza. Usa Rotación/Y/Z para ajustar el eje y la posición del anclaje.
              </div>

              <div className="toggle-group">
                <label className="checkbox-container">
                  <input type="checkbox" checked={showMirrorEarring} onChange={(e) => setShowMirrorEarring(e.target.checked)} />
                  <span className="checkmark"></span>
                  Probar el par completo (2 aretes)
                </label>
              </div>
            </div>
          </div>

          <div className="quick-catalog-card shadow-card">
            <h4 className="control-section-heading">Cambiar de Arete</h4>
            <div className="quick-catalog-grid">
              {productsWith3D.map((prod) => (
                <div key={prod.id} className={`quick-product-item ${selectedProduct.id === prod.id ? 'active' : ''}`} onClick={() => handleProductChange(prod)}>
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
