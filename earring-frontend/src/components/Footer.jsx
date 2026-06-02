import { Link } from 'react-router-dom';
import logo from '../assets/LOGO_PNG.png';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer animate-fade-in">
      <div className="footer-container container">
        {/* Brand Section */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo-container">
            <img src={logo} alt="TAOS Joyería Logo" className="footer-logo" />
            <span className="footer-brand-name">TAOS</span>
          </Link>
          <p className="footer-tagline">
            Joyas artesanales premium creadas con pasión y esculpidas a mano, inspiradas en la flora y fauna de nuestra hermosa tierra.
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Instagram">
              <span className="social-icon">IG</span>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook">
              <span className="social-icon">FB</span>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Pinterest">
              <span className="social-icon">PT</span>
            </a>
            <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
              <span className="social-icon">WA</span>
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="footer-nav">
          <h4 className="footer-heading">Navegación</h4>
          <ul className="footer-list">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalog">Catálogo de Joyas</Link></li>
            <li><Link to="/simulator">Probador Virtual 3D</Link></li>
          </ul>
        </div>

        {/* Collections Links */}
        <div className="footer-collections">
          <h4 className="footer-heading">Colecciones</h4>
          <ul className="footer-list">
            <li><Link to="/catalog?collection=flores-de-mi-tierra">Flores de mi Tierra</Link></li>
            <li><Link to="/catalog?collection=mariposas">Colección Mariposas</Link></li>
            <li><Link to="/catalog">Novedades</Link></li>
          </ul>
        </div>

        {/* Contact/Info */}
        <div className="footer-contact">
          <h4 className="footer-heading">Contacto</h4>
          <ul className="footer-list contact-list">
            <li>
              <span className="contact-label">Dirección:</span>
              <span className="contact-val">Calle de las Joyas #45-12, Bogotá, Colombia</span>
            </li>
            <li>
              <span className="contact-label">Teléfono:</span>
              <span className="contact-val">+57 (300) 123-4567</span>
            </li>
            <li>
              <span className="contact-label">Email:</span>
              <span className="contact-val">contacto@taosjoyeria.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container container">
          <p className="copyright">
            &copy; {currentYear} TAOS Joyería. Todos los derechos reservados. Diseñado para ofrecer elegancia eterna.
          </p>
          <div className="footer-legal">
            <a href="#privacy">Políticas de Privacidad</a>
            <a href="#terms">Términos del Servicio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
