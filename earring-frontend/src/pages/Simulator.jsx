import { useState } from 'react';
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
  const [earringOffsetX, setEarringOffsetX] = useState(0);
  const [earringOffsetY, setEarringOffsetY] = useState(0);
  const [earringRotationY, setEarringRotationY] = useState(0);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const handleProductChange = (prod) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', prod.id);
    setSearchParams(newParams);
  };

  const resetSettings = () => {
    setEarringSizeOffset(0);
    setEarringOffsetX(0);
    setEarringOffsetY(0);
    setEarringRotationY(0);
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
              rotationY={earringRotationY}
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
              El arete se ajusta automáticamente a la proporción de tu rostro y posición usando Inteligencia Artificial. Si el resultado no es el esperado, puedes ajustar el filtro manualmente en la opción <strong>"Ajustar Filtro"</strong>.
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
              <div className="adjustment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h4 className="control-section-heading" style={{ margin: 0 }}>Ajustar Filtro</h4>
                <button
                  type="button"
                  className="reset-settings-btn"
                  onClick={resetSettings}
                  title="Restablecer ajustes"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--logo-purple, #6c4fa2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                  Restablecer
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
                <label>Desplazamiento Horizontal: <span>{earringOffsetX}px</span></label>
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
                <label>Desplazamiento Vertical: <span>{earringOffsetY}px</span></label>
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
