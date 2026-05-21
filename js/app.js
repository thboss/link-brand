// ================================================
// APP ENTRY POINT — Main router and bootstrapper
// ================================================
import { route, onNotFound, startRouter, navigate } from './router.js';
import { getCurrentUser } from './auth.js';
import { renderLanding } from './pages/landing.js';
import { renderAuth } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderPublicProfile } from './pages/public-profile.js';

// --- Route Guard ---
function requireAuth(cb) {
    return function (...args) {
        const user = getCurrentUser();
        if (!user) { navigate('/login'); return; }
        cb(...args);
    };
}

// --- Route Definitions ---

// Home / Landing
route('/', renderLanding);

// Auth
route('/login', () => renderAuth('login'));
route('/signup', () => renderAuth('signup'));

// Dashboard (protected)
route('/dashboard', requireAuth(() => renderDashboard('overview')));
route('/dashboard/links', requireAuth(() => renderDashboard('links')));
route('/dashboard/qr', requireAuth(() => renderDashboard('qr')));
route('/dashboard/profile', requireAuth(() => renderDashboard('profile')));

// Public brand profiles: /p/:slug
const profileRegex = /^\/p\/([a-z0-9-]+)$/i;
route(profileRegex, (params) => {
    const slug = params[1];
    renderPublicProfile(slug);
});

// 404 / legacy brand slug (direct /:slug shorthand) 
onNotFound((hash) => {
    // Try interpreting hash as a brand slug (e.g. /beep-cup or /some-brand)
    const match = hash.match(/^\/([a-z0-9-]+)$/i);
    if (match) {
        renderPublicProfile(match[1]);
    } else {
        // Generic 404
        renderNotFound();
    }
});

function renderNotFound() {
    document.getElementById('app').innerHTML = `
    <div class="bg-orbs"><div class="orb orb-1"></div><div class="orb orb-2"></div></div>
    <div class="page">
      <nav class="navbar">
        <div class="navbar-brand" id="e404-logo">🔗 LinkBrand</div>
      </nav>
      <div class="not-found">
        <div class="not-found-code">404</div>
        <div style="font-size:1.2rem;font-weight:700">Page Not Found</div>
        <div style="color:var(--text-muted)">The page you're looking for doesn't exist.</div>
        <button class="btn btn-primary btn-lg" id="e404-home" style="margin-top:0.5rem">← Back to Home</button>
      </div>
    </div>
  `;
    document.getElementById('e404-logo')?.addEventListener('click', () => navigate('/'));
    document.getElementById('e404-home')?.addEventListener('click', () => navigate('/'));
}

// --- Boot ---
startRouter();
