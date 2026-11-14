import { CONFIG } from '../config.js';

// ====== ATURAN FUSI (ubah di sini untuk balancing) ======
export function canFuse(a, b) {
    if (!a || !b) return false;
    if (Math.abs(a - b) > 1) return false;       // hanya unsur yang "dekat"
    return a + b <= CONFIG.MAX_Z;                 // tidak melewati Oganeson
}

export function fuse(a, b) {
    return a + b; // fusi nuklir: nomor atom dijumlahkan
}

// Level supernova: 0 sebelum Fe, 1 untuk 26-51, 2 untuk 52-77, dst.
export function supernovaLevel(z) {
    return Math.floor(z / CONFIG.SUPERNOVA_STEP);
}

// Unsur apa yang muncul berikutnya (makin tinggi progres, makin banyak variasi)
export function pickSpawn(highestZ, rng = Math.random) {
    const maxSpawn = Math.min(4, 2 + Math.floor(highestZ / 10));
    const candidates = [];
    const weights = [];
    for (let z = 1; z <= maxSpawn; z++) {
        candidates.push(z);
        weights.push(Math.pow(0.62, z - 1));
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * total;
    for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return candidates[i];
    }
    return 1;
}

// Cari semua pasangan yang berfusi pada satu langkah (tidak saling tumpang tindih)
export function findFusions(board) {
    const used = new Set();
    const key = (r, c) => r * 100 + c;
    const out = [];

    for (let r = board.rows - 1; r >= 0; r--) {
        for (let c = 0; c < board.cols; c++) {
            const a = board.get(r, c);
            if (!a || used.has(key(r, c))) continue;

            let best = null;
            const neighbors = [[r, c + 1], [r - 1, c], [r, c - 1], [r + 1, c]];
            for (const [nr, nc] of neighbors) {
                if (!board.inBounds(nr, nc) || used.has(key(nr, nc))) continue;
                const b = board.get(nr, nc);
                if (!canFuse(a, b)) continue;
                const diff = Math.abs(a - b);
                if (!best || diff < best.diff) best = { r: nr, c: nc, b, diff };
            }

            if (best) {
                used.add(key(r, c));
                used.add(key(best.r, best.c));
                // hasil diletakkan di sel yang lebih rendah
                const target = best.r > r ? { r: best.r, c: best.c } : { r, c };
                out.push({
                    a: { r, c },
                    b: { r: best.r, c: best.c },
                    target,
                    from: [a, best.b],
                    result: fuse(a, best.b),
                });
            }
        }
    }
    return out;
}