"use client";
import { useState, useEffect } from 'react';

const getParsedArray = (str) => {
  try {
    const parsed = str ? JSON.parse(str) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [selectedBrand, setSelectedBrand] = useState(null); // 'home', 'agua', 'audio'
  const [selectedSubfilter, setSelectedSubfilter] = useState('all'); // 'all', 'audifonos', 'barra', 'bocina'
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchProducts, setGlobalSearchProducts] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedRole = localStorage.getItem('userRole');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(storedRole || 'viewer');
    }

    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('viewer');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setLoginError('El código de seguridad es incorrecto');
      setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
      setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaAnswer('');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setUserRole(data.role); // Set role
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', data.role);
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError('Error de red al intentar iniciar sesión');
    }
  };

  const handleSelectBrand = async (brand) => {
    setSelectedBrand(brand);
    setSelectedSubfilter('all'); // Reset subfilter on brand change
    try {
      const res = await fetch(`/api/products?brand=${brand}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  const handleGlobalSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success) {
          setGlobalSearchProducts(data.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setGlobalSearchProducts(null);
    }
  };

  const renderProductModal = () => {
    if (!selectedProduct) return null;
    const parsedImages = getParsedArray(selectedProduct.images).length > 0 ? getParsedArray(selectedProduct.images) : [selectedProduct.image];
    const parsedVideos = getParsedArray(selectedProduct.videos).length > 0 ? getParsedArray(selectedProduct.videos) : (selectedProduct.videoId ? [selectedProduct.videoId] : []);
    const allMedia = [
      ...parsedImages.map(url => ({ type: 'image', url })),
      ...parsedVideos.map(id => ({ type: 'video', id }))
    ];
    const activeMedia = allMedia[activeMediaIndex] || allMedia[0];

    return (
      <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
        <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', background: '#f8f9fa' }}>
            <button className="close-btn" style={{ position: 'static', color: '#333' }} onClick={() => setSelectedProduct(null)}>&times;</button>
          </div>
          
          <div style={{ display: 'flex', flex: 1, overflowY: 'auto', flexWrap: 'wrap' }}>
            {/* Left Column: Gallery */}
            <div style={{ flex: '1 1 300px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid #eee' }}>
              {/* Main Media Viewer */}
              <div style={{ width: '100%', height: '400px', background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {allMedia.length > 0 && activeMedia?.type === 'image' && (
                  <img src={activeMedia.url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
                {allMedia.length > 0 && activeMedia?.type === 'video' && (
                  <iframe
                    style={{ width: '100%', height: '100%' }}
                    src={`https://www.youtube.com/embed/${activeMedia.id}?autoplay=0&rel=0&modestbranding=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
              </div>

              {/* Thumbnails */}
              {allMedia.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {allMedia.map((media, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveMediaIndex(idx)}
                      style={{ 
                        width: '60px', height: '60px', flexShrink: 0, border: activeMediaIndex === idx ? '2px solid var(--primary-color)' : '1px solid #ddd', 
                        borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', background: '#fff' 
                      }}>
                      {media.type === 'image' ? (
                        <img src={media.url} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#eee', fontSize: '1.2rem', color: '#666' }}>🎬</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right Column: Ficha / Features */}
            <div style={{ flex: '1 1 300px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>Philips {selectedProduct.brand}</div>
              <h2 style={{ fontSize: '2.5rem', color: '#0B5ED7', marginBottom: '0.5rem', lineHeight: '1.2' }}>{selectedProduct.name}</h2>
              <div style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '2.5rem' }}>SKU: {selectedProduct.sku}</div>
              
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '2px solid #0B5ED7', paddingBottom: '0.5rem', display: 'inline-block', color: '#333' }}>Puntos Fuertes</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#444', fontSize: '1.05rem' }}>
                {selectedProduct.features || 'No hay puntos fuertes registrados para este producto.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Views ---

  if (!isAuthenticated) {
    return (
      <main className="container" style={{ backgroundColor: 'var(--primary-color)' }}>
        <img src="/logo miniprecios.png" alt="Miniprecios Logo" style={{ maxWidth: '300px', marginBottom: '2rem' }} />
        <div className="card">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Seguridad: ¿Cuánto es {captchaNum1} + {captchaNum2}?</label>
              <input type="number" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required placeholder="Resultado" />
            </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <button type="submit" className="btn-primary">Ingresar</button>
          </form>
        </div>
      </main>
    );
  }

  if (!selectedBrand) {
    return (
      <main className="container" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '1200px', marginBottom: '1rem', gap: '1rem' }}>
          {userRole === 'admin' && (
            <a href="/admin" className="btn-primary" style={{ width: 'auto', margin: 0, textDecoration: 'none' }}>
              Panel de Control
            </a>
          )}
          <button className="btn-secondary" onClick={handleLogout} style={{ width: 'auto', margin: 0 }}>Cerrar Sesión</button>
        </div>
        
        <h1 className="header-title" style={{ marginBottom: '1rem', fontSize: '2.5rem', color: '#333' }}>Bienvenido al Catálogo</h1>
        <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '2rem', fontSize: '1.1rem' }}>Encuentra el producto perfecto para ti</p>
        
        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 3rem auto', width: '100%', padding: '0 1rem' }}>
          <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '20px', fontSize: '1.2rem', color: '#adb5bd' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o SKU..." 
              value={searchQuery}
              onChange={handleGlobalSearch}
              style={{ width: '100%', padding: '1.2rem 1rem 1.2rem 3.5rem', fontSize: '1.1rem', borderRadius: '30px', border: '2px solid #e9ecef', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
              onFocus={(e) => { e.target.style.borderColor = '#0B5ED7'; e.target.style.boxShadow = '0 4px 15px rgba(11, 94, 215, 0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}
            />
          </div>
        </div>

        {searchQuery.length > 2 ? (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333', fontSize: '1.8rem' }}>Resultados de búsqueda</h2>
            {isSearching ? (
              <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '1.2rem' }}>Buscando...</div>
            ) : globalSearchProducts && globalSearchProducts.length > 0 ? (
              <div className="products-grid">
                {globalSearchProducts.map(product => {
                  const imgs = getParsedArray(product.images);
                  const coverImage = imgs.length > 0 ? imgs[0] : product.image;
                  return (
                  <div key={product.id} className="product-card" onClick={() => { setSelectedProduct(product); setActiveMediaIndex(0); }}>
                    <img src={coverImage} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">SKU: {product.sku}</div>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '1.2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '10px' }}>No se encontraron productos para "{searchQuery}"</div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="header-title" style={{ marginTop: '2rem', fontSize: '2rem' }}>O Selecciona una Categoría</h2>
            <div className="brands-container">
              <div className="brand-card" onClick={() => handleSelectBrand('home')}>
                <img src="/home.png" alt="Philips Home" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
              </div>
              <div className="brand-card" onClick={() => handleSelectBrand('agua')}>
                <img src="/agua.png" alt="Philips Agua" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
              </div>
              <div className="brand-card" onClick={() => handleSelectBrand('audio')}>
                <img src="/audio.png" alt="Philips Audio" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        )}
        
        {renderProductModal()}
      </main>
    );
  }

  const filteredProducts = products.filter(product => {
    if (selectedSubfilter === 'all') return true;
    
    const nameLower = product.name.toLowerCase();
    
    if (selectedBrand === 'audio') {
      if (selectedSubfilter === 'audifonos') return nameLower.includes('audifono') || nameLower.includes('audífono') || nameLower.includes('in ear') || nameLower.includes('over ear');
      if (selectedSubfilter === 'barra') return nameLower.includes('barra');
      if (selectedSubfilter === 'bocina') return nameLower.includes('bocina') || nameLower.includes('altavoz') || nameLower.includes('party speaker');
    } else if (selectedBrand === 'home') {
      if (selectedSubfilter === 'freidoras') return nameLower.includes('freidora') || nameLower.includes('airfryer');
      if (selectedSubfilter === 'cafeteras') return nameLower.includes('cafetera') || nameLower.includes('espresso');
      if (selectedSubfilter === 'licuadoras') return nameLower.includes('licuadora');
    }
    
    return true;
  });

  return (
    <main className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={() => setSelectedBrand(null)} style={{ margin: 0 }}>
          &larr; Volver a Categorías
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {userRole === 'admin' && (
            <a href="/admin" className="btn-primary" style={{ width: 'auto', marginTop: 0, textDecoration: 'none' }}>
              Panel de Control
            </a>
          )}
          <button className="btn-secondary" onClick={handleLogout} style={{ width: 'auto', margin: 0 }}>Cerrar Sesión</button>
        </div>
      </div>
      
      <h1 className="header-title">Productos</h1>

      {selectedBrand === 'home' && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className={selectedSubfilter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('all')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Todos
          </button>
          <button className={selectedSubfilter === 'freidoras' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('freidoras')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Freidoras
          </button>
          <button className={selectedSubfilter === 'cafeteras' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('cafeteras')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Cafeteras
          </button>
          <button className={selectedSubfilter === 'licuadoras' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('licuadoras')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Licuadoras
          </button>
        </div>
      )}

      {selectedBrand === 'audio' && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className={selectedSubfilter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('all')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Todos
          </button>
          <button className={selectedSubfilter === 'audifonos' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('audifonos')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Audífonos
          </button>
          <button className={selectedSubfilter === 'barra' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('barra')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Barras de Sonido
          </button>
          <button className={selectedSubfilter === 'bocina' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedSubfilter('bocina')} style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
            Bocinas
          </button>
        </div>
      )}

      <div className="products-grid">
        {filteredProducts.map(product => {
          const imgs = getParsedArray(product.images);
          const coverImage = imgs.length > 0 ? imgs[0] : product.image;
          return (
          <div key={product.id} className="product-card" onClick={() => { setSelectedProduct(product); setActiveMediaIndex(0); }}>
            <img src={coverImage} alt={product.name} className="product-image" />
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-sku">SKU: {product.sku}</div>
            </div>
          </div>
        )})}
      </div>

      {renderProductModal()}
    </main>
  );
}
