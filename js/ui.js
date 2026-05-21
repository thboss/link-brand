// ================================================
// UI UTILITIES — Toast, Modal, render helpers
// ================================================

// --- Toast System ---
let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

export function showToast(message, type = 'success', duration = 3000) {
    ensureToastContainer();
    const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
    toastContainer.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// --- Modal ---
let activeModal = null;

export function openModal({ title, content, onClose }) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body"></div>
    </div>
  `;
    const body = backdrop.querySelector('.modal-body');
    if (typeof content === 'string') body.innerHTML = content;
    else body.appendChild(content);

    backdrop.querySelector('.modal-close').addEventListener('click', () => { closeModal(); if (onClose) onClose(); });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { closeModal(); if (onClose) onClose(); } });

    document.body.appendChild(backdrop);
    activeModal = backdrop;
    return { backdrop, body };
}

export function closeModal() {
    if (activeModal) { activeModal.remove(); activeModal = null; }
}

// --- Render helpers ---
export function setContent(selector, html) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) el.innerHTML = html;
}

export function clearContent(selector) {
    setContent(selector, '');
}

// --- Validation ---
export function isValidUrl(url) {
    try {
        const u = url.startsWith('http') ? url : 'https://' + url;
        new URL(u);
        return true;
    } catch { return false; }
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Social icon suggestions ---
export const SOCIAL_PLATFORMS = [
    { name: 'Instagram', icon: '📸', domain: 'instagram.com' },
    { name: 'Twitter / X', icon: '🐦', domain: 'twitter.com' },
    { name: 'TikTok', icon: '🎵', domain: 'tiktok.com' },
    { name: 'YouTube', icon: '▶️', domain: 'youtube.com' },
    { name: 'Facebook', icon: '👥', domain: 'facebook.com' },
    { name: 'Snapchat', icon: '👻', domain: 'snapchat.com' },
    { name: 'Website', icon: '🌐', domain: '' },
    { name: 'Email', icon: '✉️', domain: 'mailto:' },
    { name: 'Phone Call', icon: '📞', domain: 'tel:' },
    { name: 'WhatsApp', icon: '💬', domain: 'wa.me' },
    { name: 'Telegram', icon: '✈️', domain: 'telegram.me' },
    { name: 'Google Maps', icon: '📍', domain: 'google.com/maps' }
];

export function guessIconFromUrl(url) {
    const lower = url.toLowerCase().trim();
    if (lower.startsWith('tel:') || /^\+?[\d\s()-]{7,}$/.test(lower)) return '📞';
    if (lower.includes('whatsapp.com') || lower.includes('wa.me')) return '💬';
    if (lower.includes('google.com/maps') || lower.includes('maps.google.com') || lower.includes('maps.app')) return '📍';
    for (const p of SOCIAL_PLATFORMS) {
        if (p.domain && lower.includes(p.domain)) return p.icon;
    }
    return '🔗';
}
