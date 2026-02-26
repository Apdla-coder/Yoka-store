// Cart Manager - Handles cart operations with Supabase and localStorage
class CartManager {
  constructor() {
    this.cart = { items: [] };  // تهيئة فورية — لا null
    this.user = null;
    this.init();
  }

  async init() {
    // Wait for Supabase to be available
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      console.error('Supabase client not available');
      // Initialize with localStorage only
      this.loadCartFromLocalStorage();
      this.updateCartBadge();
      return;
    }

    // Check if user is logged in
    await this.checkUserAuth();

    // Load cart
    if (this.user) {
      await this.loadCartFromSupabase();
    } else {
      this.loadCartFromLocalStorage();
    }

    // Update cart badge
    this.updateCartBadge();
  }

  async checkUserAuth() {
    try {
      if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.log('Supabase auth not available, using guest mode');
        this.user = null;
        return;
      }

      const { data: { user } } = await window.supabaseClient.auth.getUser();
      this.user = user;
    } catch (error) {
      console.error('Error checking auth:', error);
      this.user = null;
    }
  }

  // Load cart from Supabase for logged-in users
  async loadCartFromSupabase() {
    try {
      const { data: carts, error } = await window.supabaseClient
        .from('carts')
        .select('*')
        .eq('user_id', this.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading cart:', error);
        this.loadCartFromLocalStorage();
        return;
      }

      if (!carts) {
        // Create new cart for user
        await this.createCartInSupabase();
        return;
      }

      // Load cart items
      const { data: items, error: itemsError } = await window.supabaseClient
        .from('cart_items')
        .select(`
          *,
          products(name, image_url, price)
        `)
        .eq('cart_id', carts.id);

      if (itemsError) {
        console.error('Error loading cart items:', itemsError);
        return;
      }

      this.cart = {
        id: carts.id,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          name: item.products.name,
          image: item.products.image_url,
          price: item.price_at_time,
          quantity: item.quantity
        }))
      };
    } catch (error) {
      console.error('Failed to load cart from Supabase:', error);
      this.loadCartFromLocalStorage();
    }
  }

  // Load cart from localStorage for guest users
  loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('yoka_cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    } else {
      this.cart = { items: [] };
    }
  }

  // Create new cart in Supabase
  async createCartInSupabase() {
    try {
      const { data, error } = await window.supabaseClient
        .from('carts')
        .insert({ user_id: this.user.id })
        .select()
        .single();

      if (error) {
        console.error('Error creating cart:', error);
        return;
      }

      this.cart = { id: data.id, items: [] };
    } catch (error) {
      console.error('Failed to create cart:', error);
    }
  }

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    try {
      // التأكد من تهيئة السلة
      if (!this.cart) this.cart = { items: [] };

      // Get product details
      let product = window.PRODUCTS?.find(p => p.id === productId);

      // إذا لم يوجد في window.PRODUCTS، حاول من Supabase مباشرة
      if (!product && window.supabaseClient) {
        try {
          const { data } = await window.supabaseClient
            .from('products').select('id, name, image_url, price').eq('id', productId).single();
          if (data) product = { id: data.id, name: data.name, image: data.image_url, price: data.price };
        } catch (e) { /* ignored */ }
      }

      if (!product) {
        console.error('Product not found:', productId);
        return false;
      }

      if (this.user) {
        await this.addToSupabaseCart(productId, quantity, product);
      } else {
        this.addToLocalStorageCart(productId, quantity, product);
      }

      this.updateCartBadge();
      window.showToast('تمت الإضافة إلى السلة');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      window.showToast('حدث خطأ، يرجى المحاولة مرة أخرى');
      return false;
    }
  }

  // Add to Supabase cart
  async addToSupabaseCart(productId, quantity, product) {
    // Check if item already exists in cart
    const existingItem = this.cart.items.find(item => item.productId === productId);

    if (existingItem) {
      // Update quantity
      const { error } = await window.supabaseClient
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) throw error;
      existingItem.quantity += quantity;
    } else {
      // Add new item
      const { data, error } = await window.supabaseClient
        .from('cart_items')
        .insert({
          cart_id: this.cart.id,
          product_id: productId,
          quantity: quantity,
          price_at_time: product.price
        })
        .select()
        .single();

      if (error) throw error;

      this.cart.items.push({
        id: data.id,
        productId: productId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: quantity
      });
    }
  }

  // Add to localStorage cart
  addToLocalStorageCart(productId, quantity, product) {
    if (!this.cart || !Array.isArray(this.cart.items)) this.cart = { items: [] };
    const existingItem = this.cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.items.push({
        productId: productId,
        name: product.name,
        image: product.image || product.image_url || '',
        price: product.price,
        quantity: quantity
      });
    }

    this.saveCartToLocalStorage();
  }

  // Save cart to localStorage
  saveCartToLocalStorage() {
    localStorage.setItem('yoka_cart', JSON.stringify(this.cart));
  }

  // Update cart badge
  updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const items = this.cart?.items || [];
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      badge.textContent = totalItems;
      badge.style.transform = 'scale(1.5)';
      setTimeout(() => badge.style.transform = '', 300);
    }
  }

  // Get cart total
  getCartTotal() {
    const items = this.cart?.items || [];
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      if (this.user) {
        const item = this.cart.items.find(item => item.productId === productId);
        if (item) {
          await window.supabaseClient
            .from('cart_items')
            .delete()
            .eq('id', item.id);
        }
      }

      this.cart.items = this.cart.items.filter(item => item.productId !== productId);

      if (!this.user) {
        this.saveCartToLocalStorage();
      }

      this.updateCartBadge();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Update item quantity
  async updateQuantity(productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }

      if (this.user) {
        const item = this.cart.items.find(item => item.productId === productId);
        if (item) {
          await window.supabaseClient
            .from('cart_items')
            .update({ quantity })
            .eq('id', item.id);
        }
      }

      const item = this.cart.items.find(item => item.productId === productId);
      if (item) {
        item.quantity = quantity;
      }

      if (!this.user) {
        this.saveCartToLocalStorage();
      }

      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  // Clear cart
  async clearCart() {
    try {
      if (this.user && this.cart.id) {
        await window.supabaseClient
          .from('cart_items')
          .delete()
          .eq('cart_id', this.cart.id);
      }

      this.cart.items = [];

      if (!this.user) {
        this.saveCartToLocalStorage();
      }

      this.updateCartBadge();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  // Get cart items
  getCartItems() {
    return this.cart?.items || [];
  }
}

// Initialize cart manager globally
if (!window.cartManager) {
  window.cartManager = new CartManager();
}
