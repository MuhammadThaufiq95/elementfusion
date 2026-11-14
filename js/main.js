import { CONFIG } from './config.js';
import { getElement, CATEGORY_COLORS } from './data/elements.js';
import { Game } from './core/game.js';
import { Renderer } from './ui/renderer.js';
import { Effects } from './ui/effects.js';
import { Input } from './ui/input.js';
import { Hud } from './ui/hud.js';
import { audio } from './utils/audio.js';

const canvas = document.getElementById('board');
const effects = new Effects();
const renderer = new Renderer(canvas, effects);
const hud = new Hud();

const colorOf = z => CATEGORY_COLORS[getElement(z).category].base;

// ---------- Game + hooks ke UI/audio ----------
const game = new Game({
    onMove: () => audio.play('move', { volume: 0.6 }),

    onLand: p => {
        audio.play('land');
        const { x, y } = renderer.cellCenter(p.r, p.c);
        effects.burst(x, y + 20, '#9fb4ff', 6, 70);
    },

    onHardDrop: p => {
        audio.play('harddrop');
        effects.shake(4, 0.15);
    },

    onFusion: f => {
        const { x, y } = renderer.cellCenter(f.target.r, f.target.c);
        const color = colorOf(f.result);
        effects.burst(x, y, color, 16, 160);
        effects.ring(x, y, color, 70, 240);
        effects.popup(`+${f.points}`, x, y - 22, '#ffffff', 16);
        audio.playFusion(f.result);
        if (f.chain >= 2) {
            effects.popup(`CHAIN x${f.chain}`, x, y + 18, '#ffd166', 15);
            audio.playChain(f.chain);
        }
    },

    onChain: n => hud.setChain(n),

    onDiscover: (z, announce) => {
        if (!announce) return;
        const el = getElement(z);
        hud.toast('UNSUR BARU!', `${el.symbol} · ${el.name} (${z})`);
        audio.play('discover');
    },

    onSupernova: ({ level, removed, bonus }) => {
        effects.supernova(renderer.W, renderer.H);
        removed.forEach(b => {
            const { x, y } = renderer.cellCenter(b.r, b.c);
            effects.burst(x, y, colorOf(b.z), 10, 220);
        });
        hud.toast('SUPERNOVA!', `H & He musnah · +${bonus} poin`, true);
        audio.play('supernova');
    },

    onWarning: () => audio.play('warning'),

    onNext: z => hud.setNext(z),
    onStats: s => hud.setStats(s),

    onPause: paused => hud.showScreen(paused ? 'pause' : null),

    onGameOver: info => {
        audio.playMusic(null);
        audio.play('gameover');
        if (info.record) setTimeout(() => audio.play('record'), 900);
        hud.showGameOver(info);
    },
});

// ---------- Kontrol ----------
new Input(canvas, {
    left: () => game.move(-1),
    right: () => game.move(1),
    hardDrop: () => game.hardDrop(),
    soft: v => game.setSoftDrop(v),
    pause: () => game.togglePause(),
});

// ---------- Tombol ----------
function startGame() {
    audio.init();
    audio.play('click');
    hud.hideScreens();
    hud.setChain(0);
    game.start();
    audio.playMusic('game');
}

function bindButton(id, handler) {
    const btn = document.getElementById(id);
    btn.addEventListener('click', e => {
        handler();
        e.currentTarget.blur();
    });
}

bindButton('btn-start', startGame);
bindButton('btn-restart', startGame);
bindButton('btn-resume', () => { audio.play('click'); game.togglePause(); });

const muteBtn = document.getElementById('btn-mute');
const refreshMute = () => { muteBtn.textContent = `SUARA: ${audio.muted ? 'OFF' : 'ON'}`; };
bindButton('btn-mute', () => { audio.init(); audio.toggleMute(); refreshMute(); });
refreshMute();

// Browser memblokir audio sebelum ada interaksi: nyalakan musik menu di interaksi pertama
function unlockAudio() {
    audio.init();
    if (game.state === 'menu') audio.playMusic('menu');
}
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

// ---------- Loop ----------
let last = performance.now();
function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    game.update(dt);
    effects.update(dt);
    renderer.render(game, now);
    requestAnimationFrame(frame);
}

async function boot() {
    // tunggu font siap supaya canvas tidak memakai font cadangan (maks 2,5 detik)
    const fonts = Promise.all(CONFIG.FONT_FAMILIES.map(f => document.fonts.load(`20px "${f}"`).catch(() => null)));
    await Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]);
    game.emitStats();
    hud.setNext(1);
    requestAnimationFrame(frame);
}

boot();