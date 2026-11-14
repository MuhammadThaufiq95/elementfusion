import { drawBlock } from './renderer.js';
import { getElement, TOTAL_ELEMENTS } from '../data/elements.js';

const $ = id => document.getElementById(id);

export class Hud {
    constructor() {
        this.el = {
            score: $('hud-score'),
            best: $('hud-best'),
            level: $('hud-level'),
            chain: $('hud-chain'),
            highest: $('hud-highest'),
            discText: $('hud-disc-text'),
            discBar: $('hud-disc-bar'),
            toast: $('toast'),
            toastTitle: $('toast-title'),
            toastSub: $('toast-sub'),
            goScore: $('go-score'),
            goBest: $('go-best'),
            goHighest: $('go-highest'),
            goRecord: $('go-record'),
        };
        this.nextCanvas = $('hud-next');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.toastTimer = null;
    }

    setStats(s) {
        const hi = getElement(s.highestZ);
        this.el.score.textContent = s.score.toLocaleString('id-ID');
        this.el.best.textContent = s.best.toLocaleString('id-ID');
        this.el.level.textContent = s.level;
        this.el.highest.textContent = `${hi.symbol} · ${hi.name}`;
        this.el.discText.textContent = `${s.discovered}/${TOTAL_ELEMENTS}`;
        this.el.discBar.style.width = `${(s.discovered / TOTAL_ELEMENTS) * 100}%`;
    }

    setChain(n) {
        this.el.chain.textContent = n;
    }

    setNext(z) {
        const ctx = this.nextCtx;
        ctx.clearRect(0, 0, 96, 96);
        drawBlock(ctx, 0, 0, 96, z);
    }

    toast(title, sub = '', nova = false) {
        this.el.toastTitle.textContent = title;
        this.el.toastSub.textContent = sub;
        this.el.toast.classList.toggle('nova', nova);
        this.el.toast.classList.add('show');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.el.toast.classList.remove('show'), 2200);
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (name) $(`screen-${name}`).classList.add('active');
    }

    hideScreens() {
        this.showScreen(null);
    }

    showGameOver({ score, best, record, highestZ }) {
        const hi = getElement(highestZ);
        this.el.goScore.textContent = score.toLocaleString('id-ID');
        this.el.goBest.textContent = best.toLocaleString('id-ID');
        this.el.goHighest.textContent = hi.symbol;
        this.el.goRecord.classList.toggle('show', !!record);
        this.showScreen('gameover');
    }
}