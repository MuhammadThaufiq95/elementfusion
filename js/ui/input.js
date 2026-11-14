import { CONFIG } from '../config.js';

export class Input {
    constructor(canvas, actions) {
        this.canvas = canvas;
        this.a = actions;

        window.addEventListener('keydown', e => this.onKey(e, true));
        window.addEventListener('keyup', e => this.onKey(e, false));

        this.touch = null;
        canvas.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', e => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', e => this.onTouchEnd(e), { passive: false });
    }

    onKey(e, down) {
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A':
                if (down) this.a.left();
                break;
            case 'ArrowRight': case 'd': case 'D':
                if (down) this.a.right();
                break;
            case 'ArrowDown': case 's': case 'S':
                this.a.soft(down);
                break;
            case ' ':
                if (down && !e.repeat) this.a.hardDrop();
                break;
            case 'p': case 'P': case 'Escape':
                if (down && !e.repeat) this.a.pause();
                break;
            default:
                return;
        }
        e.preventDefault();
    }

    // ---------- Sentuh ----------
    cellWidthPx() {
        return this.canvas.getBoundingClientRect().width / CONFIG.COLS;
    }

    onTouchStart(e) {
        e.preventDefault();
        const t = e.changedTouches[0];
        this.touch = { x: t.clientX, y: t.clientY, steps: 0 };
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.touch) return;
        const t = e.changedTouches[0];
        const cw = this.cellWidthPx();
        const target = Math.trunc((t.clientX - this.touch.x) / cw);
        while (this.touch.steps < target) { this.a.right(); this.touch.steps++; }
        while (this.touch.steps > target) { this.a.left(); this.touch.steps--; }
    }

    onTouchEnd(e) {
        e.preventDefault();
        if (!this.touch) return;
        const t = e.changedTouches[0];
        const cw = this.cellWidthPx();
        const dy = t.clientY - this.touch.y;
        const dx = t.clientX - this.touch.x;
        if (dy > cw * 1.2 && Math.abs(dx) < cw) this.a.hardDrop();
        this.touch = null;
    }
}