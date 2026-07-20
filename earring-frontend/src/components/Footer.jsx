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
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
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
              <span className="contact-label">Teléfonos:</span>
              <span className="contact-val">
                <a href="https://wa.me/573204163191" target="_blank" rel="noopener noreferrer">+57 320 416 3191</a>
                {" / "}
                <a href="https://wa.me/573156105706" target="_blank" rel="noopener noreferrer">+57 315 610 5706</a>
              </span>
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
