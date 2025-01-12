class Board {
  constructor(ctx, ctxNext) {
    this.ctx = ctx;
    this.ctxNext = ctxNext;
    this.tickCount = 0;
    this.interruptReady = false;
    this.init();
  }

  init() {
    // Calculate size of canvas from constants.
    this.ctx.canvas.width = COLS * BLOCK_SIZE;
    this.ctx.canvas.height = ROWS * BLOCK_SIZE;

    // Scale so we don't need to give size on every draw.
    this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
  }

  reset() {
    this.grid = this.getEmptyGrid();
    this.piece = new Piece(this.ctx);
    this.piece.setStartingPosition();
    this.getNewPiece();
  }

  getNewPiece() {
    const { width, height } = this.ctxNext.canvas;
    this.next = new Piece(this.ctxNext);
    this.ctxNext.clearRect(0, 0, width, height);
    this.next.draw();
  }

  draw() {
    this.piece.draw();
    this.drawBoard();
  }

  drop() {
    // This function is called every game tick, so using it to 
    // keep track of how many ticks have elapsed/when to trigger
    // interruptions.
    this.tickCount++;

    // If we're just doing the baseline block game, set round to be 2 min.
    // Otherwise, make it 5 minutes.
    let round_time_limit_in_minutes = !improved && !interrupts ? 2: 5;

    // If it's been about 5 minutes, stop the game
    if (Math.floor(((new Date() - begin)/1000)/60) >= round_time_limit_in_minutes) {
      toast("Time limit reached.");
      ANALYTICS.currentDataRow['got_game_over'] = 0;
      return false;
    }
    
    // Every 35 ticks, flag that we're ready for interruption
    this.interruptReady = (this.tickCount % 35 == 0 && interrupts) ? true: false;

    let p = moves[KEY.DOWN](this.piece);
    if (this.valid(p)) {
      this.piece.move(p);
    } else {
      this.freeze();
      this.clearLines();
      if (this.piece.y === 0) {
        toast("Round over.");
        // Game over
        ANALYTICS.currentDataRow['got_game_over'] = 1;
        return false;
      }
      this.piece = this.next;
      this.piece.ctx = this.ctx;
      this.piece.setStartingPosition();
      this.getNewPiece();
    }
    this.interruptReady ? showInterruption(): false;
    return true;
  }

  clearLines() {
    let lines = 0;

    this.grid.forEach((row, y) => {
      // If every value is greater than zero then we have a full row.
      if (row.every((value) => value > 0)) {
        lines++;

        // Remove the row.
        this.grid.splice(y, 1);

        // Add zero filled row at the top.
        this.grid.unshift(Array(COLS).fill(0));
      }
    });

    if (lines > 0) {
      // Calculate points from cleared lines and level.

      account.score += this.getLinesClearedPoints(lines);
      account.lines += lines;
      ANALYTICS.currentDataRow["lines_cleared"]++;

      // If we have reached the lines for next level
      if (account.lines >= LINES_PER_LEVEL) {
        // Goto next level
        account.level++;

        // Remove lines so we start working for the next level
        account.lines -= LINES_PER_LEVEL;

        // Increase speed of game
        time.level = LEVEL[account.level];
      }
    }
  }

  valid(p) {
    return p.shape.every((row, dy) => {
      return row.every((value, dx) => {
        let x = p.x + dx;
        let y = p.y + dy;
        return value === 0 || (this.isInsideWalls(x, y) && this.notOccupied(x, y));
      });
    });
  }

  freeze() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.grid[y + this.piece.y][x + this.piece.x] = value;
        }
      });
    });
  }

  drawBoard() {
    this.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.ctx.fillStyle = COLORS[value];
          this.ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  }

  getEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  isInsideWalls(x, y) {
    return x >= 0 && x < COLS && y <= ROWS;
  }

  notOccupied(x, y) {
    return this.grid[y] && this.grid[y][x] === 0;
  }

  rotate(piece, direction) {
    // Clone with JSON for immutability.
    let p = JSON.parse(JSON.stringify(piece));
    if (!piece.hardDropped) {
      // Transpose matrix
      for (let y = 0; y < p.shape.length; ++y) {
        for (let x = 0; x < y; ++x) {
          [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
        }
      }
      // Reverse the order of the columns.
      if (direction === ROTATION.RIGHT) {
        p.shape.forEach((row) => row.reverse());
      } else if (direction === ROTATION.LEFT) {
        p.shape.reverse();
      }
    }

    return p;
  }

  getLinesClearedPoints(lines, level) {
    const lineClearPoints =
      lines === 1
        ? POINTS.SINGLE
        : lines === 2
        ? POINTS.DOUBLE
        : lines === 3
        ? POINTS.TRIPLE
        : lines === 4
        ? POINTS.BETRIS
        : 0;
    return (account.level + 1) * lineClearPoints;
  }
}
