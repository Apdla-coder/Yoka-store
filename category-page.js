/* ═══════════════════════════════════════════════
   YOKA STORE — Category Page (makeup, fashion, skincare, accessories)
   Loads products from Supabase filtered by category
═══════════════════════════════════════════════ */

'use strict';

const CATEGORY_CONFIG = {
  makeup: { name: 'ميك أب', slug: 'makeup' },
  fashion: { name: 'أزياء', slug: 'fashion' },
  skincare: { name: 'العناية بالبشرة', slug: 'skincare' },
  accessories: { name: 'إكسسوارات', slug: 'accessories' }
};

async function loadCategoryProducts() {
  const main = document.querySelector('[data-category]');
  const grid = document.getElementById('categoryProductsGrid');
  const countEl = document.getElementById('categoryProductCount');
  if (!main || !grid) return;

  await loadCategoryHeroBgImageFromSettings();

  const slug = main.dataset.category;
  const config = CATEGORY_CONFIG[slug] || { name: slug, slug };
  const pageTitle = document.querySelector('h1.page-title, .page-hero h1');
  if (pageTitle) pageTitle.textContent = config.name;

  grid.innerHTML = '<div class="category-loading">جاري التحميل...</div>';

  let products = [];

  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
    try {
      const { data: catData } = await window.supabaseClient
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (catData) {
        const { data, error } = await window.supabaseClient
          .from('products')
          .select(`
            *,
            categories!inner(name, slug),
            product_colors(color_hex),
            product_sizes(size)
          `)
          .eq('is_active', true)
          .eq('category_id', catData.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          products = data.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.categories?.slug || slug,
            price: Number(p.price),
            oldPrice: p.old_price ? Number(p.old_price) : null,
            badge: p.badge,
            badgeType: p.badge_type || '',
            image: p.image_url || 'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop',
            rating: p.rating ?? 5,
            ratingCount: p.rating_count ?? 0,
            colors: (p.product_colors || []).map(c => c.color_hex).filter(Boolean),
            sizes: (p.product_sizes || []).map(s => s.size).filter(Boolean) || ['N/A'],
            desc: p.description || 'منتج مميز من Yoka Store'
          }));
        }
      }
    } catch (e) {
      console.error('Category load error:', e);
    }
  }

  if (products.length === 0) {
    const allProducts = window.PRODUCTS || [];
    products = allProducts.filter(p => p.category === slug);
  }

  window.PRODUCTS = products;

  if (countEl) countEl.textContent = products.length ? `${products.length} منتج في هذه الفئة` : 'لا توجد منتجات';

  const safeId = (id) => typeof id === 'string' ? `'${String(id).replace(/'/g, "\\'")}'` : id;

  if (products.length === 0) {
    grid.innerHTML = '<div class="category-empty">لا توجد منتجات في هذه الفئة حالياً.</div>';
  } else {
    grid.innerHTML = products.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-card-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
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
  }

  grid.querySelectorAll('.product-card').forEach(el => {
    const cursor = document.getElementById('cursor');
    el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
  });
}

async function loadCategoryHeroBgImageFromSettings() {
  if (!document.querySelector('.page-hero')) return;
  if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;

  // Get the category slug from the page
  const main = document.querySelector('[data-category]');
  const slug = main?.dataset?.category;
  if (!slug) return;

  // Each category has its own key: hero_bg_makeup, hero_bg_fashion, etc.
  const key = `hero_bg_${slug}`;
  try {
    const { data, error } = await window.supabaseClient
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();
    if (!error && data && data.value && data.value.trim()) {
      document.documentElement.style.setProperty('--page-hero-bg-image', `url(${data.value.trim()})`);
      // أضف class لتفعيل الـ overlay الداكن وتغيير لون النص للأبيض
      const heroEl = document.querySelector('.page-hero');
      if (heroEl) {
        heroEl.classList.add('has-bg-image');
      }
    }
  } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', loadCategoryProducts);
