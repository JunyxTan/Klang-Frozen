const REQUIRED_ENV_VARS = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
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

function encodePath(filePath) {
  return filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function getConfig() {
  const config = {
    token: env('GITHUB_TOKEN'),
    owner: env('GITHUB_OWNER'),
    repo: env('GITHUB_REPO'),
    branch: env('GITHUB_BRANCH', 'main'),
    productsPath: env('GITHUB_PRODUCTS_PATH', 'data/products.json'),
  };

  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key.toLowerCase().replace('github_', '')]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }

  return config;
}

async function githubRequest(config, endpoint, init = {}) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || 'GitHub API request failed.';
    throw new Error(`${res.status} ${message}`);
  }

  return payload;
}

function normalizeProducts(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({ ...item }));
}

async function readProductsFromGitHub(config) {
  const endpoint = `/repos/${config.owner}/${config.repo}/contents/${encodePath(config.productsPath)}?ref=${encodeURIComponent(config.branch)}`;
  const payload = await githubRequest(config, endpoint);

  let parsed = [];
  try {
    parsed = JSON.parse(decodeBase64(payload.content || ''));
  } catch {
    throw new Error(`Failed to parse JSON from ${config.productsPath}.`);
  }

  return {
    sha: payload.sha,
    products: normalizeProducts(parsed),
  };
}

function nextNumericId(products) {
  const maxId = products.reduce((max, product) => {
    const id = Number.parseInt(product.id, 10);
    if (Number.isFinite(id)) {
      return Math.max(max, id);
    }
    return max;
  }, 0);
  return maxId + 1;
}

async function writeProductsToGitHub(config, products, sha, message) {
  const endpoint = `/repos/${config.owner}/${config.repo}/contents/${encodePath(config.productsPath)}`;
  const content = `${JSON.stringify(products, null, 2)}\n`;

  await githubRequest(config, endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha,
      branch: config.branch,
    }),
  });
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new Error('Invalid JSON payload.');
  }
}

function methodNotAllowed() {
  return response(405, { error: 'Method not allowed.' });
}

export async function handler(event) {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    console.error('Products function configuration error:', error);
    return response(500, { error: error.message || 'Missing configuration.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const { products } = await readProductsFromGitHub(config);
      return response(200, { products });
    }

    if (!['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
      return methodNotAllowed();
    }

    const { products, sha } = await readProductsFromGitHub(config);
    const body = parseBody(event);

    if (event.httpMethod === 'POST') {
      if (!body?.name || !body?.sku || !body?.category || !body?.price) {
        return response(400, { error: 'Missing required product fields.' });
      }

      const newProduct = {
        ...body,
        id: body.id ?? nextNumericId(products),
      };
      const nextProducts = [newProduct, ...products];
      await writeProductsToGitHub(config, nextProducts, sha, `create product: ${newProduct.name}`);
      return response(201, { product: newProduct, products: nextProducts });
    }

    if (event.httpMethod === 'PUT') {
      if (body?.id === undefined || body?.id === null) {
        return response(400, { error: '`id` is required for updates.' });
      }

      let updatedProduct = null;
      const nextProducts = products.map((product) => {
        if (String(product.id) !== String(body.id)) {
          return product;
        }
        updatedProduct = { ...product, ...body, id: product.id };
        return updatedProduct;
      });

      if (!updatedProduct) {
        return response(404, { error: 'Product not found.' });
      }

      await writeProductsToGitHub(config, nextProducts, sha, `update product: ${updatedProduct.name}`);
      return response(200, { product: updatedProduct, products: nextProducts });
    }

    if (event.httpMethod === 'DELETE') {
      if (body?.id === undefined || body?.id === null) {
        return response(400, { error: '`id` is required for delete.' });
      }

      const target = products.find((product) => String(product.id) === String(body.id));
      if (!target) {
        return response(404, { error: 'Product not found.' });
      }

      const nextProducts = products.filter((product) => String(product.id) !== String(body.id));
      await writeProductsToGitHub(config, nextProducts, sha, `delete product: ${target.name}`);
      return response(200, { product: target, products: nextProducts });
    }

    return methodNotAllowed();
  } catch (error) {
    console.error('Products function error:', error);
    return response(500, { error: error.message || 'Internal server error.' });
  }
}
