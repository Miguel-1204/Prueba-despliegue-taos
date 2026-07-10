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
            <a href="https://www.instagram.com/taosjoyeria?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Instagram">
              <span className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </span>
            </a>
            <a href="https://www.facebook.com/accesoriostaos" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook">
              <span className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </span>
            </a>
            <a href="https://Wa.me/+573204163191" target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
              <span className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </span>
            </a>
            <a href="https://www.tiktok.com/@taosjoyeria?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en TikTok">
              <span className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5.58 4.5"></path></svg>
              </span>
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
              <span className="contact-val">CALLE 7 # 10-07 BARRIO ALTICO -NEIVA</span>
            </li>
            <li>
              <span className="contact-label">Teléfono:</span>
              <span className="contact-val">+57 320 416 3191</span>
            </li>
            <li>
              <span className="contact-label">Email:</span>
              <span className="contact-val">joyasyaccesoriostaos@gmail.com</span>
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
