// ========== Modern Header JavaScript ==========

class ModernHeader {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupProfileDropdown();
    this.setupMobileMenu();
    this.updateUserInfo();
  }

  setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        this.closeProfileDropdown();
      }
    });

    // Close mobile menu when clicking overlay
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay')) {
        this.closeMobileMenu();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeProfileDropdown();
        this.closeMobileMenu();
      }
    });
  }

  setupProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleProfileDropdown();
      });
    }
  }

  setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileClose = document.querySelector('.mobile-nav-close');
    
    if (mobileToggle) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openMobileMenu();
      });
    }

    if (mobileClose) {
      mobileClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMobileMenu();
      });
    }
  }

  toggleProfileDropdown() {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }

  closeProfileDropdown() {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  }

  openMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-nav-menu');
    const overlay = document.querySelector('.overlay');
    
    if (mobileMenu && overlay) {
      mobileMenu.classList.add('show');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-nav-menu');
    const overlay = document.querySelector('.overlay');
    
    if (mobileMenu && overlay) {
      mobileMenu.classList.remove('show');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  updateUserInfo() {
    const userName = localStorage.getItem('agent_name');
    const userEmail = localStorage.getItem('agent_email');
    const userRole = localStorage.getItem('role');

    if (userName) {
      const nameElements = document.querySelectorAll('.user-name');
      nameElements.forEach(el => {
        el.textContent = userName;
      });

      const avatarElements = document.querySelectorAll('.profile-avatar');
      avatarElements.forEach(el => {
        el.textContent = userName.charAt(0).toUpperCase();
      });
    }

    if (userEmail) {
      const emailElements = document.querySelectorAll('.user-email');
      emailElements.forEach(el => {
        el.textContent = userEmail;
      });
    }

    if (userRole) {
      const roleElements = document.querySelectorAll('.user-role');
      roleElements.forEach(el => {
        el.textContent = userRole === 'admin' ? 'مدير' : 'مندوب';
      });
    }
  }

  logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      localStorage.clear();
      window.location.href = './index.html';
    }
  }
}

// Navigation helper
class NavigationHelper {
  static getNavigationItems(role = 'agent') {
    const baseItems = [
      { href: './dashboard.html', text: 'لوحة التحكم', icon: '📊', roles: ['admin'] },
      { href: './collections.html', text: 'التحصيلات', icon: '💰', roles: ['agent', 'admin'] },
      { href: './management.html', text: 'إدارة العملاء', icon: '👥', roles: ['admin'] },
      { href: './excel_upload.html', text: 'رفع Excel', icon: '📈', roles: ['admin'] },
      { href: './agents_performance.html', text: 'أداء المناديب', icon: '📈', roles: ['admin'] },
      { href: './disconnected_lines.html', text: 'الخطوط المتوقفة', icon: '📵', roles: ['admin'] },
      { href: './notes.html', text: 'الملاحظات', icon: '📝', roles: ['admin'] },
      { href: './admin.html', text: 'إدارة المناديب', icon: '👤', roles: ['admin'] },
      { href: './agent_customers.html', text: 'عملائي', icon: '👥', roles: ['agent'] }
    ];

    return baseItems.filter(item => item.roles.includes(role));
  }

  static createNavigationMenu(role = 'agent') {
    const items = this.getNavigationItems(role);
    const currentPath = window.location.pathname.split('/').pop();

    return items.map(item => `
      <li class="nav-item">
        <a href="${item.href}" class="nav-link ${currentPath === item.href.split('/').pop() ? 'active' : ''}">
          <span>${item.icon}</span>
          <span>${item.text}</span>
        </a>
      </li>
    `).join('');
  }

  static createMobileNavigationMenu(role = 'agent') {
    const items = this.getNavigationItems(role);
    const currentPath = window.location.pathname.split('/').pop();

    return items.map(item => `
      <a href="${item.href}" class="mobile-nav-link ${currentPath === item.href.split('/').pop() ? 'active' : ''}">
        <span>${item.icon}</span>
        <span>${item.text}</span>
      </a>
    `).join('');
  }
}

// Initialize header when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ModernHeader();
});

// Export for use in other files
window.ModernHeader = ModernHeader;
window.NavigationHelper = NavigationHelper;
