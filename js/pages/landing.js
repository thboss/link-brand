// ================================================
// LANDING PAGE VIEW
// ================================================
import { navigate } from '../router.js';
import { getCurrentUser } from '../auth.js';

export function renderLanding() {
    const user = getCurrentUser();
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="page">
      <nav class="navbar">
        <div class="navbar-brand" id="nav-logo">🔗 LinkBrand</div>
        <div class="navbar-actions">
          ${user
            ? `<button class="btn btn-primary" id="nav-dashboard">Go to Dashboard</button>`
            : `<button class="btn btn-ghost" id="nav-login">Log In</button>
               <button class="btn btn-primary" id="nav-signup">Get Started Free</button>`
        }
        </div>
      </nav>

      <section class="landing-hero">
        <div class="landing-badge"><span class="dot"></span> Your Brand. One Link.</div>
        <h1 class="landing-title">
          Share All Your Links<br/>
          <span class="gradient-text">In One Place</span>
        </h1>
        <p class="landing-sub">
          Create a stunning branded page with all your social media profiles.
          Generate a QR code instantly and share your world with one tap.
        </p>
        <div class="landing-cta">
          <button class="btn btn-primary btn-lg" id="hero-cta">
            ✨ Create Your Brand Page
          </button>
          ${user ? `<button class="btn btn-ghost btn-lg" id="hero-view">View My Profile</button>` : ''}
        </div>
      </section>

      <section class="features">
        <div class="feature-card">
          <span class="feature-icon">🔗</span>
          <div class="feature-title">All Links, One URL</div>
          <div class="feature-desc">Consolidate Instagram, TikTok, LinkedIn, and any other link in a single beautiful page.</div>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📱</span>
          <div class="feature-title">Instant QR Code</div>
          <div class="feature-desc">Every brand page automatically generates a QR code you can print, embed, or download.</div>
        </div>
        <div class="feature-card">
          <span class="feature-icon">✏️</span>
          <div class="feature-title">Easy to Edit</div>
          <div class="feature-desc">Log in anytime to add, remove, or reorder your links. Changes reflect immediately.</div>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🌐</span>
          <div class="feature-title">Your Brand URL</div>
          <div class="feature-desc">Get a shareable link like <code style="color:#a78bfa">linkbrand.app/your-brand</code> that's uniquely yours.</div>
        </div>
      </section>
    </div>
  `;

    // Event bindings
    document.getElementById('nav-logo')?.addEventListener('click', () => navigate('/'));
    document.getElementById('nav-login')?.addEventListener('click', () => navigate('/login'));
    document.getElementById('nav-signup')?.addEventListener('click', () => navigate('/signup'));
    document.getElementById('nav-dashboard')?.addEventListener('click', () => navigate('/dashboard'));
    document.getElementById('hero-cta')?.addEventListener('click', () => {
        navigate(user ? '/dashboard' : '/signup');
    });
    document.getElementById('hero-view')?.addEventListener('click', () => {
        if (user) navigate(`/p/${user.slug}`);
    });
}
