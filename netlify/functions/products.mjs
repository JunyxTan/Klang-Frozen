const DEFAULT_PRODUCTS = [
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

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function decodeBase64(content = '') {
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8');
}

function encodeBase64(content = '') {
  return Buffer.from(content, 'utf8').toString('base64');
}

async function githubRequest(path, init = {}) {
  const token = env('GITHUB_TOKEN');
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN.');
  }
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || 'GitHub API request failed.');
  }
  return payload;
}

function repoConfig() {
  const owner = env('GITHUB_OWNER');
  const repo = env('GITHUB_REPO');
  const branch = env('GITHUB_BRANCH', 'main');
  const path = env('GITHUB_PRODUCTS_PATH', 'data/products.json');
  return { owner, repo, branch, path, configured: Boolean(owner && repo) };
}

function encodePath(filePath) {
  return filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
}

async function readProductsFile() {
  const { owner, repo, branch, path, configured } = repoConfig();
  if (!configured) {
    return { products: DEFAULT_PRODUCTS, sha: null };
  }
  const endpoint = `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`;
  try {
    const payload = await githubRequest(endpoint);
    return {
      products: parseProducts(payload.content),
      sha: payload.sha,
    };
  } catch (error) {
    if (String(error.message || '').includes('Not Found')) {
      return { products: DEFAULT_PRODUCTS, sha: null };
    }
    throw error;
  }
}

function parseProducts(content) {
  try {
    const parsed = JSON.parse(decodeBase64(content || ''));
    return Array.isArray(parsed) ? parsed : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

async function writeProductsFile({ products, sha, actor = 'admin', action = 'update products' }) {
  const { owner, repo, branch, path, configured } = repoConfig();
  if (!configured) {
    throw new Error('Product persistence is not configured. Set GITHUB_OWNER and GITHUB_REPO in Netlify environment variables.');
  }
  const endpoint = `/repos/${owner}/${repo}/contents/${encodePath(path)}`;
  const content = `${JSON.stringify(products, null, 2)}\n`;
  return githubRequest(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `chore(products): ${action} by ${actor}`,
      content: encodeBase64(content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function handler(event) {
  try {
    if (event.httpMethod === 'GET') {
      const { products } = await readProductsFile();
      return response(200, { products });
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      if (!Array.isArray(body.products)) {
        return response(400, { error: '`products` must be an array.' });
      }
      const current = await readProductsFile();
      await writeProductsFile({
        products: body.products,
        sha: current.sha,
        actor: body.actor || 'admin',
        action: body.action || 'update products',
      });
      return response(200, { products: body.products });
    }

    return response(405, { error: 'Method not allowed.' });
  } catch (error) {
    return response(500, { error: error.message || 'Internal error.' });
  }
}
