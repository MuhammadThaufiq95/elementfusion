import { CONFIG } from '../config.js';
import { Board } from './board.js';
import { findFusions, pickSpawn, supernovaLevel } from './fusion.js';
import { Score } from './score.js';
import { loadJSON, saveJSON } from '../utils/storage.js';

export class Game {
    constructor(hooks = {}) {
        this.hooks = hooks;
        this.board = new Board(CONFIG.ROWS, CONFIG.COLS);
        this.score = new Score();
        this.discovered = new Set(loadJSON(CONFIG.STORAGE.DISCOVERED, []));
        this.state = 'menu'; // menu | playing | resolving | paused | gameover
        this.prevState = 'playing';
        this.piece = null;
        this.nextZ = 1;
        this.highestZ = 1;
        this.chain = 0;
        this.milestone = 0;
        this.danger = false;
        this.softDrop = false;
        this.fallTimer = 0;
        this.resolveTimer = 0;
    }

    emit(name, ...args) {
        if (this.hooks[name]) this.hooks[name](...args);
    }

    get level() {
        return 1 + Math.floor(this.highestZ / 8);
    }

    get fallInterval() {
        return Math.max(CONFIG.MIN_FALL_INTERVAL, CONFIG.FALL_INTERVAL - (this.level - 1) * CONFIG.SPEEDUP_PER_LEVEL);
    }

    // ---------- Siklus game ----------
    start() {
        this.board.reset();
        this.score.reset();
        this.highestZ = 1;
        this.chain = 0;
        this.milestone = 0;
        this.danger = false;
        this.softDrop = false;
        this.fallTimer = 0;
        this.resolveTimer = 0;
        this.piece = null;
        this.nextZ = pickSpawn(1);
        this.discover(1, false);
        this.discover(2, false);
        this.spawn();
        this.emitStats();
    }

    spawn() {
        const c = CONFIG.SPAWN_COL;
        if (!this.board.isFree(0, c)) {
            this.gameOver();
            return;
        }
        const z = this.nextZ;
        this.piece = { z, c, r: 0 };
        this.discover(z, true);
        this.nextZ = pickSpawn(this.highestZ);
        this.state = 'playing';
        this.fallTimer = 0;
        this.emit('onNext', this.nextZ);
        this.emitStats();
    }

    update(dt) {
        if (this.state === 'playing' && this.piece) {
            const interval = this.softDrop ? CONFIG.SOFT_DROP_INTERVAL : this.fallInterval;
            this.fallTimer += dt;
            while (this.fallTimer >= interval && this.piece) {
                this.fallTimer -= interval;
                this.stepDown();
            }
        } else if (this.state === 'resolving') {
            this.resolveTimer += dt;
            if (this.resolveTimer >= CONFIG.RESOLVE_DELAY) {
                this.resolveTimer = 0;
                this.resolveStep();
            }
        }
    }

    stepDown() {
        const p = this.piece;
        if (this.board.isFree(p.r + 1, p.c)) {
            p.r++;
            if (this.softDrop) {
                this.score.add(CONFIG.SCORE.SOFT_DROP);
                this.emitStats();
            }
        } else {
            this.lock();
        }
    }

    lock() {
        const p = this.piece;
        this.board.set(p.r, p.c, p.z);
        this.piece = null;
        this.chain = 0;
        this.state = 'resolving';
        this.resolveTimer = CONFIG.RESOLVE_DELAY * 0.4;
        this.emit('onLand', p);
        this.updateDanger();
    }

    resolveStep() {
        if (this.board.applyGravity()) {
            this.emit('onSettle');
            return;
        }

        const fusions = findFusions(this.board);
        if (fusions.length === 0) {
            this.finishResolve();
            return;
        }

        this.chain++;
        let novaLevel = 0;

        for (const f of fusions) {
            this.board.set(f.a.r, f.a.c, 0);
            this.board.set(f.b.r, f.b.c, 0);
            this.board.set(f.target.r, f.target.c, f.result);

            const points = this.score.fusionPoints(f.result, this.chain);
            this.score.add(points);
            if (f.result > this.highestZ) this.highestZ = f.result;
            this.discover(f.result, true);

            const lvl = supernovaLevel(f.result);
            if (lvl > this.milestone) {
                this.milestone = lvl;
                novaLevel = lvl;
            }
            this.emit('onFusion', { ...f, chain: this.chain, points });
        }

        this.emit('onChain', this.chain);
        if (novaLevel) this.supernova(novaLevel);
        this.emitStats();
    }

    supernova(level) {
        const removed = this.board.removeWhere(z => z <= CONFIG.SUPERNOVA_CLEAR_MAX_Z);
        const bonus = CONFIG.SUPERNOVA_BONUS * level;
        this.score.add(bonus);
        this.emit('onSupernova', { level, removed, bonus });
    }

    finishResolve() {
        this.updateDanger();
        if (this.chain >= 2) this.emit('onChainEnd', this.chain);
        this.chain = 0;
        this.emit('onChain', 0);
        this.spawn();
    }

    updateDanger() {
        const was = this.danger;
        this.danger = this.board.stackHeight() >= CONFIG.ROWS - CONFIG.WARNING_ROWS;
        if (this.danger && !was) this.emit('onWarning');
    }

    discover(z, announce) {
        if (this.discovered.has(z)) return;
        this.discovered.add(z);
        saveJSON(CONFIG.STORAGE.DISCOVERED, [...this.discovered]);
        this.emit('onDiscover', z, announce);
    }

    gameOver() {
        this.state = 'gameover';
        this.piece = null;
        this.softDrop = false;
        this.score.commit();
        this.emitStats();
        this.emit('onGameOver', {
            score: this.score.value,
            best: this.score.best,
            record: this.score.isRecord,
            highestZ: this.highestZ,
        });
    }

    emitStats() {
        this.emit('onStats', {
            score: this.score.value,
            best: this.score.best,
            highestZ: this.highestZ,
            level: this.level,
            discovered: this.discovered.size,
        });
    }

    // ---------- Kontrol ----------
    move(dir) {
        if (this.state !== 'playing' || !this.piece) return;
        const nc = this.piece.c + dir;
        if (this.board.isFree(this.piece.r, nc)) {
            this.piece.c = nc;
            this.emit('onMove');
        }
    }

    hardDrop() {
        if (this.state !== 'playing' || !this.piece) return;
        const p = this.piece;
        const target = this.board.landingRow(p.c, p.r);
        const dist = target - p.r;
        p.r = target;
        this.score.add(dist * CONFIG.SCORE.HARD_DROP);
        this.emit('onHardDrop', p);
        this.lock();
        this.emitStats();
    }

    setSoftDrop(v) {
        this.softDrop = !!v;
    }

    togglePause() {
        if (this.state === 'playing' || this.state === 'resolving') {
            this.prevState = this.state;
            this.state = 'paused';
            this.emit('onPause', true);
        } else if (this.state === 'paused') {
            this.state = this.prevState;
            this.emit('onPause', false);
        }
    }
}