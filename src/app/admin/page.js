"use client";
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'products'

  // User State
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // Product State
  const [products, setProducts] = useState([]);
  const [pBrand, setPBrand] = useState('home');
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pVideos, setPVideos] = useState(['']);
  const [pFeatures, setPFeatures] = useState('');
  
  // Image dual upload list
  const [pImages, setPImages] = useState([{ type: 'url', url: '', data: '' }]);

  const [filterBrand, setFilterBrand] = useState('all');
  const [editingProductId, setEditingProductId] = useState(null);

  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    if (data.success) {
      setProducts(data.products);
      return data.products;
    }
    return null;
  };

  useEffect(() => {
    fetchUsers();
    fetchProducts().then((loadedProducts) => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('editId');
        if (editId && loadedProducts) {
          setActiveTab('products');
          const productToEdit = loadedProducts.find(p => p.id === editId);
          if (productToEdit) {
            // Need to set timeout so states settle before editing
            setTimeout(() => handleEditProduct(productToEdit), 100);
          }
        }
      }
    });
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) {
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    }
  };

  const handleImageFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...pImages];
        newImages[index].data = reader.result;
        setPImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPImages(prev => {
          const filtered = prev.filter(img => !(img.url === '' && img.data === ''));
          return [...filtered, { type: 'file', url: '', data: reader.result }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddVideo = () => setPVideos([...pVideos, '']);
  const handleRemoveVideo = (index) => {
    const newVids = [...pVideos];
    newVids.splice(index, 1);
    setPVideos(newVids);
  };
  const handleVideoChange = (index, val) => {
    const newVids = [...pVideos];
    newVids[index] = val;
    setPVideos(newVids);
  };

  const handleAddImage = () => setPImages([...pImages, { type: 'url', url: '', data: '' }]);
  const handleRemoveImage = (index) => {
    const newImgs = [...pImages];
    newImgs.splice(index, 1);
    setPImages(newImgs);
  };
  const handleImageTypeChange = (index, type) => {
    const newImgs = [...pImages];
    newImgs[index].type = type;
    setPImages(newImgs);
  };
  const handleImageUrlChange = (index, val) => {
    const newImgs = [...pImages];
    newImgs[index].url = val;
    setPImages(newImgs);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setMessage('');

    const payload = {
      brand: pBrand,
      name: pName,
      sku: pSku,
      features: pFeatures,
      videos: pVideos.filter(v => v.trim() !== ''),
      images: pImages.filter(img => (img.type === 'url' && img.url.trim() !== '') || (img.type === 'file' && img.data !== '')).map(img => ({
         type: img.type === 'file' ? 'base64' : 'url',
         url: img.url,
         data: img.data
      }))
    };

    if (editingProductId) {
      payload.id = editingProductId;
    }

    const res = await fetch('/api/admin/products', {
      method: editingProductId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) {
      handleCancelEdit();
      fetchProducts();
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setPBrand('home');
    setPName('');
    setPSku('');
    setPVideos(['']);
    setPFeatures('');
    setPImages([{ type: 'url', url: '', data: '' }]);
    setMessage('');
  };

  const handleEditProduct = (p) => {
    setEditingProductId(p.id);
    setPBrand(p.brand);
    setPName(p.name);
    setPSku(p.sku);
    setPFeatures(p.features || '');
    
    let parsedVideos = [''];
    try { parsedVideos = JSON.parse(p.videos); if (!Array.isArray(parsedVideos) || parsedVideos.length === 0) parsedVideos = ['']; } catch {}
    setPVideos(parsedVideos);
    
    let parsedImages = [{ type: 'url', url: '', data: '' }];
    try {
      const imgs = JSON.parse(p.images);
      if (Array.isArray(imgs) && imgs.length > 0) {
        parsedImages = imgs.map(url => ({ type: 'url', url, data: '' }));
      }
    } catch {}
    setPImages(parsedImages);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) {
      if (editingProductId === id) handleCancelEdit();
      fetchProducts();
    }
  };

  return (
    <main className="container" style={{ padding: '2rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <h1 className="header-title" style={{ margin: 0 }}>Panel de Control</h1>
        <a href="/" className="btn-secondary" style={{ textDecoration: 'none', margin: 0 }}>&larr; Volver al Catálogo</a>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('users')} style={{ margin: 0, width: 'auto' }}>
          Gestión de Usuarios
        </button>
        <button className={activeTab === 'products' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('products')} style={{ margin: 0, width: 'auto' }}>
          Gestión de Productos
        </button>
      </div>

      {message && <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', width: '100%', marginBottom: '1rem' }}>{message}</div>}

      {activeTab === 'users' && (
        <div style={{ width: '100%', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Usuario</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value="viewer">Visualizador (Solo ver)</option>
                  <option value="admin">Administrador (Control total)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Crear Usuario</button>
            </form>
          </div>

          <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <h2>Usuarios Actuales</h2>
            <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
              {users.map(u => (
                <li key={u.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{u.username}</strong>
                  <span style={{ background: u.role === 'admin' ? '#0B5ED7' : '#6c757d', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {u.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div style={{ width: '100%', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <h2>{editingProductId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
            <form onSubmit={handleCreateProduct} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Marca</label>
                <select value={pBrand} onChange={(e) => setPBrand(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value="home">Philips Home</option>
                  <option value="agua">Philips Agua</option>
                  <option value="audio">Philips Audio</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>SKU (Código)</label>
                <input type="text" value={pSku} onChange={(e) => setPSku(e.target.value)} required />
              </div>
              <div className="form-group" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IDs de YouTube o URLs de Drive (Opcional)</span>
                  <button type="button" onClick={handleAddVideo} style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>+ Añadir Video</button>
                </label>
                {pVideos.map((vid, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="text" placeholder="ej. dQw4w9WgXcQ o https://drive.google..." value={vid} onChange={(e) => handleVideoChange(i, e.target.value)} />
                    {pVideos.length > 1 && <button type="button" onClick={() => handleRemoveVideo(i)} style={{ color: 'red' }}>&times;</button>}
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Puntos Fuertes (Opcional)</label>
                <textarea 
                  value={pFeatures} 
                  onChange={(e) => setPFeatures(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', minHeight: '100px', fontFamily: 'inherit' }}
                  placeholder="• Excelente rendimiento&#10;• Diseño moderno"
                />
              </div>
              
              <div className="form-group" style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <label style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Imágenes del Producto</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="button" onClick={handleAddImage} style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>+ Añadir URL</button>
                    <label style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', margin: 0 }}>
                      + Subir Por Lote
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </label>
                
                {pImages.map((img, i) => (
                  <div key={i} style={{ padding: '1rem', border: '1px dashed #ccc', marginBottom: '1rem', borderRadius: '8px', position: 'relative' }}>
                    {pImages.length > 1 && (
                      <button type="button" onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: '10px', right: '10px', color: 'red', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <label><input type="radio" checked={img.type === 'url'} onChange={() => handleImageTypeChange(i, 'url')} /> Usar URL</label>
                      <label><input type="radio" checked={img.type === 'file'} onChange={() => handleImageTypeChange(i, 'file')} /> Subir Archivo local</label>
                    </div>
                    
                    {img.type === 'url' ? (
                      <input type="url" placeholder="https://..." value={img.url} onChange={(e) => handleImageUrlChange(i, e.target.value)} required={i === 0} style={{ width: '100%', padding: '0.5rem' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(i, e)} required={i === 0 && !img.data} />
                        {img.data && <img src={img.data} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ margin: 0 }}>{editingProductId ? 'Guardar Cambios' : 'Añadir Producto'}</button>
                {editingProductId && (
                  <button type="button" className="btn-secondary" onClick={handleCancelEdit} style={{ margin: 0 }}>Cancelar</button>
                )}
              </div>
            </form>
          </div>

          <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Productos Actuales</h2>
              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', background: '#f9f9f9' }}>
                <option value="all">Todas las marcas</option>
                <option value="home">Philips Home</option>
                <option value="agua">Philips Agua</option>
                <option value="audio">Philips Audio</option>
              </select>
            </div>
            <div style={{ marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {products.filter(p => filterBrand === 'all' || p.brand === filterBrand).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#fff' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.brand} | {p.sku}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEditProduct(p)} title="Editar" style={{ padding: '0.4rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                    <button onClick={() => handleDeleteProduct(p.id)} title="Eliminar" style={{ padding: '0.4rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
