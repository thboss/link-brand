// ================================================
// DATABASE MODULE — Link CRUD via localStorage
// ================================================

const DB_KEY_PREFIX = 'lb_links_';

function getUserKey(slug) {
    return `${DB_KEY_PREFIX}${slug}`;
}

/**
 * Get all links for a brand slug (public access).
 * @param {string} slug
 * @returns {Array}
 */
export function getLinks(slug) {
    try {
        return JSON.parse(localStorage.getItem(getUserKey(slug))) || [];
    } catch {
        return [];
    }
}

/**
 * Save all links for a user (replaces entire list).
 */
function saveLinks(slug, links) {
    localStorage.setItem(getUserKey(slug), JSON.stringify(links));
}

/**
 * Add a new link.
 * @param {string} slug
 * @param {{ title: string, url: string, icon: string }} link
 */
export function addLink(slug, link) {
    const links = getLinks(slug);
    const newLink = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: link.title.trim(),
        url: ensureProtocol(link.url.trim(), link.icon),
        icon: link.icon || '🔗',
        createdAt: Date.now(),
    };
    links.push(newLink);
    saveLinks(slug, links);
    return newLink;
}

/**
 * Update an existing link by id.
 */
export function updateLink(slug, id, updates) {
    const links = getLinks(slug);
    const idx = links.findIndex(l => l.id === id);
    if (idx === -1) return false;
    links[idx] = { ...links[idx], ...updates, url: ensureProtocol((updates.url || links[idx].url).trim(), updates.icon || links[idx].icon) };
    saveLinks(slug, links);
    return links[idx];
}

/**
 * Delete a link by id.
 */
export function deleteLink(slug, id) {
    const links = getLinks(slug).filter(l => l.id !== id);
    saveLinks(slug, links);
}

/**
 * Get public brand info (brand name + slug) from stored users.
 */
export function getBrandInfo(slug) {
    try {
        const users = JSON.parse(localStorage.getItem('lb_users')) || {};
        const user = Object.values(users).find(u => u.slug === slug);
        if (!user) return null;
        return { brandName: user.brandName, slug: user.slug, email: user.email };
    } catch {
        return null;
    }
}

function ensureProtocol(url, icon = '') {
    if (!url) return url;
    const trimmed = url.trim();
    if (/^(https?|tel|mailto|sms):/i.test(trimmed)) return trimmed;
    if (icon === '📞') {
        const clean = trimmed.replace(/[\s()-]/g, '');
        if (/^\+?\d+$/.test(clean)) return 'tel:' + clean;
    }
    if (icon === '✉️') {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'mailto:' + trimmed;
    }
    return 'https://' + trimmed;
}
