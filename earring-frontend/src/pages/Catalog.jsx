import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products, collections } from '../data/products';
import cameraIcon from '../assets/TAOS_img/svg/camera-svgrepo-com.svg';
import './Catalog.css';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Derivar estados directamente de los parámetros de búsqueda de la URL
  const selectedCollection = searchParams.get('collection') || 'all';
  const productParam = searchParams.get('product');
  const selectedProduct = productParam ? products.find(p => p.id === productParam) : null;

  // Manejar el cambio de colección
  const handleCollectionChange = (collectionSlug) => {
    const newParams = new URLSearchParams(searchParams);
    if (collectionSlug === 'all') {
      newParams.delete('collection');
    } else {
      newParams.set('collection', collectionSlug);
    }
    setSearchParams(newParams);
  };

  // Abrir modal de detalles
  const openProductDetails = (product) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('product', product.id);
    setSearchParams(newParams);
  };

  // Cerrar modal de detalles
  const closeProductDetails = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('product');
    setSearchParams(newParams);
  };

  // Filtrado y ordenamiento de productos
  const filteredProducts = products
    .filter((product) => {
      // Filtro por colección
      if (selectedCollection !== 'all' && product.collectionSlug !== selectedCollection) {
        return false;
      }
      // Filtro por búsqueda
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.collection.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Ordenamiento
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0; // Orden por defecto (id original)
    });

  return (
    <div className="catalog-page animate-fade-in">
      <div className="container">
        {/* Banner/Header de la Página */}
        <header className="catalog-header">
          <span className="catalog-subtitle">NUESTRAS PIEZAS</span>
          <h1 className="catalog-title">Colección TAOS</h1>
          <p className="catalog-desc">
            Cada pieza es diseñada y elaborada meticulosamente a mano. Explora y encuentra los aretes perfectos para complementar tu estilo.
          </p>
        </header>

        {/* Barra de Filtros y Búsqueda */}
        <section className="catalog-controls">
          <div className="collection-filters">
            <button 
              className={`filter-btn ${selectedCollection === 'all' ? 'active' : ''}`}
              onClick={() => handleCollectionChange('all')}
            >
              Todos
            </button>
            {collections.map((col) => (
              <button
                key={col.slug}
                className={`filter-btn ${selectedCollection === col.slug ? 'active' : ''}`}
                onClick={() => handleCollectionChange(col.slug)}
              >
                {col.name}
              </button>
            ))}
          </div>

          <div className="search-sort-controls">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Buscar arete..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            <div className="sort-box">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Ordenar productos"
              >
                <option value="default">Ordenar por</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name-asc">Nombre: A - Z</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contador de Productos */}
        <div className="results-count">
          Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
        </div>

        {/* Grid de Productos */}
        {filteredProducts.length > 0 ? (
          <section className="product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-img-wrapper" onClick={() => openProductDetails(product)}>
                  <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
                  <div className="product-hover-overlay">
                    <button className="gold-btn quick-view-btn">Ver Detalles</button>
                  </div>
                </div>
                
                <div className="product-info">
                  <span className="product-collection">{product.collection}</span>
                  <h3 className="product-name" onClick={() => openProductDetails(product)}>{product.name}</h3>
                  <div className="product-footer-row">
                    <span className="product-price">{product.priceFormatted}</span>
                    <Link 
                      to={`/simulator?product=${product.id}`} 
                      className="try-on-icon-link"
                      title="Probar en simulador"
                    >
                      <span className="try-on-icon-bubble">
                        <img src={cameraIcon} alt="" className="try-on-camera-icon" />
                        Pruébatelo
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="no-results animate-scale-in">
            <span className="no-results-icon">❀</span>
            <h3>No encontramos resultados</h3>
            <p>Intenta cambiar los filtros o el término de búsqueda.</p>
            <button className="gold-btn-outline" onClick={() => { setSearchQuery(''); handleCollectionChange('all'); }}>
              Restaurar filtros
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLES DEL PRODUCTO */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={closeProductDetails}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeProductDetails} aria-label="Cerrar modal">
              &times;
            </button>
            
            <div className="modal-body">
              <div className="modal-image-column">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-product-img" />
              </div>
              
              <div className="modal-info-column">
                <span className="modal-product-collection">{selectedProduct.collection}</span>
                <h2 className="modal-product-name">{selectedProduct.name}</h2>
                <div className="modal-product-price">{selectedProduct.priceFormatted}</div>
                
                <p className="modal-product-desc">{selectedProduct.description}</p>
                
                <div className="modal-specs">
                  <h4 className="specs-heading">Detalles de la joya:</h4>
                  <ul className="specs-list">
                    {selectedProduct.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="modal-actions">
                  <Link 
                    to={`/simulator?product=${selectedProduct.id}`} 
                    className="gold-btn modal-try-btn"
                  >
                    📸 Probar en el Simulador 3D
                  </Link>
                  
                  <div className="modal-delivery-info">
                    <span className="info-icon">✓</span> Envío gratis a nivel nacional | Incluye caja de regalo TAOS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
