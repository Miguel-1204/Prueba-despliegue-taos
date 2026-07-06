import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import TryOnEarring from '../components/TryOnEarring';
import './Simulator.css';

export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();

  const productsWith3D = products.filter((p) => p.glbPath);
  const productParam = searchParams.get('product');
  const selectedProduct = productParam
    ? productsWith3D.find((p) => p.id === productParam) || productsWith3D[0]
    : productsWith3D[0];

  const [earringSizeOffset, setEarringSizeOffset] = useState(0);
  const [earringOpacity, setEarringOpacity] = useState(100);
  const [earringOffsetX, setEarringOffsetX] = useState(0);
  const [earringOffsetY, setEarringOffsetY] = useState(0);
  const [earringOffsetZ, setEarringOffsetZ] = useState(0);
  const [earringRotationX, setEarringRotationX] = useState(0);
  const [earringRotationY, setEarringRotationY] = useState(0);
  const [earringRotationZ, setEarringRotationZ] = useState(0);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const handleProductChange = (prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  };

  return (
    <div className="simulator-page animate-fade-in">
      <div className="container simulator-grid">
        <section className="simulator-viewport-column">
          <div className="viewport-header">
            <h2 className="ar-title">✧ Filtro de Prueba AR ✧</h2>
          </div>

          {/* Renderizamos el nuevo componente que se encarga de todo el AR */}
          <div className="simulator-viewport ar-viewport">
            <TryOnEarring 
              modelPath={selectedProduct.glbPath} 
              showCanvas={true} 
              sizeOffset={earringSizeOffset}
              offsetX={earringOffsetX}
              offsetY={earringOffsetY}
              offsetZ={earringOffsetZ}
              rotationX={earringRotationX}
              rotationY={earringRotationY}
              rotationY={earringRotationY}
              rotationZ={earringRotationZ}
              opacity={earringOpacity}
            />
            {/* Pill flotante para móvil */}
            <div className="mobile-probando-now-pill">
              <span className="pill-tag">PROBANDO AHORA</span>
              <span className="pill-name">{selectedProduct.name}</span>
            </div>
          </div>

        </section>

        <section className="simulator-controls-column">
          <div className="control-card shadow-card">
            <div className="bottom-sheet-handle"></div>
            
            <div className="selected-product-header">
              <span className="control-label">PROBANDO AHORA:</span>
              <h3 className="control-product-name">{selectedProduct.name}</h3>
              <span className="control-product-collection">{selectedProduct.collection}</span>
              <div className="control-product-price">{selectedProduct.priceFormatted}</div>
            </div>

            <div className="notice-text" style={{ marginTop: '10px' }}>
              El arete se ajusta automáticamente a la proporción de tu rostro y posición usando Inteligencia Artificial.
            </div>

            <div className="adjustment-sliders-toggle-wrapper">
              <button 
                type="button"
                className="mobile-settings-toggle"
                onClick={() => setShowMobileSettings(!showMobileSettings)}
              >
                {showMobileSettings ? 'Ocultar Ajustes' : 'Ajustar Filtro ⯆'}
              </button>
            </div>

            <div className={`adjustment-sliders ${showMobileSettings ? 'visible' : 'collapsed'}`}>
              <h4 className="control-section-heading">Ajustar Filtro</h4>
              
              <div className="slider-group">
                <label>Tamaño: <span>{earringSizeOffset > 0 ? '+' : ''}{earringSizeOffset}%</span></label>
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
                <label>Opacidad: <span>{earringOpacity}%</span></label>
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

              <div className="slider-group">
                <label>Rotación X: <span>{earringRotationX > 0 ? '+' : ''}{earringRotationX}°</span></label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={earringRotationX}
                  onChange={(e) => setEarringRotationX(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>
              <div className="slider-group">
                <label>Rotación Y: <span>{earringRotationY > 0 ? '+' : ''}{earringRotationY}°</span></label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={earringRotationY}
                  onChange={(e) => setEarringRotationY(Number(e.target.value))}
                  className="simulator-slider"
                />
              </div>
              <div className="slider-group">
                <label>Rotación Z: <span>{earringRotationZ > 0 ? '+' : ''}{earringRotationZ}°</span></label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={earringRotationZ}
                  onChange={(e) => setEarringRotationZ(Number(e.target.value))}
                  className="simulator-slider"
                />
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
