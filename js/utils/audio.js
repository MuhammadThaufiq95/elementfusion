import { CONFIG } from '../config.js';
import { loadJSON, saveJSON } from './storage.js';

const BASE = 'assets/sounds/';

// kunci -> nama file
const FILES = {
    move: 'sfx-move.mp3',
    land: 'sfx-land.mp3',
    harddrop: 'sfx-harddrop.mp3',
    fusion: 'sfx-fusion.mp3',
    chain: 'sfx-chain.mp3',
    discover: 'sfx-discover.mp3',
    supernova: 'sfx-supernova.mp3',
    warning: 'sfx-warning.mp3',
    gameover: 'sfx-gameover.mp3',
    click: 'sfx-click.mp3',
    record: 'sfx-record.mp3',
    'music-menu': 'music-menu.mp3',
    'music-game': 'music-game.mp3',
};

class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffers = new Map();
        this.muted = !!loadJSON(CONFIG.STORAGE.MUTED, false);
        this.music = { name: null, source: null };
        this.wantedMusic = null;
    }

    // Harus dipanggil dari gestur pengguna (klik/tombol)
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.9;
        this.musicGain.gain.value = 0.45;
        this.sfxGain.connect(this.master);
        this.musicGain.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.master.gain.value = this.muted ? 0 : 1;

        Object.entries(FILES).forEach(([key, file]) => this.load(key, BASE + file));
    }

    async load(key, url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('missing');
            const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
            this.buffers.set(key, buf);
            if (this.wantedMusic === key && this.music.name !== key) this.startMusic(key);
        } catch {
            /* file belum ada: game tetap jalan tanpa suara itu */
        }
    }

    play(name, { rate = 1, volume = 1 } = {}) {
        if (!this.ctx || this.muted) return;
        const buf = this.buffers.get(name);
        if (!buf) return;
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buf;
        src.playbackRate.value = rate;
        gain.gain.value = volume;
        src.connect(gain).connect(this.sfxGain);
        src.start();
    }

    // Pitch fusi mengikuti nomor atom: rendah untuk H, tinggi untuk unsur berat
    playFusion(z) {
        this.play('fusion', { rate: 0.7 + 1.3 * (z / CONFIG.MAX_Z) });
    }

    // Chain: naik 2 semitone per tingkat
    playChain(chain) {
        this.play('chain', { rate: Math.min(2.4, Math.pow(2, ((chain - 1) * 2) / 12)) });
    }

    playMusic(name) {
        this.wantedMusic = name ? `music-${name}` : null;
        if (!this.ctx) return;
        if (!name) { this.stopMusic(); return; }
        const key = `music-${name}`;
        if (this.music.name === key) return;
        this.stopMusic();
        if (this.buffers.has(key)) this.startMusic(key);
    }

    startMusic(key) {
        this.stopMusic();
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.get(key);
        src.loop = true;
        src.connect(this.musicGain);
        src.start();
        this.music = { name: key, source: src };
    }

    stopMusic() {
        if (this.music.source) {
            try { this.music.source.stop(); } catch { /* sudah berhenti */ }
        }
        this.music = { name: null, source: null };
    }

    toggleMute() {
        this.muted = !this.muted;
        saveJSON(CONFIG.STORAGE.MUTED, this.muted);
        if (this.master) this.master.gain.value = this.muted ? 0 : 1;
        return this.muted;
    }
}

export const audio = new AudioManager();