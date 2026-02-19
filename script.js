/* ═══════════════════════════════════════════════
   YOKA STORE — Main JavaScript
═══════════════════════════════════════════════ */

'use strict';

// ─── Data ────────────────────────────────────
// Legacy products array - kept for fallback
const LEGACY_PRODUCTS = [
  {
    id: 1,
    name: 'Velvet Rose Lip Kit',
    brand: 'Yoka Beauty',
    category: 'makeup',
    price: 290,
    oldPrice: null,
    badge: 'Best Seller',
    badgeType: '',
    image: 'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 248,
    colors: ['#c41e3a', '#8B2252', '#D2691E'],
    sizes: ['N/A'],
    desc: 'أحمر شفاه فاخر مع بطانة شفاه وتبت شفاه. يدوم حتى ١٢ ساعة بلا تشقق.'
  },
  {
    id: 2,
    name: 'Glow Serum 30ml',
    brand: 'Yoka Skin',
    category: 'skincare',
    price: 185,
    oldPrice: null,
    badge: 'New',
    badgeType: 'new',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 92,
    colors: [],
    sizes: ['30ml', '50ml'],
    desc: 'سيروم الإشراق الفاخر بتركيبة نياسيناميد وفيتامين C. يمنح بشرتك توهجاً صحياً.'
  },
  {
    id: 3,
    name: 'Midnight Palazzo Set',
    brand: 'Yoka Fashion',
    category: 'fashion',
    price: 620,
    oldPrice: 850,
    badge: 'Sale',
    badgeType: 'sale',
    image: 'https://images.unsplash.com/photo-1539109132381-31a1ba974f82?q=80&w=800&auto=format&fit=crop',
    rating: 4,
    ratingCount: 67,
    colors: ['#1a1a2e', '#16213e', '#4a0e8f'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    desc: 'طقم بالاتزو أنيق من قماش الكريب الفاخر. مثالي للسهرات والمناسبات الراقية.'
  },
  {
    id: 4,
    name: 'Rose Gold Eye Palette',
    brand: 'Yoka Beauty',
    category: 'makeup',
    price: 340,
    oldPrice: null,
    badge: 'Best Seller',
    badgeType: '',
    image: 'https://images.unsplash.com/photo-1512496011931-a2c388278ab7?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 315,
    colors: [],
    sizes: ['N/A'],
    desc: 'باليت عيون بـ ١٢ ظلال من الدرجات الدافئة والميتاليك. جودة احترافية للجميع.'
  },
  {
    id: 5,
    name: 'Silk Abaya - Pearl',
    brand: 'Yoka Fashion',
    category: 'fashion',
    price: 890,
    oldPrice: null,
    badge: 'New',
    badgeType: 'new',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 44,
    colors: ['#f5f0e8', '#d4c5b0', '#8B7355'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    desc: 'عباءة حريرية بلون اللؤلؤ مع تطريز يدوي رفيع. أناقة لا مثيل لها.'
  },
  {
    id: 6,
    name: 'Hydra-Boost Cream',
    brand: 'Yoka Skin',
    category: 'skincare',
    price: 220,
    oldPrice: 280,
    badge: 'Sale',
    badgeType: 'sale',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    rating: 4,
    ratingCount: 128,
    colors: [],
    sizes: ['50ml'],
    desc: 'كريم مرطب فائق يعمل لـ ٤٨ ساعة. تركيبة خالية من البارابين مناسبة للبشرة الحساسة.'
  },
  {
    id: 7,
    name: 'Contour & Blush Duo',
    brand: 'Yoka Beauty',
    category: 'makeup',
    price: 195,
    oldPrice: null,
    badge: '',
    badgeType: '',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 189,
    colors: [],
    sizes: ['N/A'],
    desc: 'ثنائي الكونتور والبلاشر لنحت الوجه بشكل طبيعي ومشرق طوال اليوم.'
  },
  {
    id: 8,
    name: 'Crystal Mini Bag',
    brand: 'Yoka Accessories',
    category: 'accessories',
    price: 450,
    oldPrice: null,
    badge: 'New',
    badgeType: 'new',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop',
    rating: 5,
    ratingCount: 36,
    colors: ['#f0e6d3', '#1a1a1a', '#c5a3ff'],
    sizes: ['N/A'],
    desc: 'حقيبة ميني راقية مزينة بالكريستال. الرفيق المثالي لكل مناسبة.'
  }
];

// Dynamic products from Supabase
let PRODUCTS = [];

// ─── State ───────────────────────────────────
let activeFilter = 'all';
let cartCount = 3;

// ─── DOM Ready ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initNav();
  initMobileMenu();
  initRevealAnimations();
  loadProductsFromSupabase(); // Load products from Supabase
  initFilters();
  initModal();
  initToast();
  initTestimonialsDots();
  loadHeroBgImageFromSettings();
});

// ─── Hero image from site_settings (لوحة التحكم) ─────
async function loadHeroBgImageFromSettings() {
  if (!document.querySelector('.hero-image-bg')) return;
  if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
  try {
    const { data, error } = await window.supabaseClient.from('site_settings').select('value').eq('key', 'hero_bg_image').single();
    if (!error && data && data.value && data.value.trim()) {
      document.documentElement.style.setProperty('--hero-bg-image', `url(${data.value.trim()})`);
    }
  } catch (e) { /* ignore */ }
}

// ─── Load Products from Supabase ──────────────────────────
async function loadProductsFromSupabase() {
  if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') {
    PRODUCTS = LEGACY_PRODUCTS;
    window.PRODUCTS = PRODUCTS;
    initProducts();
    return;
  }
  try {
    const { data: products, error } = await window.supabaseClient
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      PRODUCTS = LEGACY_PRODUCTS;
    } else {
      PRODUCTS = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.categories?.slug || 'makeup',
        price: p.price,
        oldPrice: p.old_price,
        badge: p.badge,
        badgeType: p.badge_type || '',
        image: p.image_url || `https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop`,
        rating: p.rating ?? 5,
        ratingCount: p.rating_count ?? 0,
        colors: [],
        sizes: [],
        desc: p.description || 'منتج مميز من Yoka Store'
      }));
    }
    window.PRODUCTS = PRODUCTS;
    initProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
    PRODUCTS = LEGACY_PRODUCTS;
    window.PRODUCTS = PRODUCTS;
    initProducts();
  }
}

// ─── Loader ───────────────────────────────────
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) {
    document.body.style.overflow = '';
    return;
  }
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    loader.classList.add('done');
    document.body.style.overflow = '';
    // Trigger hero reveals after load (only on pages that have them)
    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 80);
    });
    document.querySelectorAll('.hero-title-line').forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), 200 + i * 120);
    });
    ['hero-tag', 'hero-subtitle', 'hero-actions'].forEach((cls, i) => {
      const el = document.querySelector(`.${cls}`);
      if (el) setTimeout(() => el.classList.add('revealed'), 100 + i * 150);
    });
  }, 1800);
}

// ─── Custom Cursor ────────────────────────────
function initCursor() {
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');

  let mx = 0, my = 0;
  let cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  function animateCursor() {
    cx += (mx - cx) * .12;
    cy += (my - cy) * .12;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effects
  document.querySelectorAll('a, button, .cat-card, .product-card, .social-item').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ─── Navigation ───────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ─── Mobile Menu ──────────────────────────────
function initMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('menuBtn');
  const close = document.getElementById('menuClose');

  btn?.addEventListener('click', () => menu.classList.add('open'));
  close?.addEventListener('click', () => menu.classList.remove('open'));
  menu?.addEventListener('click', e => {
    if (e.target === menu) menu.classList.remove('open');
  });
}

// ─── Reveal Animations ────────────────────────
function initRevealAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

// ─── Render Products ──────────────────────────
function initProducts() {
  renderProducts(PRODUCTS);
  updateCategoryCounts();
}

function updateCategoryCounts() {
  document.querySelectorAll('.cat-card[data-category-slug]').forEach(card => {
    const slug = card.dataset.categorySlug;
    const count = (PRODUCTS || []).filter(p => p.category === slug).length;
    const span = card.querySelector('.cat-count');
    if (span) span.textContent = '+' + count + ' منتج';
  });
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const safeId = (id) => (typeof id === 'string' ? `'${id.replace(/'/g, "\\'")}'` : id);
  grid.innerHTML = products.map(p => `
    <div class="product-card" data-category="${p.category}" data-id="${p.id}">
      <div class="product-card-img">
        <img src="${p.image}" alt="${p.name}" class="product-img">
        ${p.badge ? `<span class="product-card-badge ${p.badgeType}">${p.badge}</span>` : ''}
        <div class="product-card-actions">
          <button class="product-card-action-btn" onclick="openQuickView(${safeId(p.id)})">عرض سريع</button>
          <button class="product-card-action-btn" onclick="addToCart(${safeId(p.id)})">أضف للسلة</button>
          <button class="product-card-action-btn wishlist-btn" onclick="addToWishlist(${safeId(p.id)})" aria-label="Wishlist">♡</button>
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-brand">${p.brand}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">
          <span class="price-current">${p.price} ر.س</span>
          ${p.oldPrice ? `<span class="price-old">${p.oldPrice} ر.س</span>` : ''}
        </div>
        <div class="product-card-rating">
          <span class="stars">${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</span>
          <span class="rating-count">(${p.ratingCount})</span>
        </div>
      </div>
    </div>
  `).join('');

  // Re-apply cursor hover effects to new elements
  grid.querySelectorAll('.product-card').forEach(el => {
    const cursor = document.getElementById('cursor');
    el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
  });
}

// ─── Filter ───────────────────────────────────
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;

      let filtered;
      if (activeFilter === 'all') {
        filtered = PRODUCTS;
      } else if (activeFilter === 'new') {
        filtered = PRODUCTS.filter(p => p.badgeType === 'new');
      } else {
        filtered = PRODUCTS.filter(p => p.category === activeFilter);
      }

      const grid = document.getElementById('productsGrid');
      grid.style.opacity = '0';
      grid.style.transform = 'translateY(10px)';
      grid.style.transition = 'opacity .3s ease, transform .3s ease';
      setTimeout(() => {
        renderProducts(filtered.length ? filtered : PRODUCTS);
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
      }, 300);
    });
  });
}

// ─── Quick View Modal ─────────────────────────
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openQuickView(id) {
  const products = window.PRODUCTS || PRODUCTS;
  const product = products.find(p => p.id == id);
  if (!product) return;

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const sizesHtml = product.sizes.filter(s => s !== 'N/A').length
    ? `<div>
        <div class="modal-size-label">المقاس</div>
        <div class="modal-sizes">
          ${product.sizes.map((s, i) => `<button class="size-btn ${i === 0 ? 'active' : ''}" onclick="selectSize(this)">${s}</button>`).join('')}
        </div>
      </div>`
    : '';

  content.innerHTML = `
    <div class="modal-img">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="modal-info">
      <div>
        <div class="product-card-brand">${product.brand}</div>
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-price">
          <span class="price-current">${product.price} ر.س</span>
          ${product.oldPrice ? `<span class="price-old">${product.oldPrice} ر.س</span>` : ''}
        </div>
        <div class="product-card-rating">
          <span class="stars">${'★'.repeat(product.rating)}</span>
          <span class="rating-count">(${product.ratingCount} تقييم)</span>
        </div>
      </div>
      <p class="modal-desc">${product.desc}</p>
      ${sizesHtml}
      <button class="modal-add-btn" onclick="addToCart('${String(product.id).replace(/'/g, "\\'")}'); closeModal();">إضافة إلى السلة</button>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function selectSize(btn) {
  btn.closest('.modal-sizes').querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Cart & Wishlist ──────────────────────────
async function addToCart(id) {
  if (window.cartManager) {
    await window.cartManager.addToCart(id);
  } else {
    // Fallback to old method
    cartCount++;
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = cartCount;
      badge.style.transform = 'scale(1.5)';
      setTimeout(() => badge.style.transform = '', 300);
    }
    showToast('تمت الإضافة إلى السلة');
  }
}

function addToWishlist(id) {
  showToast('تمت الإضافة إلى المفضلة');
}

// ─── Toast ────────────────────────────────────
let toastEl;
let toastTimer;

function initToast() {
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  document.body.appendChild(toastEl);
}

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ─── Testimonials Dots ────────────────────────
function initTestimonialsDots() {
  const cards = document.querySelectorAll('.testimonial-card');
  const dotsContainer = document.getElementById('tDots');
  if (!dotsContainer || !cards.length) return;

  cards.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.style.cssText = `
      display:inline-block; width:8px; height:8px; border-radius:50%;
      background:${i === 0 ? 'var(--rose-dark)' : 'var(--rose-light)'};
      transition: background .3s;
    `;
    dotsContainer.appendChild(dot);
  });
}

// ─── Newsletter Form ──────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  showToast('تم الاشتراك بنجاح! تحققي من بريدك للحصول على الخصم');
  input.value = '';
}

// ─── Smooth Anchor ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;          // ignore bare hashes
    e.preventDefault();
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
