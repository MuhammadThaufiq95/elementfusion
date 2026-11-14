export function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage penuh / diblokir: abaikan */
    }
}

export const loadNumber = (key, fallback = 0) => Number(loadJSON(key, fallback)) || fallback;
export const saveNumber = (key, value) => saveJSON(key, value);