import { CONFIG } from '../config.js';
import { getElement, CATEGORY_COLORS } from '../data/elements.js';

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Dipakai juga oleh HUD untuk preview "berikutnya"
export function drawBlock(ctx, x, y, size, z, { alpha = 1, glow = true, outline = false } = {}) {
    const el = getElement(z);
    const col = CATEGORY_COLORS[el.category];
    const pad = size * 0.06;
    const s = size - pad * 2;
    const bx = x + pad;
    const by = y + pad;
    const rad = s * 0.16;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (outline) {
        roundRectPath(ctx, bx, by, s, s, rad);
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = col.light;
        ctx.stroke();
        ctx.restore();
        return;
    }

    if (glow) {
        ctx.shadowColor = col.base;
        ctx.shadowBlur = size * 0.22;
    }
    const g = ctx.createLinearGradient(bx, by, bx, by + s);
    g.addColorStop(0, col.light);
    g.addColorStop(1, col.base);
    roundRectPath(ctx, bx, by, s, s, rad);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.stroke();

    const dark = 'rgba(8, 12, 28, 0.88)';
    ctx.fillStyle = dark;

    // nomor atom
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `${s * 0.2}px ${CONFIG.FONTS.number}`;
    ctx.fillText(String(z), bx + s * 0.1, by + s * 0.08);

    // simbol
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symSize = el.symbol.length > 1 ? 0.4 : 0.48;
    ctx.font = `${s * symSize}px ${CONFIG.FONTS.symbol}`;
    ctx.fillText(el.symbol, bx + s / 2, by + s * 0.5, s * 0.8);

    // nama
    ctx.font = `${s * 0.13}px ${CONFIG.FONTS.accent}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(el.name.toUpperCase(), bx + s / 2, by + s * 0.9, s * 0.84);

    ctx.restore();
}

export class Renderer {
    constructor(canvas, effects) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.effects = effects;
        this.W = CONFIG.COLS * CONFIG.CELL;
        this.H = CONFIG.ROWS * CONFIG.CELL;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = this.W * this.dpr;
        canvas.height = this.H * this.dpr;
    }

    cellCenter(r, c) {
        return {
            x: c * CONFIG.CELL + CONFIG.CELL / 2,
            y: r * CONFIG.CELL + CONFIG.CELL / 2,
        };
    }

    render(game, now) {
        const { ctx, W, H, dpr } = this;
        const CELL = CONFIG.CELL;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        ctx.save();
        const sh = this.effects.getShake();
        ctx.translate(sh.x, sh.y);

        // latar
        ctx.fillStyle = '#080d1e';
        ctx.fillRect(-20, -20, W + 40, H + 40);

        // garis grid
        ctx.strokeStyle = 'rgba(120,160,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 1; c < CONFIG.COLS; c++) { ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); }
        for (let r = 1; r < CONFIG.ROWS; r++) { ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); }
        ctx.stroke();

        // sorotan kolom blok yang sedang jatuh
        const p = game.piece;
        if (p && game.state === 'playing') {
            ctx.fillStyle = 'rgba(94,224,255,0.06)';
            ctx.fillRect(p.c * CELL, 0, CELL, H);
        }

        // blok di papan
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const z = game.board.get(r, c);
                if (z) drawBlock(ctx, c * CELL, r * CELL, CELL, z);
            }
        }

        // ghost + blok jatuh
        if (p && game.state === 'playing') {
            const land = game.board.landingRow(p.c, p.r);
            if (land > p.r) drawBlock(ctx, p.c * CELL, land * CELL, CELL, p.z, { outline: true, alpha: 0.5 });
            drawBlock(ctx, p.c * CELL, p.r * CELL, CELL, p.z);
        }

        // efek bahaya
        if (game.danger && game.state !== 'gameover') {
            const a = 0.12 + 0.1 * Math.sin(now / 180);
            const g = ctx.createLinearGradient(0, 0, 0, CELL * 2);
            g.addColorStop(0, `rgba(255,77,109,${a * 2})`);
            g.addColorStop(1, 'rgba(255,77,109,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, CELL * 2);
        }

        this.effects.draw(ctx, W, H);
        ctx.restore();
    }
}