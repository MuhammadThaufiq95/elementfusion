export const CONFIG = {
    COLS: 6,
    ROWS: 9,
    CELL: 64,
    SPAWN_COL: 2,
    MAX_Z: 118,

    // Kecepatan (ms per baris)
    FALL_INTERVAL: 650,
    MIN_FALL_INTERVAL: 220,
    SPEEDUP_PER_LEVEL: 40,
    SOFT_DROP_INTERVAL: 45,
    RESOLVE_DELAY: 240,

    // Supernova: tiap kelipatan 26 (Fe, 52, 78, 104)
    SUPERNOVA_STEP: 26,
    SUPERNOVA_CLEAR_MAX_Z: 4,
    SUPERNOVA_BONUS: 500,

    SCORE: {
        FUSION: 10,       // dikali nomor atom hasil
        CHAIN_STEP: 0.5,  // tambahan pengali per chain
        SOFT_DROP: 1,
        HARD_DROP: 2,
    },

    WARNING_ROWS: 2, // peringatan kalau tumpukan tinggal sekian baris dari atas

    // Font untuk canvas (harus sama dengan CSS)
    FONTS: {
        title: '"Akira Expanded", sans-serif',
        button: '"Futuristic Armor", sans-serif',
        heading: '"Earth Orbiter", sans-serif',
        body: '"Astera", sans-serif',
        number: '"Snasm", sans-serif',
        symbol: '"Crenzo", sans-serif',
        accent: '"Futuralistic", sans-serif',
    },
    FONT_FAMILIES: [
        'Akira Expanded', 'Snasm', 'Astera', 'Futuristic Armor',
        'Earth Orbiter', 'Crenzo', 'Futuralistic',
    ],

    STORAGE: {
        BEST: 'element-fusion:best',
        DISCOVERED: 'element-fusion:discovered',
        MUTED: 'element-fusion:muted',
    },
};