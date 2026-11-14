export class Board {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.reset();
    }

    reset() {
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    inBounds(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    get(r, c) {
        return this.inBounds(r, c) ? this.grid[r][c] : 0;
    }

    set(r, c, z) {
        if (this.inBounds(r, c)) this.grid[r][c] = z;
    }

    isFree(r, c) {
        return this.inBounds(r, c) && this.grid[r][c] === 0;
    }

    // Baris paling bawah yang masih kosong untuk blok yang jatuh dari fromRow
    landingRow(c, fromRow = 0) {
        let r = fromRow;
        while (this.isFree(r + 1, c)) r++;
        return r;
    }

    // Semua blok jatuh ke bawah. Return true kalau ada yang bergerak.
    applyGravity() {
        let moved = false;
        for (let c = 0; c < this.cols; c++) {
            let write = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                const v = this.grid[r][c];
                if (v) {
                    if (r !== write) {
                        this.grid[write][c] = v;
                        this.grid[r][c] = 0;
                        moved = true;
                    }
                    write--;
                }
            }
        }
        return moved;
    }

    // Hapus semua blok yang memenuhi predikat. Return daftar yang dihapus.
    removeWhere(pred) {
        const removed = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const z = this.grid[r][c];
                if (z && pred(z)) {
                    removed.push({ r, c, z });
                    this.grid[r][c] = 0;
                }
            }
        }
        return removed;
    }

    // Tinggi tumpukan tertinggi (dalam baris)
    stackHeight() {
        for (let r = 0; r < this.rows; r++) {
            if (this.grid[r].some(v => v)) return this.rows - r;
        }
        return 0;
    }
}