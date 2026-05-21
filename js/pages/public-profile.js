// ================================================
// PUBLIC PROFILE PAGE VIEW
// ================================================
import { getBrandInfo } from '../database.js';
import { getLinks } from '../database.js';
import { navigate } from '../router.js';
import { SOCIAL_PLATFORMS } from '../ui.js';

export function renderPublicProfile(slug) {
    const app = document.getElementById('app');
    const brand = getBrandInfo(slug);

    if (!brand) {
        renderNotFound(slug);
        return;
    }

    const links = getLinks(slug);
    const publicUrl = `${window.location.origin}${window.location.pathname}#/p/${slug}`;
    const initial = brand.brandName.charAt(0).toUpperCase();

    app.innerHTML = `
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="page">
      <nav class="navbar">
        <div class="navbar-brand" id="pub-logo">🔗 LinkBrand</div>
        <div class="navbar-actions">
          <button class="btn btn-primary btn-sm" id="pub-create">Create Your Page</button>
        </div>
      </nav>

      <div class="public-page">
        <div class="public-profile-card">

          <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:0.75rem">
            <div class="public-avatar">${initial}</div>
            <div>
              <div class="public-brand-name">${brand.brandName}</div>
              <div class="public-brand-handle">/${slug}</div>
            </div>
          </div>

          ${links.length > 0 ? `
          <div class="public-links">
            ${links.map(l => {
              const isHttp = /^https?:\/\//i.test(l.url);
              const plat = SOCIAL_PLATFORMS.find(p => p.icon === l.icon);
              const brandClass = plat ? `pl-${plat.name.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` : '';
              return `
              <a class="public-link ${brandClass}" href="${l.url}" ${isHttp ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                <span class="link-icon">${l.icon}</span>
                <span class="link-name">${l.title}</span>
                <span class="link-arrow">›</span>
              </a>
              `;
            }).join('')}
          </div>
          ` : `
          <div style="text-align:center;color:var(--text-muted);font-size:0.9rem;padding:2rem 0;">
            No links added yet.
          </div>
          `}

          <div class="public-qr-section">
            <div class="public-qr-title">Scan to visit this page</div>
            <div class="qr-box" id="pub-qr-box"></div>
            <button class="btn btn-ghost btn-sm" id="pub-copy-url">📋 Copy Link</button>
          </div>

          <div class="public-footer">
            Powered by <a href="#/">🔗 LinkBrand</a> — Create your own free brand page.
          </div>

        </div>
      </div>
    </div>
  `;

    // Events
    document.getElementById('pub-logo')?.addEventListener('click', () => navigate('/'));
    document.getElementById('pub-create')?.addEventListener('click', () => navigate('/signup'));
    document.getElementById('pub-copy-url')?.addEventListener('click', () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            const btn = document.getElementById('pub-copy-url');
            if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy Link', 2000); }
        });
    });

    // Render QR
    setTimeout(() => {
        const qrEl = document.getElementById('pub-qr-box');
        if (qrEl && window.QRCode) {
            qrEl.innerHTML = '';
            new window.QRCode(qrEl, { text: publicUrl, width: 160, height: 160, correctLevel: window.QRCode.CorrectLevel.M });
        }
    }, 50);
}

function renderNotFound(slug) {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>
    <div class="page">
      <nav class="navbar">
        <div class="navbar-brand" id="nf-logo" style="cursor:pointer">🔗 LinkBrand</div>
        <div class="navbar-actions">
          <button class="btn btn-primary btn-sm" id="nf-create">Create Your Page</button>
        </div>
      </nav>
      <div class="not-found">
        <div class="not-found-code">404</div>
        <div style="font-size:1.2rem;font-weight:700">Brand not found</div>
        <div style="color:var(--text-muted)">No brand with the name <strong>/${slug}</strong> exists.</div>
        <button class="btn btn-primary btn-lg" id="nf-home" style="margin-top:0.5rem">← Back to Home</button>
      </div>
    </div>
  `;
    document.getElementById('nf-logo')?.addEventListener('click', () => navigate('/'));
    document.getElementById('nf-home')?.addEventListener('click', () => navigate('/'));
    document.getElementById('nf-create')?.addEventListener('click', () => navigate('/signup'));
}
