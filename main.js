
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const canvasNext = document.getElementById('next');
const ctxNext = canvasNext.getContext('2d');
var begin;

var improved = false; // Whether or not we're showing the HCI "improvements"
ANALYTICS.currentDataRow['improve_hci_enabled'] = 0;
var interrupts = false; // Whether or not we're throwing interruptions at the user
ANALYTICS.currentDataRow['interrupts_enabled'] = 0;

// TODO: make 5 unique interruption classes and add here
const interruptions = {
  0: SlidingInterruption,
  1: TypingInterruption,
  2: LongestWordInterruption,
  3: SpatialInterruption,
  4: ArrangementInterruption,
}

// Create a shuffled array of the interruption index keys,
// this determines the random order they will be fed to user
var orderOfInterruptions = shuffleArray([0, 1, 2, 3, 4]);

var listenToKeys = true; // Disable when user is being interrupted

let accountValues = {
  score: 0,
  level: 0,
  lines: 0
};

function updateAccount(key, value) {
  let element = document.getElementById(key);
  if (element) {
    element.textContent = value;
  }
}

let account = new Proxy(accountValues, {
  set: (target, key, value) => {
    target[key] = value;
    updateAccount(key, value);
    return true;
  }
});

let requestId = null;
let time = null;

const moves = {
  [KEY.LEFT]: (p) => ({ ...p, x: p.x - 1 }),
  [KEY.RIGHT]: (p) => ({ ...p, x: p.x + 1 }),
  [KEY.DOWN]: (p) => ({ ...p, y: p.y + 1 }),
  [KEY.SPACE]: (p) => ({ ...p, y: p.y + 1 }),
  [KEY.UP]: (p) => board.rotate(p, ROTATION.RIGHT),
  [KEY.Q]: (p) => board.rotate(p, ROTATION.LEFT)
};

let board = new Board(ctx, ctxNext);

initNext();

// Function to shuffle an array, used to determine order of interruptions
// Modified from here: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array#answer-12646864
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  };
  return array;
}

function initNext() {
  // Calculate size of canvas from constants.
  ctxNext.canvas.width = 4 * BLOCK_SIZE;
  ctxNext.canvas.height = 4 * BLOCK_SIZE;
  ctxNext.scale(BLOCK_SIZE, BLOCK_SIZE);
}

function addEventListener() {
  document.removeEventListener('keydown', handleKeyPress);
  document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(event) {
  if (!listenToKeys) { return } // Don't do anything on keypress
  if (event.keyCode === KEY.P) {
    pause();
  }
  if (event.keyCode === KEY.ESC) {
    // ANALYTICS.currentDataRow['got_game_over'] = 1;
    // gameOver();
  } else if (moves[event.keyCode]) {
    event.preventDefault();
    // Get new state
    let p = moves[event.keyCode](board.piece);
    if (event.keyCode === KEY.SPACE) {
      // // We don't use the pause button, but leaving this here just in case:
      // if (document.querySelector('#pause-btn').style.display === 'block') {
      // // Hard drop
      if (document.querySelector('#play-btn').style.display === 'none') {
        // We're playing...
      } else {
        return;
      }

      while (board.valid(p)) {
        account.score += POINTS.HARD_DROP;
        board.piece.move(p);
        p = moves[KEY.DOWN](board.piece);
      }
      board.piece.hardDrop();
    } else if (board.valid(p)) {
      if (document.querySelector('#pause-btn').style.display === 'flex') {
        //
      }
      board.piece.move(p);
      if (event.keyCode === KEY.DOWN &&
        document.querySelector('#pause-btn').style.display === 'flex') {
        account.score += POINTS.SOFT_DROP;
      }
    }
  }
}

function resetGame() {
  account.score = 0;
  account.lines = 0;
  account.level = 0;
  board.reset();
  time = { start: performance.now(), elapsed: 0, level: LEVEL[account.level] };
}

function toggleProgressBar() {
  // Kick off the progress bar (it's dumb, just a 5min css transition)
  let bar = document.getElementById('progress-bar');
  if (bar.classList.contains('progress-bar-empty')) {
    bar.style.transitionDuration = '.1s';
    bar.classList.remove('progress-bar-empty');
  } else {
    bar.style.transitionDuration = '300s';
    bar.classList.add('progress-bar-empty');
  }
}

function play() {
  ANALYTICS.start();
  addEventListener();
  toast('Beginning round. Five minutes remain.')
  toggleProgressBar()
  if (document.querySelector('#play-btn').style.display == '') {
    resetGame();
  }

  // If we have an old game running then cancel it
  if (requestId) {
    cancelAnimationFrame(requestId);
  }

  animate();
  document.querySelector('#play-btn').style.display = 'none';
  document.querySelector('#pause-btn').style.display = 'flex';

  // Get start date/time for 5 minute round timer
  begin = new Date();
}

function animate(now = 0) {
  time.elapsed = now - time.start;
  if (time.elapsed > time.level) {
    time.start = now;
    if (!board.drop()) {
      gameOver();
      return;
    }
  }

  // Clear board before drawing new state.
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  board.draw();
  requestId = requestAnimationFrame(animate);
}

function gameOver() {
  ANALYTICS.end();
  toggleProgressBar()
  cancelAnimationFrame(requestId);
  /**
   * TODO: 
   * - Ask user for cognitive load number
   * - Update relevant data stores with numbers from this round
   * - Update round counter, reset game board, reset timer, etc
   */
  // checkHighScore(account.score);
  // document.querySelector('#pause-btn').style.display = 'none';
  document.querySelector('#play-btn').style.display = '';
}

function toggleImproved() {
  improved = !improved;
  ANALYTICS.currentDataRow['improve_hci_enabled'] = improved ? 1 : 0;
}

function toggleInterrupts() {
  interrupts = !interrupts;
  ANALYTICS.currentDataRow['interrupts_enabled'] = interrupts ? 1 : 0;
}

function showInterruption() {
  ANALYTICS.trackInterruption('start')
  let interruptionDiv = document.querySelector('#interruptions-container');

  // After the interruption slides on screen, focus the designated
  // element (i.e. first text box or whatever)
  interruptionDiv.addEventListener('transitionend', (event) => {
    try {
      let a = document.querySelector('.focus-this');
      a.focus();
      // Remove the focus-this class so dismissing works properly
      a.classList.remove('focus-this');
    } catch (e) {
      console.warn(e);
    }
  })

  // It's still on screen
  if (interruptionDiv.classList.contains("right-0")) { return; }

  interruptionDiv.innerHTML = ""; // Clear any previous content
  interruptionDiv.classList.add('right-0');
  listenToKeys = false;

  // Make sure we have a freshly shuffled list of interruptions if we've run out
  orderOfInterruptions = orderOfInterruptions.length == 0 ?
    shuffleArray([0, 1, 2, 3, 4]) : orderOfInterruptions;
  
  // Pick a random interruption from 0-4
  let nextInt = orderOfInterruptions.pop();
  let interruption = improved ? new interruptions[nextInt](true) : new interruptions[nextInt];
  interruptionDiv.appendChild(interruption.html.content.firstChild);
}

function hideInterruption() {
  let interruptionDiv = document.querySelector('#interruptions-container');
  interruptionDiv.classList.remove('right-0');
  listenToKeys = true;

  ANALYTICS.trackInterruption('stop');
}

function pause() {
  if (!requestId) {
    document.querySelector('#play-btn').style.display = 'none';
    // document.querySelector('#pause-btn').style.display = 'flex';
    animate();
    return;
  }

  cancelAnimationFrame(requestId);
  requestId = null;

  // TODO: show a div in index.html that says "paused"

  document.querySelector('#play-btn').style.display = 'flex';
  document.querySelector('#pause-btn').style.display = 'none';
}

function showHighScores() {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  const highScoreList = document.getElementById('highScores');

  highScoreList.innerHTML = highScores
    .map((score) => `<li>${score.score} - ${score.name}`)
    .join('');
}

function checkHighScore(score) {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  const lowestScore = highScores[NO_OF_HIGH_SCORES - 1]?.score ?? 0;

  if (score > lowestScore) {
    const name = prompt('You got a highscore! Enter name:');
    const newScore = { score, name };
    saveHighScore(newScore, highScores);
    showHighScores();
  }
}

function saveHighScore(score, highScores) {
  highScores.push(score);
  highScores.sort((a, b) => b.score - a.score);
  highScores.splice(NO_OF_HIGH_SCORES);

  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function toast(msg) {
  let toast = document.getElementById('toast-default');
  document.getElementById("toast-text").innerText = msg;

  toast.classList.remove("opacity-0");
  toast.classList.add("opacity-1");

  setTimeout(() => {
    toast.classList.remove("opacity-1");
    toast.classList.add("opacity-0");
  }, 5000);
}
