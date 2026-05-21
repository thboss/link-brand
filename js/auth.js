// ================================================
// AUTH MODULE — Mock Authentication via localStorage
// ================================================

const USERS_KEY = 'lb_users';

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

export function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem('lb_current_user')) || null; } catch { return null; }
}

function setCurrentUser(user) {
    if (user) sessionStorage.setItem('lb_current_user', JSON.stringify(user));
    else sessionStorage.removeItem('lb_current_user');
}

/**
 * Registers a new user.
 * @param {string} email
 * @param {string} password
 * @param {string} brandName
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export function signup(email, password, brandName) {
    const users = getUsers();
    let slug = slugify(brandName);

    if (!email || !password || !brandName) return { success: false, error: 'All fields are required.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    if (users[email]) return { success: false, error: 'An account with this email already exists.' };
    
    // Auto-resolve slug collision
    while (Object.values(users).some(u => u.slug === slug)) {
        slug += '-' + Math.floor(Math.random() * 10000);
    }

    const user = { email, password, brandName, slug, createdAt: Date.now() };
    users[email] = user;
    saveUsers(users);
    const safeUser = { email, brandName, slug };
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
}

/**
 * Logs in a user.
 */
export function login(email, password) {
    const users = getUsers();
    if (!email || !password) return { success: false, error: 'Email and password are required.' };
    const user = users[email];
    if (!user) return { success: false, error: 'No account found with this email.' };
    if (user.password !== password) return { success: false, error: 'Incorrect password.' };
    const safeUser = { email: user.email, brandName: user.brandName, slug: user.slug };
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
}

export function logout() { setCurrentUser(null); }

/**
 * Updates the current user's profile (brandName).
 */
export function updateProfile(updates) {
    const current = getCurrentUser();
    if (!current) return { success: false, error: 'Not authenticated.' };
    const users = getUsers();
    const stored = users[current.email];
    if (!stored) return { success: false, error: 'User not found.' };

    if (updates.brandName) {
        const newSlug = slugify(updates.brandName);
        // Check slug collision
        const slugTaken = Object.values(users).some(u => u.email !== current.email && u.slug === newSlug);
        if (slugTaken) return { success: false, error: 'This brand name is already taken.' };
        stored.brandName = updates.brandName;
        stored.slug = newSlug;
    }
    users[current.email] = stored;
    saveUsers(users);
    const safeUser = { email: stored.email, brandName: stored.brandName, slug: stored.slug };
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
}

// Utility — convert brand name to URL slug
export function slugify(text) {
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
