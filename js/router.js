// ================================================
// ROUTER — Simple hash-based SPA Router
// ================================================

const routes = [];
let notFoundHandler = null;

export function route(path, handler) {
    routes.push({ path, handler });
}

export function onNotFound(handler) {
    notFoundHandler = handler;
}

export function navigate(path) {
    window.location.hash = path;
}

export function getHash() {
    return window.location.hash.slice(1) || '/';
}

function matchRoute(hash) {
    for (const r of routes) {
        if (typeof r.path === 'string') {
            if (r.path === hash) return { handler: r.handler, params: {} };
        } else if (r.path instanceof RegExp) {
            const m = hash.match(r.path);
            if (m) return { handler: r.handler, params: m };
        }
    }
    return null;
}

export function startRouter() {
    function resolve() {
        const hash = getHash();
        const match = matchRoute(hash);
        if (match) {
            match.handler(match.params);
        } else if (notFoundHandler) {
            notFoundHandler(hash);
        }
    }
    window.addEventListener('hashchange', resolve);
    resolve(); // initial load
}
