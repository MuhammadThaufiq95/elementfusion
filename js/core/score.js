import { CONFIG } from '../config.js';
import { loadNumber, saveNumber } from '../utils/storage.js';

export class Score {
    constructor() {
        this.best = loadNumber(CONFIG.STORAGE.BEST, 0);
        this.prevBest = this.best;
        this.value = 0;
    }

    reset() {
        this.value = 0;
        this.prevBest = this.best;
    }

    add(n) {
        this.value += Math.round(n);
        if (this.value > this.best) this.best = this.value;
    }

    fusionPoints(z, chain) {
        return z * CONFIG.SCORE.FUSION * (1 + (chain - 1) * CONFIG.SCORE.CHAIN_STEP);
    }

    get isRecord() {
        return this.value > this.prevBest;
    }

    commit() {
        saveNumber(CONFIG.STORAGE.BEST, this.best);
    }
}