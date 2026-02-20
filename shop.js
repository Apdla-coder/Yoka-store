/* ═══════════════════════════════════════════════
   YOKA STORE — Shop Page Logic
   Loads products from Supabase, filters, sort, pagination
═══════════════════════════════════════════════ */

'use strict';

const SHOP = {
  products: [],
  categories: [],
  allColors: [],
  allBrands: [],
  filtered: [],
  filters: { categories: [], brands: [], colors: [], priceMin: 0, priceMax: 5000, rating: 4 },
  sort: 'newest',
  page: 1,
  perPage: 12
};

const SHOP_LEGACY_PRODUCTS = [
  { id: 1, name: 'Velvet Rose Lip Kit', brand: 'Yoka Beauty', category: 'makeup', price: 290, oldPrice: null, badge: 'Best Seller', badgeType: '', image: 'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 248, colors: ['#c41e3a'], sizes: ['N/A'], desc: 'أحمر شفاه فاخر' },
  { id: 2, name: 'Glow Serum 30ml', brand: 'Yoka Skin', category: 'skincare', price: 185, oldPrice: null, badge: 'New', badgeType: 'new', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 92, colors: [], sizes: ['30ml'], desc: 'سيروم الإشراق' },
  { id: 3, name: 'Midnight Palazzo Set', brand: 'Yoka Fashion', category: 'fashion', price: 620, oldPrice: 850, badge: 'Sale', badgeType: 'sale', image: 'https://images.unsplash.com/photo-1539109132381-31a1ba974f82?q=80&w=800&auto=format&fit=crop', rating: 4, ratingCount: 67, colors: ['#1a1a2e'], sizes: ['S', 'M', 'L'], desc: 'طقم بالاتزو' },
  { id: 4, name: 'Rose Gold Eye Palette', brand: 'Yoka Beauty', category: 'makeup', price: 340, oldPrice: null, badge: 'Best Seller', badgeType: '', image: 'https://images.unsplash.com/photo-1512496011931-a2c388278ab7?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 315, colors: [], sizes: ['N/A'], desc: 'باليت عيون' },
  { id: 5, name: 'Silk Abaya - Pearl', brand: 'Yoka Fashion', category: 'fashion', price: 890, oldPrice: null, badge: 'New', badgeType: 'new', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 44, colors: ['#f5f0e8'], sizes: ['S', 'M', 'L'], desc: 'عباءة حريرية' },
  { id: 6, name: 'Hydra-Boost Cream', brand: 'Yoka Skin', category: 'skincare', price: 220, oldPrice: 280, badge: 'Sale', badgeType: 'sale', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop', rating: 4, ratingCount: 128, colors: [], sizes: ['50ml'], desc: 'كريم مرطب' },
  { id: 7, name: 'Contour & Blush Duo', brand: 'Yoka Beauty', category: 'makeup', price: 195, oldPrice: null, badge: '', badgeType: '', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 189, colors: [], sizes: ['N/A'], desc: 'ثنائي الكونتور' },
  { id: 8, name: 'Crystal Mini Bag', brand: 'Yoka Accessories', category: 'accessories', price: 450, oldPrice: null, badge: 'New', badgeType: 'new', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop', rating: 5, ratingCount: 36, colors: ['#f0e6d3'], sizes: ['N/A'], desc: 'حقيبة ميني' }
];

async function loadShopData() {
  const grid = document.getElementById('shopGrid');
  const countEl = document.getElementById('shopCount');
  if (countEl) countEl.textContent = 'جاري التحميل...';

  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
    try {
      const [catRes, prodRes] = await Promise.all([
        window.supabaseClient.from('categories').select('id, name, slug').eq('is_active', true).order('order'),
        window.supabaseClient.from('products').select(`
          *,
          categories!inner(name, slug),
          product_colors(color_hex),
          product_sizes(size)
        `).eq('is_active', true).order('created_at', { ascending: false })
      ]);

      if (!catRes.error) SHOP.categories = catRes.data || [];
      if (!prodRes.error && prodRes.data) {
        SHOP.products = prodRes.data.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.categories?.slug || 'makeup',
          categoryName: p.categories?.name,
          price: Number(p.price),
          oldPrice: p.old_price ? Number(p.old_price) : null,
          badge: p.badge,
          badgeType: p.badge_type || '',
          image: p.image_url || 'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop',
          rating: p.rating ?? 5,
          ratingCount: p.rating_count ?? 0,
          colors: (p.product_colors || []).map(c => c.color_hex).filter(Boolean),
          sizes: (p.product_sizes || []).map(s => s.size).filter(Boolean) || ['N/A'],
          desc: p.description || 'منتج مميز من Yoka Store',
          created_at: p.created_at ? new Date(p.created_at).getTime() : 0
        }));
        const colorSet = new Set();
        SHOP.products.forEach(p => p.colors.forEach(c => colorSet.add(c)));
        SHOP.allColors = [...colorSet];
        const brandSet = new Set(SHOP.products.map(p => p.brand));
        SHOP.allBrands = [...brandSet].sort();
      }
    } catch (e) {
      console.error('Shop load error:', e);
    }
  }

  if (SHOP.products.length === 0) {
    SHOP.products = SHOP_LEGACY_PRODUCTS;
    SHOP.categories = [
      { id: 1, name: 'ميك أب', slug: 'makeup' },
      { id: 2, name: 'أزياء', slug: 'fashion' },
      { id: 3, name: 'العناية بالبشرة', slug: 'skincare' },
      { id: 4, name: 'إكسسوارات', slug: 'accessories' }
    ];
    SHOP.allColors = ['#c41e3a', '#f4b8c1', '#8B2252', '#1a1a2e', '#f5f0e8', '#c9a86c'];
    SHOP.allBrands = ['Yoka Beauty', 'Yoka Fashion', 'Yoka Skin', 'Yoka Accessories'];
  }

  window.PRODUCTS = SHOP.products;
  if (typeof PRODUCTS !== 'undefined') PRODUCTS = SHOP.products;

  buildSidebar();
  applyFiltersFromURL();
  applyFiltersAndRender();
}

function applyFiltersFromURL() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('category');
  if (cat) {
    const cb = document.querySelector(`#sidebarCategories input[data-cat="${cat}"]`);
    if (cb) cb.checked = true;
  }
}

function buildSidebar() {
  const catList = document.getElementById('sidebarCategories');
  const colorList = document.getElementById('sidebarColors');
  const brandList = document.getElementById('sidebarBrands');

  if (catList) {
    catList.innerHTML = SHOP.categories.map(c => {
      const count = SHOP.products.filter(p => p.category === c.slug).length;
      return `<li><label><input type="checkbox" data-cat="${c.slug}" /> ${c.name} <span class="sidebar-count">${count}</span></label></li>`;
    }).join('');
  }

  if (colorList) {
    const defaults = [
      { hex: '#c41e3a', title: 'أحمر' },
      { hex: '#f4b8c1', title: 'وردي' },
      { hex: '#8B2252', title: 'أرجواني' },
      { hex: '#1a1a2e', title: 'أسود' },
      { hex: '#f5f0e8', title: 'كريمي' },
      { hex: '#c9a86c', title: 'ذهبي' }
    ];
    const used = new Set(SHOP.allColors);
    const all = [...new Set([...SHOP.allColors, ...defaults.map(d => d.hex)])];
    colorList.innerHTML = all.slice(0, 10).map(hex => {
      const t = defaults.find(d => d.hex === hex)?.title || hex;
      const border = hex === '#f5f0e8' || hex === '#ffffff' ? '1px solid #ddd' : '2px solid transparent';
      return `<div class="color-swatch" data-color="${hex}" style="background:${hex};border:${border}" title="${t}"></div>`;
    }).join('');
  }

  if (brandList) {
    brandList.innerHTML = SHOP.allBrands.map(b => {
      const count = SHOP.products.filter(p => p.brand === b).length;
      return `<li><label><input type="checkbox" data-brand="${b.replace(/"/g, '&quot;')}" /> ${b} <span class="sidebar-count">${count}</span></label></li>`;
    }).join('');
  }
}

function getFiltersFromUI() {
  const priceMin = parseInt(document.getElementById('priceMin')?.value, 10) || 0;
  const priceMax = parseInt(document.getElementById('priceMax')?.value, 10) || 5000;
  const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value, 10) || 0;
  const categories = [...document.querySelectorAll('#sidebarCategories input:checked')].map(i => i.dataset.cat);
  const brands = [...document.querySelectorAll('#sidebarBrands input:checked')].map(i => i.dataset.brand);
  const colors = [...document.querySelectorAll('.color-swatch.active')].map(s => s.dataset.color);
  return { categories, brands, colors, priceMin, priceMax, rating };
}

function filterProducts() {
  const f = getFiltersFromUI();
  let list = [...SHOP.products];

  if (f.categories.length) list = list.filter(p => f.categories.includes(p.category));
  if (f.brands.length) list = list.filter(p => f.brands.includes(p.brand));
  if (f.colors.length) list = list.filter(p => p.colors.some(c => f.colors.includes(c)));
  list = list.filter(p => p.price >= f.priceMin && p.price <= f.priceMax);
  if (f.rating > 0) list = list.filter(p => p.rating >= f.rating);

  if (SHOP.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (SHOP.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (SHOP.sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  SHOP.filtered = list;
  return list;
}

function renderActiveFilters() {
  const f = getFiltersFromUI();
  const container = document.getElementById('activeFilters');
  if (!container) return;
  const tags = [];
  f.categories.forEach(slug => {
    const c = SHOP.categories.find(x => x.slug === slug);
    tags.push({ key: 'cat', val: slug, label: c?.name || slug });
  });
  f.brands.forEach(b => tags.push({ key: 'brand', val: b, label: b }));
  f.colors.forEach(c => tags.push({ key: 'color', val: c, label: 'لون' }));
  if (f.rating > 0) tags.push({ key: 'rating', val: f.rating, label: `${'★'.repeat(f.rating)} وأكثر` });
  container.innerHTML = tags.map(t => `<span class="filter-tag" data-clear="${t.key}:${t.val}">${t.label} ✕</span>`).join('');
  container.querySelectorAll('.filter-tag').forEach(el => {
    el.addEventListener('click', () => {
      const [k, v] = el.dataset.clear.split(':');
      if (k === 'cat') document.querySelector(`#sidebarCategories input[data-cat="${v}"]`)?.click();
      else if (k === 'brand') document.querySelector(`#sidebarBrands input[data-brand="${v}"]`)?.click();
      else if (k === 'color') document.querySelector(`.color-swatch[data-color="${v}"]`)?.classList.remove('active');
      else if (k === 'rating') document.querySelector('input[name="rating"][value="0"]')?.click();
      applyFiltersAndRender();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('shopGrid');
  const countEl = document.getElementById('shopCount');
  const pagination = document.getElementById('pagination');
  if (!grid) return;

  const total = SHOP.filtered.length;
  const start = (SHOP.page - 1) * SHOP.perPage;
  const pageProducts = SHOP.filtered.slice(start, start + SHOP.perPage);

  if (countEl) {
    const from = total ? start + 1 : 0;
    const to = Math.min(start + SHOP.perPage, total);
    countEl.textContent = total ? `عرض ${from}–${to} من ${total} منتج` : 'لا توجد منتجات';
  }

  const safeId = (id) => typeof id === 'string' ? `'${String(id).replace(/'/g, "\\'")}'` : id;

  if (pageProducts.length === 0) {
    grid.innerHTML = '<div class="shop-empty">لا توجد منتجات تطابق الفلاتر المحددة. جرّبي تغيير الفلاتر.</div>';
  } else {
    grid.innerHTML = pageProducts.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-card-img">
          <a href="product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}" class="product-img">
          </a>
          ${p.badge ? `<span class="product-card-badge ${p.badgeType}">${p.badge}</span>` : ''}
          <div class="product-card-actions">
            <button class="product-card-action-btn" onclick="openQuickView('${p.id}')">عرض سريع</button>
            <button class="product-card-action-btn" onclick="addToCart('${p.id}')">أضف للسلة</button>
            <button class="product-card-action-btn wishlist-btn" onclick="addToWishlist('${p.id}')">♡</button>
          </div>
        </div>
        <div class="product-card-info">
          <div class="product-card-brand">${p.brand}</div>
          <a href="product.html?id=${p.id}" class="product-card-link">
            <div class="product-card-name">${p.name}</div>
          </a>
          <div class="product-card-price">
            <span class="price-current">${p.price} ج.م</span>
            ${p.oldPrice ? `<span class="price-old">${p.oldPrice} ج.م</span>` : ''}
          </div>
          <div class="product-card-rating">
            <span class="stars">${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</span>
            <span class="rating-count">(${p.ratingCount})</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  const totalPages = Math.ceil(total / SHOP.perPage) || 1;
  if (pagination) {
    let html = '';
    if (SHOP.page > 1) html += `<button class="page-btn" data-page="${SHOP.page - 1}">‹</button>`;
    for (let i = 1; i <= Math.min(totalPages, 7); i++) {
      html += `<button class="page-btn ${i === SHOP.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (totalPages > 7) html += `<span style="align-self:center;color:var(--text-light)">…</span><button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    if (SHOP.page < totalPages) html += `<button class="page-btn" data-page="${SHOP.page + 1}">›</button>`;
    pagination.innerHTML = html || '';
    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SHOP.page = parseInt(btn.dataset.page, 10);
        renderProducts();
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
}

function applyFiltersAndRender() {
  filterProducts();
  SHOP.page = 1;
  renderActiveFilters();
  renderProducts();
}

document.addEventListener('DOMContentLoaded', () => {
  loadShopData();

  document.getElementById('applyFilters')?.addEventListener('click', applyFiltersAndRender);
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    document.querySelectorAll('#sidebarCategories input, #sidebarBrands input').forEach(i => { i.checked = false; });
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('input[name="rating"][value="0"]')?.click();
    document.getElementById('priceMin').value = 0;
    document.getElementById('priceMax').value = 5000;
    applyFiltersAndRender();
  });

  document.getElementById('sortSelect')?.addEventListener('change', e => {
    SHOP.sort = e.target.value;
    applyFiltersAndRender();
  });

  document.getElementById('sidebarColors')?.addEventListener('click', e => {
    const sw = e.target.closest('.color-swatch');
    if (sw) sw.classList.toggle('active');
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const grid = document.getElementById('shopGrid');
      if (grid) grid.className = 'shop-products-grid ' + (this.dataset.view === 'list' ? 'view-list' : '');
    });
  });
});
