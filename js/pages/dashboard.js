// ================================================
// DASHBOARD PAGE VIEW
// ================================================
import { getCurrentUser, logout, updateProfile } from '../auth.js';
import { getLinks, addLink, updateLink, deleteLink } from '../database.js';
import { navigate } from '../router.js';
import { showToast, openModal, closeModal, guessIconFromUrl, isValidUrl, SOCIAL_PLATFORMS } from '../ui.js';

export function renderDashboard(section = 'overview') {
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }

    const app = document.getElementById('app');
    let activeSection = section;

    function render() {
        const links = getLinks(user.slug);
        const publicUrl = `${window.location.origin}${window.location.pathname}#/p/${user.slug}`;

        app.innerHTML = `
      <div class="bg-orbs" style="opacity:0.5">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>
      <div class="page">
        <nav class="navbar">
          <div class="navbar-brand" id="dash-logo">🔗 LinkBrand</div>
          <div class="navbar-actions">
            <button class="btn btn-ghost btn-sm" id="btn-view-public">🌐 View Public Page</button>
            <button class="btn btn-ghost btn-sm" id="btn-logout">Log Out</button>
          </div>
        </nav>
        <div class="dashboard-layout">
          <aside class="sidebar">
            <div class="sidebar-section-label">Dashboard</div>
            <a class="sidebar-link ${activeSection === 'overview' ? 'active' : ''}" data-section="overview">
              <span class="icon">📊</span> Overview
            </a>
            <a class="sidebar-link ${activeSection === 'links' ? 'active' : ''}" data-section="links">
              <span class="icon">🔗</span> My Links
            </a>
            <a class="sidebar-link ${activeSection === 'qr' ? 'active' : ''}" data-section="qr">
              <span class="icon">📱</span> QR Code
            </a>
            <a class="sidebar-link ${activeSection === 'profile' ? 'active' : ''}" data-section="profile">
              <span class="icon">✏️</span> Edit Profile
            </a>
            <div class="sidebar-profile">
              <div class="sidebar-profile-name">${user.brandName}</div>
              <div class="sidebar-profile-handle">/${user.slug}</div>
            </div>
          </aside>
          <main class="main-content" id="dash-main">
            ${renderSection(activeSection, links, publicUrl, user)}
          </main>
        </div>
      </div>
    `;

        bindDashboardEvents(links, publicUrl);
    }

    function bindDashboardEvents(links, publicUrl) {
        document.getElementById('dash-logo')?.addEventListener('click', () => navigate('/'));
        document.getElementById('btn-view-public')?.addEventListener('click', () => navigate(`/p/${user.slug}`));
        document.getElementById('btn-logout')?.addEventListener('click', () => {
            logout();
            showToast('You have been logged out.', 'info');
            navigate('/');
        });

        // Sidebar nav
        document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
            link.addEventListener('click', () => {
                activeSection = link.dataset.section;
                render();
            });
        });

        // Section-specific bindings
        if (activeSection === 'overview') bindOverviewEvents(links, publicUrl);
        if (activeSection === 'links') bindLinksEvents(links);
        if (activeSection === 'qr') initQRCode(publicUrl);
        if (activeSection === 'profile') bindProfileEvents();
    }

    // ---- OVERVIEW ----
    function bindOverviewEvents(links, publicUrl) {
        document.getElementById('ov-copy-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(publicUrl).then(() => showToast('Link copied to clipboard! 📋'));
        });
        document.getElementById('ov-go-links')?.addEventListener('click', () => { activeSection = 'links'; render(); });
        initQRCodeEl('ov-qr-box', publicUrl, 140);
    }

    // ---- LINKS ----
    function bindLinksEvents(links) {
        document.getElementById('btn-add-link')?.addEventListener('click', openAddLinkModal);
        document.querySelectorAll('.btn-edit-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const link = links.find(l => l.id === id);
                if (link) openEditLinkModal(link);
            });
        });
        document.querySelectorAll('.btn-delete-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Delete this link?')) {
                    deleteLink(user.slug, id);
                    showToast('Link deleted.', 'warn');
                    render();
                }
            });
        });
    }

    function openAddLinkModal() {
        const formEl = buildLinkForm(null);
        const { body } = openModal({ title: '➕ Add New Link', content: formEl });
        bindLinkFormEvents(body, null);
    }

    function openEditLinkModal(link) {
        const formEl = buildLinkForm(link);
        const { body } = openModal({ title: '✏️ Edit Link', content: formEl });
        bindLinkFormEvents(body, link);
    }

    function buildLinkForm(link) {
        const div = document.createElement('div');
        const platformOptions = SOCIAL_PLATFORMS.map(p =>
            `<option value="${p.icon}" ${link && link.icon === p.icon ? 'selected' : ''}>${p.icon} ${p.name}</option>`
        ).join('');

        div.innerHTML = `
      <div id="link-form-alert"></div>
      <div class="form-group">
        <label class="form-label" for="lf-title">Link Title</label>
        <input class="form-input" id="lf-title" placeholder="e.g. Instagram, Website…" value="${link ? link.title : ''}" maxlength="50" />
      </div>
      <div class="form-group">
        <label class="form-label" for="lf-icon">Icon</label>
        <select class="form-input" id="lf-icon" style="cursor:pointer">
          ${platformOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="lf-url">URL</label>
        <input class="form-input" id="lf-url" placeholder="https://…" value="${link ? link.url : ''}" />
      </div>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem;">
        <button class="btn btn-ghost" id="lf-cancel">Cancel</button>
        <button class="btn btn-primary" id="lf-save">${link ? 'Save Changes' : 'Add Link'}</button>
      </div>
    `;
        return div;
    }

    function bindLinkFormEvents(container, existingLink) {
        container.querySelector('#lf-cancel')?.addEventListener('click', closeModal);

        const urlInput = container.querySelector('#lf-url');
        const iconSelect = container.querySelector('#lf-icon');

        function applyPlatformPrefix(urlInput, selectedIcon) {
            if (!urlInput) return;
            const val = urlInput.value.trim();
            const plat = SOCIAL_PLATFORMS.find(p => p.icon === selectedIcon);
            if (!plat) return;

            function isExistingUrl(str) {
                return /^(https?:\/\/|mailto:|tel:)/i.test(str) || str.includes('.');
            }

            function getPlatformOfUrl(str) {
                const s = str.toLowerCase();
                if (s.startsWith('tel:')) return SOCIAL_PLATFORMS.find(p => p.name === 'Phone Call');
                if (s.startsWith('mailto:')) return SOCIAL_PLATFORMS.find(p => p.name === 'Email');
                if (s.includes('whatsapp.com')) return SOCIAL_PLATFORMS.find(p => p.name === 'WhatsApp');
                if (s.includes('google.com/maps') || s.includes('maps.google.com') || s.includes('maps.app')) return SOCIAL_PLATFORMS.find(p => p.name === 'Google Maps');
                for (const p of SOCIAL_PLATFORMS) {
                    if (p.domain && s.includes(p.domain)) return p;
                }
                return null;
            }

            const currentPlat = getPlatformOfUrl(val);
            const isCustomUrl = !currentPlat && isExistingUrl(val);

            let handle = val;
            if (currentPlat) {
                if (currentPlat.name === 'Phone Call') {
                    handle = val.substring(4);
                } else if (currentPlat.name === 'Email') {
                    handle = val.substring(7);
                } else if (currentPlat.domain) {
                    let dom = currentPlat.domain;
                    if (currentPlat.name === 'WhatsApp' && val.includes('whatsapp.com')) {
                        dom = 'whatsapp.com';
                    } else if (currentPlat.name === 'Google Maps') {
                        if (val.includes('maps.google.com')) dom = 'maps.google.com';
                        else if (val.includes('maps.app')) dom = 'maps.app';
                        else dom = 'google.com/maps';
                    }
                    const idx = val.toLowerCase().indexOf(dom) + dom.length;
                    handle = val.substring(idx);
                }
                handle = handle.replace(/^[/\s@]+/, '');
            } else if (isCustomUrl) {
                handle = '';
            } else {
                handle = handle.replace(/^[/\s@]+/, '');
            }

            if (plat.name === 'Phone Call') {
                const clean = handle.replace(/[^\d+]/g, '');
                urlInput.value = 'tel:' + clean;
            } else if (plat.name === 'Email') {
                urlInput.value = 'mailto:' + handle;
            } else if (plat.domain) {
                urlInput.value = `https://${plat.domain}/${handle}`;
            } else {
                if (isCustomUrl) {
                    urlInput.value = val;
                } else if (handle) {
                    urlInput.value = handle.startsWith('http') ? handle : 'https://' + handle;
                } else {
                    urlInput.value = '';
                }
            }
        }

        // Auto-detect icon from URL
        urlInput?.addEventListener('blur', () => {
            const guessed = guessIconFromUrl(urlInput.value);
            if (guessed !== '🔗' && iconSelect) {
                const opt = Array.from(iconSelect.options).find(o => o.value === guessed);
                if (opt) iconSelect.value = guessed;
            }
        });

        // Auto-generate URL prefix based on icon selected
        iconSelect?.addEventListener('change', () => {
            applyPlatformPrefix(urlInput, iconSelect.value);
        });

        container.querySelector('#lf-save')?.addEventListener('click', () => {
            const title = container.querySelector('#lf-title').value.trim();
            const url = container.querySelector('#lf-url').value.trim();
            const icon = container.querySelector('#lf-icon').value;
            const alertEl = container.querySelector('#link-form-alert');

            if (!title) { alertEl.innerHTML = `<div class="alert alert-danger">❌ Please enter a link title.</div>`; return; }
            if (!url) { alertEl.innerHTML = `<div class="alert alert-danger">❌ Please enter a URL.</div>`; return; }

            if (existingLink) {
                updateLink(user.slug, existingLink.id, { title, url, icon });
                showToast('Link updated! ✅');
            } else {
                addLink(user.slug, { title, url, icon });
                showToast('Link added! 🎉');
            }
            closeModal();
            render();
        });
    }

    // ---- QR ----
    function initQRCode(publicUrl) {
        setTimeout(() => initQRCodeEl('qr-main-box', publicUrl, 200), 50);
        document.getElementById('btn-download-qr')?.addEventListener('click', () => downloadQR());
        document.getElementById('btn-copy-url')?.addEventListener('click', () => {
            navigator.clipboard.writeText(publicUrl).then(() => showToast('URL copied! 📋'));
        });
    }

    // ---- PROFILE EDIT ----
    function bindProfileEvents() {
        document.getElementById('profile-save')?.addEventListener('click', () => {
            const brandName = document.getElementById('pf-brand').value.trim();
            if (!brandName) { showToast('Brand name cannot be empty.', 'error'); return; }
            const result = updateProfile({ brandName });
            if (result.success) {
                // Reload with updated user
                Object.assign(user, result.user);
                showToast('Profile updated! ✅');
                render();
            } else {
                showToast(result.error, 'error');
            }
        });
    }

    render();
}

// ---- HTML sections ----
function renderSection(section, links, publicUrl, user) {
    switch (section) {
        case 'overview': return renderOverview(links, publicUrl, user);
        case 'links': return renderLinks(links);
        case 'qr': return renderQRSection(publicUrl);
        case 'profile': return renderProfileSection(user);
        default: return renderOverview(links, publicUrl, user);
    }
}

function renderOverview(links, publicUrl, user) {
    const shortUrl = publicUrl.replace(/^https?:\/\//, '').replace(/.*index\.html#\//, 'linkbrand.io/').replace(/.*:\d+\/#\//, 'linkbrand.io/').replace(/\/p\//, '/');
    return `
    <div class="section-header" style="margin-bottom:1.5rem">
      <div>
        <div class="section-title">👋 Hello, ${user.brandName}</div>
        <div class="section-sub">Here's an overview of your brand page.</div>
      </div>
      <button class="btn btn-primary" id="ov-go-links">+ Add Links</button>
    </div>

    <div class="profile-grid" style="margin-bottom:1.5rem">
      <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:1.5rem">
        <div style="display:flex;align-items:center;gap:1.5rem">
          <div style="width:64px;height:64px;font-size:1.8rem;background:var(--primary);background:linear-gradient(135deg, var(--primary), #a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;border-radius:12px;flex-shrink:0">${user.logoUrl ? `<img src="${user.logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:12px" />` : user.brandName.charAt(0).toUpperCase()}</div>
          <div style="display:flex;gap:1rem;align-items:center;flex-grow:1;justify-content:space-around">
            <div style="text-align:center"><div class="stat-value" style="margin-bottom:6px;font-size:1.8rem;line-height:1">${links.length}</div><div class="stat-label" style="font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Links</div></div>
            <div style="width:1px;height:40px;background:var(--border);"></div>
            <div style="text-align:center"><div class="stat-value" style="margin-bottom:6px;font-size:1.8rem;line-height:1">1</div><div class="stat-label" style="font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">QR Code</div></div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.02);border-radius:var(--r);padding:1.2rem;border:1px solid var(--border)">
          <div class="form-label" style="margin-bottom:.8rem;font-size:.8rem;color:var(--text2)">Your Public URL</div>
          <div style="display:flex;gap:.7rem;align-items:center">
            <div class="qr-url" style="flex:1;margin:0;text-align:left;padding:.7rem 1rem;font-size:.9rem;color:var(--text);display:flex;align-items:center;gap:.6rem;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:var(--r-sm)">
              <span style="opacity:0.7;font-size:1.1rem">🌐</span> <span dir="ltr">${shortUrl}</span>
            </div>
            <button class="btn btn-primary" id="ov-copy-link" style="padding:.7rem 1.2rem;font-weight:600">Copy Link</button>
          </div>
        </div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem;background:var(--bg-card)">
        <div class="form-label" style="margin:0;font-size:.8rem;color:var(--text2);text-transform:uppercase;letter-spacing:1px">QR Code Preview</div>
        <div class="qr-wrapper">
          <div class="qr-box" id="ov-qr-box" style="padding:16px;border-radius:12px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1)"></div>
        </div>
        <div style="font-size:.85rem;color:var(--muted);text-align:center;max-width:240px;line-height:1.5">Scan this code to instantly visit your brand page</div>
      </div>
    </div>

    ${links.length > 0 ? `
    <div class="card">
      <div class="section-header" style="margin-bottom:1.2rem">
        <div class="section-title" style="font-size:1.1rem">Your Links</div>
        <span class="badge badge-purple" style="font-size:.8rem;padding:.3rem .8rem">${links.length} active</span>
      </div>
      <div class="links-list">
        ${links.slice(0, 3).map(l => {
          const plat = SOCIAL_PLATFORMS.find(p => p.icon === l.icon);
          const brandClass = plat ? `pl-${plat.name.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` : '';
          return `
          <div class="link-item ${brandClass}" style="padding:1rem 1.2rem;transition:var(--tr)">
            <div class="link-item-icon" style="font-size:1.3rem;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:var(--r-sm)">${l.icon}</div>
            <div class="link-item-info">
              <div class="link-item-title" style="font-size:1rem;margin-bottom:4px;font-weight:600">${l.title}</div>
              <div class="link-item-url" dir="ltr" style="font-size:.85rem;color:var(--muted)">${l.url}</div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : `
    <div class="card">
      <div class="empty-state" style="padding:3.5rem 1rem">
        <div class="empty-state-icon" style="font-size:3.5rem;margin-bottom:1.2rem;opacity:0.8">🔗</div>
        <div class="empty-state-title" style="font-size:1.35rem;margin-bottom:.5rem;font-weight:700">No links yet</div>
        <div style="color:var(--muted);margin-bottom:1.8rem;font-size:.95rem;max-width:300px;margin-left:auto;margin-right:auto">Add your first social media link to get started.</div>
        <button class="btn btn-primary btn-lg" id="ov-go-links" style="padding:.9rem 2rem;font-weight:600;font-size:.95rem">+ Add Your First Link</button>
      </div>
    </div>
    `}
  `;
}

function renderLinks(links) {
    return `
    <div class="section-header">
      <div>
        <div class="section-title">🔗 My Links</div>
        <div class="section-sub">Add, edit, or remove your social media links.</div>
      </div>
      <button class="btn btn-primary" id="btn-add-link">+ Add Link</button>
    </div>

    <div class="card">
      ${links.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔗</div>
          <div class="empty-state-title">No links yet</div>
          <div>Click "Add Link" to add your first social media link.</div>
        </div>
      ` : `
        <div class="links-list">
          ${links.map(l => {
            const plat = SOCIAL_PLATFORMS.find(p => p.icon === l.icon);
            const brandClass = plat ? `pl-${plat.name.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` : '';
            return `
            <div class="link-item ${brandClass}">
              <div class="link-item-icon">${l.icon}</div>
              <div class="link-item-info">
                <div class="link-item-title">${l.title}</div>
                <div class="link-item-url">${l.url}</div>
              </div>
              <div class="link-item-actions">
                <button class="btn btn-ghost btn-sm btn-edit-link" data-id="${l.id}" title="Edit">✏️</button>
                <button class="btn btn-icon btn-delete-link" data-id="${l.id}" title="Delete">🗑</button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function renderQRSection(publicUrl) {
    return `
    <div class="section-header">
      <div>
        <div class="section-title">📱 QR Code</div>
        <div class="section-sub">Share this QR code to let anyone scan and visit your brand page.</div>
      </div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:1.5rem;padding:2.5rem">
      <div class="qr-box" id="qr-main-box"></div>
      <div class="qr-url" style="max-width:400px">🌐 ${publicUrl}</div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-primary" id="btn-download-qr">⬇️ Download QR Code</button>
        <button class="btn btn-ghost" id="btn-copy-url">📋 Copy URL</button>
      </div>
      <div class="section-sub" style="text-align:center;max-width:380px">
        Print this on packaging, business cards, or menus to let customers discover your brand instantly.
      </div>
    </div>
  `;
}

function renderProfileSection(user) {
    return `
    <div class="section-header">
      <div>
        <div class="section-title">✏️ Edit Profile</div>
        <div class="section-sub">Update your brand name and details.</div>
      </div>
    </div>
    <div class="card" style="max-width:520px">
      <div class="profile-pic-row">
        <div class="profile-avatar-big">${user.brandName.charAt(0).toUpperCase()}</div>
        <div class="profile-avatar-info">
          <div class="profile-avatar-name">${user.brandName}</div>
          <div class="profile-avatar-email">${user.email}</div>
        </div>
      </div>
      <div class="divider" style="margin-bottom:1.25rem"></div>
      <div class="form-group">
        <label class="form-label" for="pf-brand">Brand Name</label>
        <input class="form-input" id="pf-brand" value="${user.brandName}" maxlength="40" />
        <div class="form-helper">This will also update your public URL slug.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" value="${user.email}" disabled style="opacity:0.5;cursor:not-allowed" />
        <div class="form-helper">Email cannot be changed.</div>
      </div>
      <div style="margin-top:1.25rem">
        <button class="btn btn-primary" id="profile-save">Save Changes</button>
      </div>
    </div>
  `;
}

// ---- QR Code initializer ----
function initQRCodeEl(containerId, url, size = 160) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (window.QRCode) {
        new window.QRCode(el, { text: url, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M });
    } else {
        el.innerHTML = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.75rem;text-align:center;">QR library not loaded</div>`;
    }
}

function downloadQR() {
    const canvas = document.querySelector('#qr-main-box canvas');
    if (canvas) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'brand-qr-code.png';
        a.click();
        showToast('QR Code downloaded! 📥');
    } else {
        showToast('QR code not ready yet, please wait.', 'warn');
    }
}
