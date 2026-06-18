import React from 'react';
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
            <TryOnEarring modelPath={selectedProduct.glbPath} showCanvas={true} />
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

            <div className="notice-text" style={{ marginTop: '20px' }}>
              El arete se ajusta automáticamente a la proporción de tu rostro y posición usando Inteligencia Artificial.
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
