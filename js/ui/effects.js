import { CONFIG } from '../config.js';

export class Effects {
    constructor() {
        this.particles = [];
        this.popups = [];
        this.rings = [];
        this.shakeT = 0;
        this.shakeDur = 1;
        this.shakeMag = 0;
        this.flashT = 0;
        this.flashDur = 1;
        this.flashColor = '#ffffff';
    }

    burst(x, y, color, count = 14, speed = 140) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = speed * (0.4 + Math.random() * 0.8);
            this.particles.push({
                x, y,
                vx: Math.cos(a) * v,
                vy: Math.sin(a) * v - 40,
                life: 0.5 + Math.random() * 0.4,
                max: 0.9,
                size: 2 + Math.random() * 3,
                color,
            });
        }
    }

    ring(x, y, color, maxR = 90, speed = 260) {
        this.rings.push({ x, y, r: 6, maxR, speed, color });
    }

    popup(text, x, y, color = '#ffffff', size = 18) {
        this.popups.push({ text, x, y, color, size, life: 1, max: 1 });
    }

    shake(mag = 6, dur = 0.3) {
        this.shakeMag = mag;
        this.shakeT = dur;
        this.shakeDur = dur;
    }

    flash(color = '#ffffff', dur = 0.35) {
        this.flashColor = color;
        this.flashT = dur;
        this.flashDur = dur;
    }

    supernova(W, H) {
        this.flash('#fff6d6', 0.7);
        this.shake(14, 0.7);
        this.ring(W / 2, H / 2, '#ffd166', Math.max(W, H), 700);
        this.ring(W / 2, H / 2, '#ffffff', Math.max(W, H) * 0.7, 500);
        for (let i = 0; i < 60; i++) this.burst(W / 2, H / 2, i % 2 ? '#ffd166' : '#ff9f43', 1, 420);
    }

    update(dt) {
        const s = dt / 1000;

        this.particles = this.particles.filter(p => {
            p.life -= s;
            if (p.life <= 0) return false;
            p.x += p.vx * s;
            p.y += p.vy * s;
            p.vy += 200 * s;
            return true;
        });

        this.popups = this.popups.filter(p => {
            p.life -= s;
            p.y -= 38 * s;
            return p.life > 0;
        });

        this.rings = this.rings.filter(r => {
            r.r += r.speed * s;
            return r.r < r.maxR;
        });

        if (this.shakeT > 0) this.shakeT -= s;
        if (this.flashT > 0) this.flashT -= s;
    }

    getShake() {
        if (this.shakeT <= 0) return { x: 0, y: 0 };
        const m = this.shakeMag * (this.shakeT / this.shakeDur);
        return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m };
    }

    draw(ctx, W, H) {
        // cincin
        for (const r of this.rings) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - r.r / r.maxR);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // partikel
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.max);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // teks melayang
        for (const p of this.popups) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.life / 0.5);
            ctx.font = `${p.size}px ${CONFIG.FONTS.accent}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }

        // kilatan layar
        if (this.flashT > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.flashT / this.flashDur);
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(-20, -20, W + 40, H + 40);
            ctx.restore();
        }
    }
}