// ================================================
// AUTH PAGE VIEW — Login + Signup
// ================================================
import { login, signup } from '../auth.js';
import { navigate } from '../router.js';
import { showToast, isValidEmail } from '../ui.js';

export function renderAuth(mode = 'login') {
    let currentMode = mode; // 'login' | 'signup'
    const app = document.getElementById('app');

    function render() {
        const isLogin = currentMode === 'login';
        app.innerHTML = `
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
      <div class="page">
        <nav class="navbar">
          <div class="navbar-brand" id="auth-nav-logo">🔗 LinkBrand</div>
          <div class="navbar-actions">
            <button class="btn btn-ghost" id="auth-nav-home">← Home</button>
          </div>
        </nav>
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-logo">
              <div class="auth-logo-text">🔗 LinkBrand</div>
              <div class="auth-logo-sub">${isLogin ? 'Welcome back! Log in to manage your links.' : 'Create your free brand page in seconds.'}</div>
            </div>

            <div class="auth-tabs">
              <button class="auth-tab ${isLogin ? 'active' : ''}" data-tab="login">Log In</button>
              <button class="auth-tab ${!isLogin ? 'active' : ''}" data-tab="signup">Sign Up</button>
            </div>

            <div id="auth-alert"></div>

            ${isLogin ? renderLoginForm() : renderSignupForm()}
          </div>
        </div>
      </div>
    `;
        bindEvents();
    }

    function renderLoginForm() {
        return `
      <form id="auth-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="auth-email">Email Address</label>
          <input class="form-input" type="email" id="auth-email" name="email" placeholder="you@example.com" autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input class="form-input" type="password" id="auth-password" name="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-full btn-lg" type="submit" id="auth-submit">
          Log In
        </button>
      </form>
      <div class="auth-switch">
        Don't have an account? <a id="switch-to-signup">Sign up free</a>
      </div>
    `;
    }

    function renderSignupForm() {
        return `
      <form id="auth-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="auth-email">Email Address</label>
          <input class="form-input" type="email" id="auth-email" name="email" placeholder="you@example.com" autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input class="form-input" type="password" id="auth-password" name="password" placeholder="Min. 6 characters" autocomplete="new-password" />
        </div>
        <button class="btn btn-primary btn-full btn-lg" type="submit" id="auth-submit">
          Create Brand Page
        </button>
      </form>
      <div class="auth-switch">
        Already have an account? <a id="switch-to-login">Log in</a>
      </div>
    `;
    }

    function showAlert(message, type = 'danger') {
        const el = document.getElementById('auth-alert');
        el.innerHTML = `<div class="alert alert-${type}">${type === 'danger' ? '❌' : '✅'} ${message}</div>`;
    }

    function setLoading(loading) {
        const btn = document.getElementById('auth-submit');
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner"></span> Please wait…`;
        } else {
            btn.disabled = false;
            btn.innerHTML = currentMode === 'login' ? 'Log In' : 'Create Brand Page';
        }
    }

    function bindEvents() {
        // Nav
        document.getElementById('auth-nav-logo')?.addEventListener('click', () => navigate('/'));
        document.getElementById('auth-nav-home')?.addEventListener('click', () => navigate('/'));

        // Tab switch
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentMode = tab.dataset.tab;
                render();
            });
        });
        document.getElementById('switch-to-signup')?.addEventListener('click', () => { currentMode = 'signup'; render(); });
        document.getElementById('switch-to-login')?.addEventListener('click', () => { currentMode = 'login'; render(); });

        // Live slug preview removed because brand name is auto-generated

        // Form submit
        const form = document.getElementById('auth-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email')?.value?.trim();
            const password = document.getElementById('auth-password')?.value;

            if (!isValidEmail(email)) { showAlert('Please enter a valid email address.'); return; }

            if (currentMode === 'login') {
                setLoading(true);
                await delay(300);
                const result = login(email, password);
                setLoading(false);
                if (result.success) {
                    showToast(`Welcome back, ${result.user.brandName}! 👋`);
                    navigate('/dashboard');
                } else {
                    showAlert(result.error);
                }
            } else {
                const brandName = email.split('@')[0];
                setLoading(true);
                await delay(400);
                const result = signup(email, password, brandName);
                setLoading(false);
                if (result.success) {
                    showToast(`Brand page created! Welcome, ${result.user.brandName} 🎉`, 'success', 4000);
                    navigate('/dashboard');
                } else {
                    showAlert(result.error);
                }
            }
        });
    }

    render();
}

function slugifyPreview(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
