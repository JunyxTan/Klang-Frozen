import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  users: 'klang_frozen_users',
  products: 'klang_frozen_products',
  session: 'klang_frozen_session',
  cart: 'klang_frozen_cart',
};

const defaultUsers = [
  {
    id: 1,
    name: 'Main Admin',
    email: 'admin@klangfrozen.com',
    password: 'admin123',
    role: 'Super Admin',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Sales Manager',
    email: 'manager@klangfrozen.com',
    password: 'manager123',
    role: 'Manager',
    status: 'Active',
  },
];

const defaultProducts = [
  {
    id: 1,
    name: 'Premium Frozen Chicken Gyoza',
    sku: 'KF-CG-001',
    category: 'Frozen Dim Sum',
    price: '28.90',
    description: 'Restaurant-grade frozen chicken gyoza for food service and wholesale buyers.',
    status: 'Active',
    featured: true,
    halal: true,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    name: 'Frozen Breaded Fish Fillet',
    sku: 'KF-BF-002',
    category: 'Frozen Seafood',
    price: '35.50',
    description: 'Crispy coated fish fillet suitable for cafes, restaurants, and resellers.',
    status: 'Active',
    featured: true,
    halal: true,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    name: 'Frozen Mixed Vegetables Pack',
    sku: 'KF-MV-003',
    category: 'Frozen Vegetables',
    price: '12.90',
    description: 'Convenient frozen mixed vegetables for restaurants, caterers, and distributors.',
    status: 'Active',
    featured: false,
    halal: false,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  },
];

const emptyProduct = {
  name: '',
  sku: '',
  category: '',
  price: '',
  description: '',
  status: 'Active',
  featured: false,
  halal: true,
  image: '',
};

const emptyUser = {
  name: '',
  email: '',
  password: '',
  role: 'Manager',
  status: 'Active',
};

const ROUTES = {
  home: '/',
  catalogue: '/catalogue',
  admin: '/admin',
};

function getRoute(pathname) {
  if (pathname.startsWith(ROUTES.admin)) return 'admin';
  if (pathname.startsWith(ROUTES.catalogue)) return 'catalogue';
  return 'home';
}

function money(value) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(Number(value || 0));
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function ProductCard({ product, qty, onAdd, onEnquire }) {
  return (
    <div className="card product-card">
      <div className="image-wrap">
        <img src={product.image || 'https://via.placeholder.com/600x400?text=Klang+Frozen'} alt={product.name} />
      </div>
      <div className="product-body">
        <div className="badge-row">
          <span className="badge secondary">{product.category}</span>
          {product.featured && <span className="badge">Featured</span>}
          {product.halal && <span className="badge halal">Halal</span>}
        </div>
        <h3>{product.name}</h3>
        <div className="muted">SKU: {product.sku}</div>
        <p>{product.description}</p>
        <div className="product-footer">
          <div>
            <div className="price">{money(product.price)}</div>
            {qty > 0 && <div className="muted small">In cart: {qty}</div>}
          </div>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={() => onEnquire(product)}>Enquire</button>
            <button className="btn" onClick={() => onAdd(product)}>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState(defaultUsers);
  const [products, setProducts] = useState(defaultProducts);
  const [session, setSession] = useState(null);
  const [cart, setCart] = useState([]);
  const [route, setRoute] = useState(() => getRoute(window.location.pathname));
  const [login, setLogin] = useState({ email: 'admin@klangfrozen.com', password: 'admin123' });
  const [loginError, setLoginError] = useState('');
  const [adminTab, setAdminTab] = useState('products');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [contact, setContact] = useState({ company: '', contactName: '', email: '', phone: '', message: '' });

  useEffect(() => {
    setUsers(load(STORAGE_KEYS.users, defaultUsers));
    setProducts(load(STORAGE_KEYS.products, defaultProducts));
    setSession(load(STORAGE_KEYS.session, null));
    setCart(load(STORAGE_KEYS.cart, []));
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(getRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => { save(STORAGE_KEYS.users, users); }, [users]);
  useEffect(() => { save(STORAGE_KEYS.products, products); }, [products]);
  useEffect(() => { save(STORAGE_KEYS.session, session); }, [session]);
  useEffect(() => { save(STORAGE_KEYS.cart, cart); }, [cart]);

  const activeProducts = useMemo(() => products.filter((p) => p.status === 'Active'), [products]);
  const catalogueProducts = useMemo(() => products, [products]);
  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesSearch = !q || [p.name, p.sku, p.category, p.description].some((v) => String(v).toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, search, categoryFilter]);
  const featuredProducts = useMemo(() => activeProducts.filter((p) => p.featured), [activeProducts]);
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((a, b) => a + Number(b.price) * b.quantity, 0), [cart]);
  const catalogueLink = `${window.location.origin}${ROUTES.catalogue}`;

  function navigate(to) {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
    }
    setRoute(getRoute(to));
  }

  function handleLogin(e) {
    e.preventDefault();
    const user = users.find(
      (u) => u.email === login.email.trim() && u.password === login.password && u.status === 'Active',
    );
    if (!user) {
      setLoginError('Invalid email or password.');
      return;
    }
    setSession(user);
    setLoginError('');
  }

  function logout() {
    setSession(null);
    navigate(ROUTES.home);
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, halal: product.halal, quantity: 1 }];
    });
  }

  function updateCartQuantity(id, delta) {
    setCart((prev) => prev
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0));
  }

  function clearCart() {
    setCart([]);
  }

  function startEditProduct(product) {
    setProductForm(product);
    setEditingProductId(product.id);
  }

  function resetProductForm() {
    setProductForm(emptyProduct);
    setEditingProductId(null);
  }

  function saveProduct(e) {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.category || !productForm.price) return;
    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...productForm, id: editingProductId } : p)));
    } else {
      setProducts((prev) => [{ ...productForm, id: Date.now() }, ...prev]);
    }
    resetProductForm();
  }

  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProductForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  }

  function saveUser(e) {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) return;
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => (u.id === editingUserId ? { ...userForm, id: editingUserId } : u)));
    } else {
      setUsers((prev) => [{ ...userForm, id: Date.now() }, ...prev]);
    }
    setUserForm(emptyUser);
    setEditingUserId(null);
  }

  function startEditUser(user) {
    setUserForm(user);
    setEditingUserId(user.id);
  }

  function resetUserForm() {
    setUserForm(emptyUser);
    setEditingUserId(null);
  }

  function deleteUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (session?.id === id) {
      setSession(null);
      navigate(ROUTES.home);
    }
  }

  function submitWhatsApp(e) {
    e.preventDefault();
    const whatsappNumber = '60120000000';
    const lines = [
      'Hello Klang Frozen, I would like to enquire.',
      '',
      `Company: ${contact.company || '-'}`,
      `Contact Name: ${contact.contactName || '-'}`,
      `Email: ${contact.email || '-'}`,
      `Phone: ${contact.phone || '-'}`,
      '',
      'Items:',
      ...(cart.length
        ? cart.map((item) => `- ${item.name} x${item.quantity} (${money(item.price)} each)`)
        : [selectedProduct ? `- ${selectedProduct.name}` : '- No item selected']),
      '',
      `Message: ${contact.message || '-'}`,
      `Estimated Total: ${money(cartTotal)}`,
    ];
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  if (route === 'admin' && !session) {
    return (
      <div className="page auth-page">
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">Klang Frozen Admin</span>
            <h1>Admin login for product and user management.</h1>
            <p>
              This route is dedicated to internal staff. Customers can browse products on the public homepage and
              the shareable catalogue link.
            </p>
            <div className="button-row wrap">
              <button className="btn btn-secondary" onClick={() => navigate(ROUTES.home)}>Back to Homepage</button>
              <button className="btn btn-secondary" onClick={() => navigate(ROUTES.catalogue)}>Open Catalogue</button>
            </div>
          </div>
          <form className="card auth-card" onSubmit={handleLogin}>
            <h2>Admin Sign In</h2>
            <p className="muted small">admin@klangfrozen.com / admin123</p>
            <label>Email</label>
            <input value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
            <label>Password</label>
            <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
            {loginError && <div className="error">{loginError}</div>}
            <button className="btn wide">Sign In</button>
          </form>
        </section>
      </div>
    );
  }

  if (route === 'home') {
    return (
      <div className="page">
        <header className="topbar">
          <div>
            <div className="brand">Klang Frozen</div>
            <div className="muted small">Public homepage for buyers</div>
          </div>
          <div className="button-row wrap">
            <button className="btn" onClick={() => navigate(ROUTES.catalogue)}>Browse Catalogue</button>
            <button className="btn btn-secondary" onClick={() => navigate(ROUTES.admin)}>Admin Route</button>
          </div>
        </header>

        <main className="layout">
          <section className="card hero-catalogue">
            <span className="pill">Wholesale Frozen Food Supplier</span>
            <h1>Buy frozen products quickly with a shareable catalogue link.</h1>
            <p>
              Send this direct product catalogue URL to buyers so they can browse and enquire without going through
              the admin area.
            </p>
            <div className="share-link">{catalogueLink}</div>
            <div className="button-row wrap">
              <button className="btn" onClick={() => navigate(ROUTES.catalogue)}>Go to Product Catalogue</button>
              <button className="btn btn-secondary" onClick={() => window.open(catalogueLink, '_blank')}>Open Share Link</button>
            </div>
          </section>

          <section>
            <div className="section-head">
              <div>
                <h2>Featured Products</h2>
                <div className="muted small">Customers can view the full list on /catalogue</div>
              </div>
            </div>
            <div className="product-grid">
              {(featuredProducts.length ? featuredProducts : activeProducts).slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  qty={cart.find((item) => item.id === product.id)?.quantity || 0}
                  onAdd={addToCart}
                  onEnquire={(p) => {
                    setSelectedProduct(p);
                    navigate(ROUTES.catalogue);
                  }}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="brand">Klang Frozen</div>
          <div className="muted small">Customer product catalogue</div>
        </div>
        <div className="button-row wrap">
          <button className="btn btn-secondary" onClick={() => navigate(ROUTES.home)}>Homepage</button>
          <button className="btn">Cart ({cartCount})</button>
        </div>
      </header>

      <main className="layout">
        <section className="catalogue-hero card hero-catalogue">
          <span className="pill">Frozen Food Supply</span>
          <h1>Premium frozen food for retail, horeca, and distribution.</h1>
          <p>Browse our halal-friendly frozen food catalogue and send your order enquiry directly to WhatsApp.</p>
        </section>

        <section>
          <div className="section-head">
            <div>
              <h2>Frozen Food Catalogue</h2>
              <div className="muted small">All products with customer cart and enquiry flow.</div>
            </div>
          </div>
          <div className="product-grid">
            {catalogueProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={cart.find((item) => item.id === product.id)?.quantity || 0}
                onAdd={addToCart}
                onEnquire={setSelectedProduct}
              />
            ))}
          </div>
        </section>

        <section className="two-col">
          <form className="card form-card" onSubmit={submitWhatsApp}>
            <h2>Order via WhatsApp</h2>
            <div className="muted small box">
              <div><strong>Selected frozen food:</strong> {selectedProduct?.name || 'Choose a product by clicking Enquire'}</div>
              <div><strong>Cart items:</strong> {cartCount} item(s)</div>
            </div>
            <div className="grid-2">
              <div><label>Company</label><input value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} /></div>
              <div><label>Contact Name</label><input value={contact.contactName} onChange={(e) => setContact({ ...contact, contactName: e.target.value })} /></div>
            </div>
            <div className="grid-2">
              <div><label>Email</label><input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
              <div><label>Phone</label><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
            </div>
            <div><label>Message</label><textarea rows="5" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Carton quantity, quotation, halal requirement, storage details, delivery schedule..." /></div>
            <button className="btn wide">Open WhatsApp</button>
          </form>

          <div className="stack-gap">
            <div className="card list-card">
              <h2>Cart Summary</h2>
              <div className="muted small">Add frozen food items and send them together in one enquiry.</div>
              {cart.length === 0 ? (
                <div className="empty">Your cart is empty.</div>
              ) : (
                <div className="cart-stack">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image || 'https://via.placeholder.com/120'} alt={item.name} />
                      <div className="list-content">
                        <div className="badge-row">
                          <strong>{item.name}</strong>
                          {item.halal && <span className="badge halal">Halal</span>}
                        </div>
                        <div className="muted small">{money(item.price)} each</div>
                        <div className="cart-line">
                          <div className="button-row">
                            <button type="button" className="btn btn-secondary square" onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                            <span>{item.quantity}</span>
                            <button type="button" className="btn btn-secondary square" onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                          </div>
                          <div className="text-right">
                            <strong>{money(Number(item.price) * item.quantity)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="totals box">
                    <div className="row-between"><span>Total items</span><strong>{cartCount}</strong></div>
                    <div className="row-between"><span>Estimated total</span><strong>{money(cartTotal)}</strong></div>
                  </div>
                  <button type="button" className="btn btn-secondary wide" onClick={clearCart}>Clear Cart</button>
                </div>
              )}
            </div>

            <div className="card list-card">
              <h2>Sales Contact</h2>
              <div className="muted">sales@klangfrozen.com</div>
              <div className="muted">+60 12-000 0000</div>
              <div className="muted">Klang, Selangor, Malaysia</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
