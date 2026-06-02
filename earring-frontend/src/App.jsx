import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Simulator from './pages/Simulator';

// Componente para desplazar la página hacia arriba automáticamente al cambiar de ruta
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-container">
        {/* Barra de Navegación Premium */}
        <Navbar />

        {/* Contenido Principal de las Páginas */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/simulator" element={<Simulator />} />
            {/* Fallback de redirección */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        {/* Pie de Página Premium */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
