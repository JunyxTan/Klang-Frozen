import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEYS = {
  users: 'klang_frozen_users',
  session: 'klang_frozen_session',
  cart: 'klang_frozen_cart',
  products: 'klang_frozen_products',
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
const COMPANY_LOGO = '/company-logo.png';
const PRODUCTS_API = '/.netlify/functions/products';

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

async function requestJSON(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

function ProductCard({ product, qty, onAdd }) {
  const [addQty, setAddQty] = useState(1);

  function handleAddQtyChange(e) {
    const next = Number.parseInt(e.target.value, 10);
    if (Number.isNaN(next)) {
      setAddQty('');
      return;
    }
    setAddQty(Math.min(999, Math.max(1, next)));
  }

  function handleAddToCart() {
    const quantity = Number.parseInt(addQty, 10);
    onAdd(product, Number.isNaN(quantity) ? 1 : Math.max(1, quantity));
  }

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
          <div className="product-price-block">
            <div className="price">{money(product.price)}</div>
            {qty > 0 && <div className="muted small">In cart: {qty}</div>}
          </div>
          <div className="button-row product-actions">
            <input
              className="qty-input"
              type="number"
              min="1"
              max="999"
              value={addQty}
              onChange={handleAddQtyChange}
              aria-label={`Quantity for ${product.name}`}
            />
            <button className="btn icon-btn" onClick={handleAddToCart} aria-label={`Add ${product.name} to cart`}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 4a1 1 0 0 1 1-1h1.2a1 1 0 0 1 .97.757L6.6 5.5H20a1 1 0 0 1 .97 1.243l-1.6 6.5A1 1 0 0 1 18.4 14H8a1 1 0 0 1-.97-.757L5.2 6H4a1 1 0 0 1-1-1Zm5.78 8h8.84l1.1-4.5H7.68L8.78 12ZM9 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Brand({ name }) {
  return (
    <div className="brand">
      <img
        className="brand-logo"
        src={COMPANY_LOGO}
        alt={`${name} logo`}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span>{name}</span>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState(defaultUsers);
  const [products, setProducts] = useState(() => load(STORAGE_KEYS.products, defaultProducts));
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
  const orderFormRef = useRef(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsSaving, setProductsSaving] = useState(false);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    setUsers(load(STORAGE_KEYS.users, defaultUsers));
    setSession(load(STORAGE_KEYS.session, null));
    setCart(load(STORAGE_KEYS.cart, []));
    setProducts(load(STORAGE_KEYS.products, defaultProducts));
  }, []);

  async function syncProductsFromRepo() {
    setProductsLoading(true);
    setProductsError('');
    try {
      const payload = await requestJSON(PRODUCTS_API);
      if (Array.isArray(payload.products)) {
        setProducts(payload.products);
        save(STORAGE_KEYS.products, payload.products);
      } else {
        throw new Error('Invalid products payload.');
      }
      return payload.products;
    } catch (error) {
      const cachedProducts = load(STORAGE_KEYS.products, defaultProducts);
      setProducts(cachedProducts);
      setProductsError(`${error.message} Using locally cached products.`);
      return null;
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const nextProducts = await syncProductsFromRepo();
      if (!active || !nextProducts) return;
      setProducts(nextProducts);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(getRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => { save(STORAGE_KEYS.users, users); }, [users]);
  useEffect(() => { save(STORAGE_KEYS.session, session); }, [session]);
  useEffect(() => { save(STORAGE_KEYS.cart, cart); }, [cart]);
  useEffect(() => { save(STORAGE_KEYS.products, products); }, [products]);

  const activeProducts = useMemo(() => products.filter((p) => p.status === 'Active'), [products]);
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
  const homeFeaturedProducts = useMemo(() => {
    const byFeatured = [...activeProducts].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return byFeatured.slice(0, 6);
  }, [activeProducts]);
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((a, b) => a + Number(b.price) * b.quantity, 0), [cart]);
  const dashboardStats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'Active').length;
    const activeManagers = users.filter((u) => u.role === 'Manager' && u.status === 'Active').length;
    const superAdmins = users.filter((u) => u.role === 'Super Admin' && u.status === 'Active').length;
    const inactiveProducts = products.filter((p) => p.status !== 'Active').length;
    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      inactiveProducts,
      featuredProducts: featuredProducts.length,
      totalUsers: users.length,
      activeUsers,
      activeManagers,
      superAdmins,
      cartItems: cartCount,
      cartValue: cartTotal,
    };
  }, [products, users, activeProducts.length, featuredProducts.length, cartCount, cartTotal]);
  const categoryBreakdown = useMemo(() => {
    const total = products.length || 1;
    const counts = products.reduce((acc, product) => {
      const key = product.category || 'Uncategorized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        ratio: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);
  const cartHighlights = useMemo(() => (
    [...cart]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3)
  ), [cart]);
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

  function addToCart(product, quantity = 1) {
    const qtyToAdd = Math.max(1, Number.parseInt(quantity, 10) || 1);
    setSelectedProduct(product);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item));
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        halal: product.halal,
        quantity: qtyToAdd,
      }];
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

  async function persistProducts(nextProducts, actionLabel) {
    setProductsSaving(true);
    setProductsError('');
    try {
      const payload = await requestJSON(PRODUCTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: nextProducts,
          actor: session?.email || 'admin@klangfrozen.com',
          action: actionLabel,
        }),
      });
      if (!Array.isArray(payload.products)) {
        throw new Error('Failed to persist product updates.');
      }
      const latestProducts = await syncProductsFromRepo();
      if (!latestProducts) {
        throw new Error('Product was saved but latest list could not be loaded. Please refresh.');
      }
      return true;
    } catch (error) {
      setProductsError(error.message);
      return false;
    } finally {
      setProductsSaving(false);
    }
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.category || !productForm.price) return;
    const nextProducts = editingProductId
      ? products.map((p) => (p.id === editingProductId ? { ...productForm, id: editingProductId } : p))
      : [{ ...productForm, id: Date.now() }, ...products];
    const ok = await persistProducts(nextProducts, editingProductId ? 'update product' : 'create product');
    if (!ok) return;
    resetProductForm();
  }

  async function deleteProduct(id) {
    const nextProducts = products.filter((p) => p.id !== id);
    await persistProducts(nextProducts, 'delete product');
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
    const whatsappNumber = '60129665291';
    const lines = [
      'Hello Klang Frozen, I would like to place order.',
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

  function promptOrderViaWhatsApp() {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstEmptyField = [
      'input[name="contactName"]',
      'input[name="company"]',
      'input[name="email"]',
      'input[name="phone"]',
      'textarea[name="message"]',
    ].map((selector) => orderFormRef.current?.querySelector(selector)).find((field) => field && !field.value?.trim());
    window.setTimeout(() => {
      (firstEmptyField || orderFormRef.current?.querySelector('input, textarea'))?.focus();
    }, 200);
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
      <div className="page home-page">
        <div className="promo-banner">Free delivery above RM300 in selected Klang Valley zones.</div>

        <header className="topbar home-topbar">
          <Brand name="Klang Frozen" />
          <nav className="home-nav">
            <a href="#products">Our Frozen Selection</a>
            <a href="#why-us">Why Customers Choose Us</a>
            <a href="#delivery">Fast Delivery in Klang Valley</a>
            <a href="#reviews">Reviews</a>
          </nav>
          <div className="button-row wrap">
            <button className="btn btn-secondary" onClick={() => navigate(ROUTES.catalogue)}>View Products</button>
            <button className="btn" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact Us</button>
          </div>
        </header>

        <main className="layout">
          <section className="home-hero surface-white" id="hero">
            <div className="hero-copy-block">
              <span className="pill">Premium Frozen Supply</span>
              <h1>Fresh Frozen Products Delivered Fast.</h1>
              <p>From daily essentials to best-selling frozen favorites for homes and businesses across Klang Valley.</p>
              <button className="btn btn-large" onClick={() => navigate(ROUTES.catalogue)}>Shop Now</button>
            </div>
            <div className="hero-spotlight card">
              <h3>What You Can Expect</h3>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">C</span>
                  <div>
                    <strong>Freshness Guarantee</strong>
                    <p>Cold-chain handling from storage to your doorstep.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">H</span>
                  <div>
                    <strong>Halal-Friendly Options</strong>
                    <p>Clear product badges for easy selection.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">F</span>
                  <div>
                    <strong>Fast Response</strong>
                    <p>Order enquiries handled quickly via WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="home-section surface-tint" id="products">
            <div className="section-head home-section-head">
              <div>
                <h2>Best Sellers</h2>
                <div className="muted small">Uniform packs with consistent quality and pricing.</div>
              </div>
              <button className="btn btn-secondary" onClick={() => navigate(ROUTES.catalogue)}>View Products</button>
            </div>
            <div className="home-product-grid">
              {homeFeaturedProducts.map((product) => (
                <article className="card home-product-card" key={product.id}>
                  <div className="home-product-image">
                    <img src={product.image || 'https://via.placeholder.com/600x400?text=Klang+Frozen'} alt={product.name} />
                  </div>
                  <div className="home-product-body">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="home-product-meta">
                      <strong>{money(product.price)}</strong>
                      <span>{product.category}</span>
                    </div>
                    <button className="btn btn-secondary wide" onClick={() => navigate(ROUTES.catalogue)}>View Product</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="home-section surface-white" id="why-us">
            <div className="section-head home-section-head">
              <div>
                <h2>Why Customers Choose Us</h2>
                <div className="muted small">Built around quality, speed, and trust.</div>
              </div>
            </div>
            <div className="home-grid-3">
              <div className="value-card">
                <h3>Reliable Quality</h3>
                <p>Consistent stock standards across all frozen categories.</p>
              </div>
              <div className="value-card">
                <h3>Cold-Chain Care</h3>
                <p>Proper storage and delivery workflow to protect freshness.</p>
              </div>
              <div className="value-card">
                <h3>Responsive Support</h3>
                <p>Fast order confirmation and clear communication on WhatsApp.</p>
              </div>
            </div>
          </section>

          <section className="home-section surface-tint" id="delivery">
            <div className="section-head home-section-head">
              <div>
                <h2>Fast Delivery in Klang Valley</h2>
                <div className="muted small">Coverage and service confidence at a glance.</div>
              </div>
            </div>
            <div className="home-grid-3">
              <div className="service-block">
                <h3>Delivery Areas</h3>
                <p>Klang, Shah Alam, Subang, PJ, and selected nearby zones.</p>
              </div>
              <div className="service-block">
                <h3>Freshness Guarantee</h3>
                <p>Temperature-controlled handling with quality checks before dispatch.</p>
              </div>
              <div className="service-block">
                <h3>Business Friendly</h3>
                <p>Suitable for households, restaurants, cafes, and resellers.</p>
              </div>
            </div>
          </section>

          <section className="home-section surface-white" id="reviews">
            <div className="section-head home-section-head">
              <div>
                <h2>Customer Reviews</h2>
                <div className="muted small">Feedback from regular Klang Frozen buyers.</div>
              </div>
            </div>
            <div className="home-grid-3">
              <article className="review-card">
                <p>"Products are clean, well-packed, and arrive on time every week."</p>
                <strong>- Nusantara Eatery, Klang</strong>
              </article>
              <article className="review-card">
                <p>"Fast WhatsApp response and easy ordering for our cafe team."</p>
                <strong>- Rasa Kopi House, PJ</strong>
              </article>
              <article className="review-card">
                <p>"Great quality for bulk buying. Consistent stock and delivery."</p>
                <strong>- Fresh Mart Reseller, Shah Alam</strong>
              </article>
            </div>
          </section>

          <section className="home-section surface-tint faq-section" id="faq">
            <div className="section-head home-section-head">
              <div>
                <h2>FAQ</h2>
                <div className="muted small">Short answers to common buying questions.</div>
              </div>
            </div>
            <div className="home-grid-2">
              <div className="service-block">
                <h3>How do I place an order?</h3>
                <p>Browse products, then send your enquiry through WhatsApp.</p>
              </div>
              <div className="service-block">
                <h3>Do you have halal items?</h3>
                <p>Yes, halal-friendly products are clearly labeled.</p>
              </div>
              <div className="service-block">
                <h3>Can businesses order in bulk?</h3>
                <p>Yes, we support wholesale packs for horeca and resellers.</p>
              </div>
              <div className="service-block">
                <h3>What is the minimum for delivery?</h3>
                <p>Delivery minimum and fees vary by zone and order size.</p>
              </div>
            </div>
          </section>

          <section className="home-section surface-white" id="contact">
            <div className="section-head home-section-head">
              <div>
                <h2>Contact Klang Frozen</h2>
                <div className="muted small">Order support and delivery enquiries.</div>
              </div>
              <button className="btn" onClick={() => window.open(catalogueLink, '_blank')}>Share Catalogue</button>
            </div>
            <div className="contact-grid">
              <div className="contact-item"><strong>WhatsApp</strong><span>+60 12-966 5291</span></div>
              <div className="contact-item"><strong>Email</strong><span>sales@klangfrozen.com</span></div>
              <div className="contact-item"><strong>Address</strong><span>Klang, Selangor, Malaysia</span></div>
              <div className="contact-item"><strong>Business Hours</strong><span>Mon-Sat, 9:00 AM - 6:00 PM</span></div>
            </div>
          </section>
        </main>

        <footer className="home-footer">
          <div className="footer-brand">
            <Brand name="Klang Frozen" />
            <p>Fresh frozen products delivered to your doorstep.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="#products">Our Frozen Selection</a>
            <a href="#why-us">Why Customers Choose Us</a>
            <a href="#delivery">Delivery Areas</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-links">
            <h4>Contact</h4>
            <a href="https://wa.me/60129665291" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="mailto:sales@klangfrozen.com">sales@klangfrozen.com</a>
            <span>Klang, Selangor</span>
            <span>Mon-Sat, 9:00 AM - 6:00 PM</span>
          </div>
          <div className="footer-links">
            <h4>Social</h4>
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="TikTok">TikTok</a>
          </div>
        </footer>

        <a className="whatsapp-float" href="https://wa.me/60129665291" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          WhatsApp
        </a>
      </div>
    );
  }

  if (route === 'admin' && session) {
    return (
      <div className="page admin-page">
        <header className="topbar">
          <div>
            <Brand name="Klang Frozen" />
            <div className="muted small">Logged in as {session.name} ({session.role})</div>
          </div>
          <div className="button-row wrap">
            <button className="btn btn-secondary" onClick={() => navigate(ROUTES.home)}>Public Site</button>
            <button className="btn btn-secondary" onClick={() => navigate(ROUTES.catalogue)}>Catalogue</button>
            <button className="btn btn-secondary" onClick={logout}>Logout</button>
          </div>
        </header>

        <main className="layout">
          <section>
            <div className="section-head">
              <div>
                <h2>Admin Panel</h2>
                <div className="muted small">Manage products and users</div>
              </div>
            </div>

            <div className="card">
              <div className="tab-buttons">
                <button
                  className={`tab-btn ${adminTab === 'dashboard' ? 'tab-active' : ''}`}
                  onClick={() => setAdminTab('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`tab-btn ${adminTab === 'products' ? 'tab-active' : ''}`}
                  onClick={() => setAdminTab('products')}
                >
                  Products ({products.length})
                </button>
                <button
                  className={`tab-btn ${adminTab === 'users' ? 'tab-active' : ''}`}
                  onClick={() => setAdminTab('users')}
                >
                  Users ({users.length})
                </button>
              </div>
            </div>
          </section>

          {adminTab === 'dashboard' && (
            <section className="stack-gap">
              <div className="section-head">
                <div>
                  <h2>Admin Dashboard</h2>
                  <div className="muted small">Live overview of products, users, and catalogue activity</div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="card stat"><span className="muted small">Total Products</span><strong>{dashboardStats.totalProducts}</strong></div>
                <div className="card stat"><span className="muted small">Active Products</span><strong>{dashboardStats.activeProducts}</strong></div>
                <div className="card stat"><span className="muted small">Featured Products</span><strong>{dashboardStats.featuredProducts}</strong></div>
                <div className="card stat"><span className="muted small">Inactive Products</span><strong>{dashboardStats.inactiveProducts}</strong></div>
                <div className="card stat"><span className="muted small">Total Users</span><strong>{dashboardStats.totalUsers}</strong></div>
                <div className="card stat"><span className="muted small">Active Users</span><strong>{dashboardStats.activeUsers}</strong></div>
                <div className="card stat"><span className="muted small">Active Managers</span><strong>{dashboardStats.activeManagers}</strong></div>
                <div className="card stat"><span className="muted small">Super Admins</span><strong>{dashboardStats.superAdmins}</strong></div>
              </div>

              <div className="two-col">
                <div className="card list-card">
                  <h3>Category Breakdown</h3>
                  <div className="muted small">Distribution of current catalogue items by category</div>
                  {categoryBreakdown.length === 0 ? (
                    <div className="empty">No product categories yet.</div>
                  ) : (
                    <div className="dashboard-breakdown">
                      {categoryBreakdown.map((entry) => (
                        <div className="breakdown-row" key={entry.category}>
                          <div>
                            <strong>{entry.category}</strong>
                            <div className="muted small">{entry.count} product(s)</div>
                          </div>
                          <span className="badge secondary">{entry.ratio}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card list-card">
                  <h3>Cart Activity Snapshot</h3>
                  <div className="muted small">What customers are currently selecting in this browser session</div>
                  <div className="dashboard-cart-stat">
                    <span>Total Cart Items</span>
                    <strong>{dashboardStats.cartItems}</strong>
                  </div>
                  <div className="dashboard-cart-stat">
                    <span>Estimated Cart Value</span>
                    <strong>{money(dashboardStats.cartValue)}</strong>
                  </div>
                  {cartHighlights.length ? (
                    <div className="dashboard-breakdown">
                      {cartHighlights.map((item) => (
                        <div className="breakdown-row" key={item.id}>
                          <div>
                            <strong>{item.name}</strong>
                            <div className="muted small">{money(item.price)} each</div>
                          </div>
                          <span className="badge">{item.quantity} in cart</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">No cart activity yet.</div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Quick Actions</h3>
                <div className="button-row wrap">
                  <button className="btn" onClick={() => setAdminTab('products')}>Manage Products</button>
                  <button className="btn btn-secondary" onClick={() => setAdminTab('users')}>Manage Users</button>
                  <button className="btn btn-secondary" onClick={() => navigate(ROUTES.catalogue)}>Open Catalogue</button>
                </div>
              </div>
            </section>
          )}

          {adminTab === 'products' && (
            <section>
              <div className="section-head">
                <div>
                  <h2>Product Management</h2>
                  <div className="muted small">Add, edit, and manage frozen food products</div>
                  {productsLoading && <div className="muted small">Syncing products from GitHub...</div>}
                  {productsError && <div className="error">{productsError}</div>}
                </div>
                <button className="btn" onClick={resetProductForm} disabled={productsSaving}>Add New Product</button>
              </div>

              <div className="two-col">
                <form className="card form-card" onSubmit={saveProduct}>
                  <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                  <div className="grid-2">
                    <div><label>Name *</label><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                    <div><label>SKU *</label><input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} required /></div>
                  </div>
                  <div className="grid-2">
                    <div><label>Category *</label><input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required /></div>
                    <div><label>Price (MYR) *</label><input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required /></div>
                  </div>
                  <div><label>Description</label><textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
                  <div><label>Image URL</label><input value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} placeholder="https://..." /></div>
                  <div>
                    <label>Upload Product Photo</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    <div className="muted small">Choose a local image to upload, or use an image URL above.</div>
                  </div>
                  {productForm.image && (
                    <div>
                      <label>Image Preview</label>
                      <img
                        className="preview"
                        src={productForm.image}
                        alt={`${productForm.name || 'Product'} preview`}
                      />
                    </div>
                  )}
                  <div className="form-row">
                    <label className="checkbox">
                      <input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} />
                      Featured product
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" checked={productForm.halal} onChange={(e) => setProductForm({ ...productForm, halal: e.target.checked })} />
                      Halal certified
                    </label>
                  </div>
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary" onClick={resetProductForm} disabled={productsSaving}>Cancel</button>
                    <button className="btn" type="submit" disabled={productsSaving}>
                      {productsSaving ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                    </button>
                  </div>
                </form>

                <div className="card list-card">
                  <h3>Product List</h3>
                  <div className="muted small">Click on a product to edit</div>
                  {products.length === 0 ? (
                    <div className="empty">No products yet.</div>
                  ) : (
                    <div className="admin-list">
                      {products.map((product) => (
                        <div key={product.id} className="admin-item" onClick={() => startEditProduct(product)}>
                          <img src={product.image || 'https://via.placeholder.com/80'} alt={product.name} />
                          <div className="list-content">
                            <div className="badge-row">
                              <strong>{product.name}</strong>
                              <span className={`status ${product.status.toLowerCase()}`}>{product.status}</span>
                            </div>
                            <div className="muted small">SKU: {product.sku} | {product.category} | {money(product.price)}</div>
                            <div className="muted small">{product.description}</div>
                            <div className="badge-row">
                              {product.featured && <span className="badge">Featured</span>}
                              {product.halal && <span className="badge halal">Halal</span>}
                            </div>
                          </div>
                          <button
                            className="btn btn-secondary square"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this product?')) deleteProduct(product.id);
                            }}
                            disabled={productsSaving}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {adminTab === 'users' && (
            <section>
              <div className="section-head">
                <div>
                  <h2>User Management</h2>
                  <div className="muted small">Manage admin and manager accounts</div>
                </div>
                <button className="btn" onClick={() => setEditingUserId(null)}>Add New User</button>
              </div>

              <div className="two-col">
                <form className="card form-card" onSubmit={saveUser}>
                  <h3>{editingUserId ? 'Edit User' : 'Add New User'}</h3>
                  <div><label>Name *</label><input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required /></div>
                  <div><label>Email *</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
                  <div><label>Password *</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required /></div>
                  <div>
                    <label>Role</label>
                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                      <option value="Manager">Manager</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label className="checkbox">
                      <input type="checkbox" checked={userForm.status === 'Active'} onChange={(e) => setUserForm({ ...userForm, status: e.target.checked ? 'Active' : 'Inactive' })} />
                      Active user
                    </label>
                  </div>
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary" onClick={resetUserForm}>Cancel</button>
                    <button className="btn" type="submit">{editingUserId ? 'Update User' : 'Add User'}</button>
                  </div>
                </form>

                <div className="card list-card">
                  <h3>User List</h3>
                  <div className="muted small">Click on a user to edit</div>
                  {users.length === 0 ? (
                    <div className="empty">No users yet.</div>
                  ) : (
                    <div className="admin-list">
                      {users.map((user) => (
                        <div key={user.id} className="admin-item" onClick={() => startEditUser(user)}>
                          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                          <div className="list-content">
                            <div className="badge-row">
                              <strong>{user.name}</strong>
                              <span className={`status ${user.status.toLowerCase()}`}>{user.status}</span>
                            </div>
                            <div className="muted small">{user.email} | {user.role}</div>
                          </div>
                          <button
                            className="btn btn-secondary square"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this user?')) deleteUser(user.id);
                            }}
                            disabled={user.id === session.id}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="page catalogue-page">
      <header className="topbar">
        <div>
          <Brand name="Klang Frozen" />
          <div className="muted small">Customer product catalogue</div>
        </div>
        <div className="button-row wrap">
          <button className="btn" onClick={() => document.getElementById('catalogue-cart')?.scrollIntoView({ behavior: 'smooth' })}>Cart ({cartCount})</button>
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

          <div className="card selection-panel">
            <div className="grid-2">
              <div>
                <label>Search products</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, SKU, category, or description"
                />
              </div>
              <div>
                <label>Cart actions</label>
                <div className="button-row wrap">
                  <button type="button" className="btn btn-secondary" onClick={clearCart} disabled={!cartCount}>
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>

            <div className="button-row wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`chip ${categoryFilter === category ? 'chip-active' : ''}`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={cart.find((item) => item.id === product.id)?.quantity || 0}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>

        <section className="two-col">
          <form className="card form-card" id="order-via-whatsapp" ref={orderFormRef} onSubmit={submitWhatsApp}>
            <h2>Order via WhatsApp</h2>
            <div className="muted small box">
              <div><strong>Selected frozen food:</strong> {selectedProduct?.name || 'Choose a product and add it to cart'}</div>
              <div><strong>Cart items:</strong> {cartCount} item(s)</div>
            </div>
            <div className="grid-2">
              <div><label>Company</label><input name="company" value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} /></div>
              <div><label>Contact Name</label><input name="contactName" value={contact.contactName} onChange={(e) => setContact({ ...contact, contactName: e.target.value })} /></div>
            </div>
            <div className="grid-2">
              <div><label>Email</label><input name="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
              <div><label>Phone</label><input name="phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
            </div>
            <div><label>Message</label><textarea name="message" rows="5" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Carton quantity, quotation, halal requirement, storage details, delivery schedule..." /></div>
            <button className="btn wide">Open WhatsApp</button>
          </form>

          <div className="stack-gap">
            <div className="card list-card" id="catalogue-cart">
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
                  <button
                    type="button"
                    className="btn wide"
                    onClick={promptOrderViaWhatsApp}
                    disabled={!cartCount}
                  >
                    Place Order Now
                  </button>
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
