import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collections, products } from '../data/products';
import './Home.css';

// Tomamos 3 productos destacados para la sección de destacados
const featuredProducts = products.filter(p => 
  p.id === 'flor-dorado-blanco' || 
  p.id === 'mariposa-multi-pastel' || 
  p.id === 'flor-verde-esmeralda'
);

export default function Home() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const activeHeroProduct = featuredProducts[carouselIndex] || featuredProducts[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page animate-fade-in">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-container container">
          <div className="hero-content">
            <span className="hero-subtitle">TAOS JOYERÍA ARTESANAL</span>
            <h1 className="hero-title">
              Elegancia esculpida <br />
              <span>a mano</span>
            </h1>
            <p className="hero-description">
              Descubre aretes exclusivos inspirados en la naturaleza. hechos a mano, combinando tradición y diseño contemporáneo para crear piezas únicas que realzan tu estilo.
            </p>
            <div className="hero-actions">
              <Link to="/catalog" className="gold-btn hero-btn">
                Explorar Catálogo
              </Link>
              <Link to="/simulator" className="gold-btn-outline hero-btn-secondary">
                Probador Virtual
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-circle-backdrop"></div>
            <div className="hero-carousel">
              <img
                src={activeHeroProduct.image}
                alt={activeHeroProduct.name}
                className="hero-main-img animate-scale-in"
              />
            </div>
            <div className="hero-carousel-dots">
              {featuredProducts.map((product, index) => (
                <button
                  key={product.id}
                  className={`hero-carousel-dot ${index === carouselIndex ? 'active' : ''}`}
                  onClick={() => setCarouselIndex(index)}
                  aria-label={`Ver ${product.name}`}
                />
              ))}
            </div>
            <div className="hero-badge">
              <span className="badge-title">{activeHeroProduct.name}</span>
              <span className="badge-desc">{activeHeroProduct.collection}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brand Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">✧</div>
              <h3 className="value-title">Diseño de Autor</h3>
              <p className="value-desc">Cada par de aretes es concebido como una obra de arte única, con diseños inspirados en la flora y fauna.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">❀</div>
              <h3 className="value-title">Hecho a Mano</h3>
              <p className="value-desc">Modelados y ensamblados individualmente por artesanos colombianos, cuidando cada detalle al máximo.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚜</div>
              <h3 className="value-title">Calidad Premium</h3>
              <p className="value-desc">Estructuras en bronce y latón con baño de oro de 24 quilates y plata ley 925, asegurando brillo y durabilidad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Collections Section */}
      <section className="collections-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">NUESTRAS LÍNEAS</span>
            <h2 className="section-title">Colecciones Exclusivas</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="collections-grid">
            {collections.map((collection) => (
              <div key={collection.slug} className="collection-card">
                <div className="collection-img-wrapper">
                  <img src={collection.featuredImage} alt={collection.name} className="collection-img" />
                </div>
                <div className="collection-info">
                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-desc">{collection.description}</p>
                  <Link to={`/catalog?collection=${collection.slug}`} className="collection-link">
                    Ver Colección <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products Slider/Grid */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">SELECCIÓN ESPECIAL</span>
            <h2 className="section-title">Piezas Destacadas</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="featured-item-card">
                <div className="featured-item-img-container">
                  <img src={product.image} alt={product.name} className="featured-item-img" />
                  <div className="featured-item-overlay">
                    <Link to={`/catalog?product=${product.id}`} className="gold-btn view-details-btn">
                      Ver Detalles
                    </Link>
                  </div>
                </div>
                <div className="featured-item-info">
                  <span className="featured-item-collection">{product.collection}</span>
                  <h3 className="featured-item-name">{product.name}</h3>
                  <p className="featured-item-price">{product.priceFormatted}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="featured-action">
            <Link to="/catalog" className="gold-btn-outline">
              Ver Todo el Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* 5. AR Try-on Promotion Section */}
      <section className="ar-promo-section">
        <div className="ar-promo-container container">
          <div className="ar-promo-content">
            <span className="ar-promo-tag">TECNOLOGÍA & MODA</span>
            <h2 className="ar-promo-title">Probador Virtual 3D</h2>
            <p className="ar-promo-desc">
              ¿Quieres ver cómo te lucen antes de comprarlos? Usa nuestra herramienta interactiva para probarte cualquier arete de nuestras colecciones utilizando la cámara de tu computadora o teléfono en tiempo real.
            </p>
            <Link to="/simulator" className="gold-btn ar-promo-btn">
              Pruébatelos Ahora
            </Link>
          </div>
          <div className="ar-promo-visual">
            <div className="ar-phone-frame">
              <div className="ar-phone-camera"></div>
              <div className="ar-phone-screen">
                {/* Simulamos una interfaz del probador dentro de un mock de celular */}
                <div className="ar-mock-overlay">
                  <span className="ar-mock-dot"></span>
                  <span className="ar-mock-label">CÁMARA ACTIVA</span>
                </div>
                <div className="ar-mock-earring-preview">
                  <img src={featuredProducts[1].image} alt="Earring Preview" />
                </div>
                <div className="ar-mock-face-silhouette">
                  {/* Una silueta o fondo elegante */}
                  <div className="face-oval"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
