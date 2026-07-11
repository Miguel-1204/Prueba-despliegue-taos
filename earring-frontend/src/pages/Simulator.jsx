import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import TryOnEarring from '../components/TryOnEarring';
import './Simulator.css';

export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();

  const productsWith3D = useMemo(() => products.filter((p) => p.glbPath), []);
  const productParam = searchParams.get('product');
  const selectedProduct = useMemo(() => {
    return productParam
      ? productsWith3D.find((p) => p.id === productParam) || productsWith3D[0]
      : productsWith3D[0];
  }, [productParam, productsWith3D]);

  const [earringSizeOffset, setEarringSizeOffset] = useState(20);
  const earringOpacity = 100;
  const [earringOffsetX, setEarringOffsetX] = useState(0);
  const [earringOffsetY, setEarringOffsetY] = useState(0);
  const earringOffsetZ = 0;
  const earringRotationX = 0;
  const [earringRotationY, setEarringRotationY] = useState(-30);
  const earringRotationZ = 0;
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const handleProductChange = useCallback((prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setEarringSizeOffset(20);
                  setEarringOffsetX(0);
                  setEarringOffsetY(0);
                  setEarringRotationY(-30);
                }}
                aria-label="Restablecer ajustes"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: 'var(--logo-purple)',
                }}
              >
                ↺
              </button>
            </div>

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
              <label>Desplazamiento horizontal: <span>{earringOffsetX}px</span></label>
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
              <label>Desplazamiento vertical: <span>{earringOffsetY}px</span></label>
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
              <label>Rotación: <span>{earringRotationY > 0 ? '+' : ''}{earringRotationY}°</span></label>
              <input
                type="range"
                min="-180"
                max="180"
                value={earringRotationY}
                onChange={(e) => setEarringRotationY(Number(e.target.value))}
                className="simulator-slider"
              />
            </div>
          </div>
          </div>

          <QuickCatalog
            products={productsWith3D}
            selectedProductId={selectedProduct.id}
            onProductChange={handleProductChange}
          />

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

// Componente memoizado para evitar el re-renderizado costoso de todo el catálogo rápido al mover sliders
const QuickCatalog = React.memo(({ products, selectedProductId, onProductChange }) => {
  return (
    <div className="quick-catalog-card shadow-card">
      <h4 className="control-section-heading">Cambiar de Arete</h4>
      <div className="quick-catalog-grid">
        {products.map((prod) => (
          <div
            key={prod.id}
            className={`quick-product-item ${selectedProductId === prod.id ? 'active' : ''}`}
            onClick={() => onProductChange(prod)}
          >
            <img src={prod.image} alt={prod.name} className="quick-product-img" />
            <span className="quick-product-name">{prod.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
