// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Lanes
const lanes = [width/4 - 50, width/2 - 25, 3*width/4];

// Background
let bgY = 0;

// Game state
let gameStarted = false;
let distance = 0;
let time = 0;

// Player & Computer
const player = {lane: 1, x: lanes[1], y: height - 150, width: 50, height: 80, speed: 8, sprite: new Image(), shield: false};
player.sprite.src = 'assets/player.png';

const computer = {lane: 1, x: lanes[1], y: height - 300, width: 50, height: 80, speed: 5, sprite: new Image()};
computer.sprite.src = 'assets/computer.png';

// Obstacles & Power-ups
let obstacles = [];
let powerUps = [];
const obstacleSpeed = 6;
const obstacleFrequency = 1200;
const powerUpFrequency = 8000;

// Controls
let touchStartX = null;

// Start button
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('startScreen').style.display = 'none';
  gameStarted = true;
  spawnObstacle();
  spawnPowerUp();
  setInterval(() => { time++; updateScore(); }, 1000);
  requestAnimationFrame(gameLoop);
});

// Score
function updateScore() {
  document.getElementById('scoreBoard').innerText = `Distance: ${distance} | Time: ${time}s`;
}

// Move player
function movePlayer(dir) {
  player.lane += dir;
  if(player.lane < 0) player.lane = 0;
  if(player.lane > 2) player.lane = 2;
  player.x = lanes[player.lane];
}

// Keyboard
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') movePlayer(-1);
  if(e.key === 'ArrowRight') movePlayer(1);
});

// Swipe
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if(dx < -30) movePlayer(-1);
  else if(dx > 30) movePlayer(1);
});

// Spawn obstacles
function spawnObstacle() {
  if(!gameStarted) return;
  const lane = Math.floor(Math.random()*3);
  obstacles.push({lane, x: lanes[lane], y: -100, width:50, height:50, color:'black'});
  setTimeout(spawnObstacle, obstacleFrequency);
}

// Spawn power-ups
function spawnPowerUp() {
  if(!gameStarted) return;
  const lane = Math.floor(Math.random()*3);
  const type = Math.random() > 0.5 ? 'shield' : 'boost';
  powerUps.push({lane, x: lanes[lane], y: -100, width:40, height:40, type});
  setTimeout(spawnPowerUp, powerUpFrequency);
}

// Collision
function checkCollision(rect1, rect2) {
  return !(rect1.x + rect1.width < rect2.x ||
           rect1.x > rect2.x + rect2.width ||
           rect1.y + rect1.height < rect2.y ||
           rect1.y > rect2.y + rect2.height);
}

// Game loop
function gameLoop() {
  ctx.clearRect(0,0,width,height);

  // Background
  bgY += 4;
  if(bgY >= height) bgY = 0;
  ctx.fillStyle = "#444";
  ctx.fillRect(0,bgY-height,width,height);
  ctx.fillRect(0,bgY,width,height);

  // Player & computer
  ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);
  ctx.drawImage(computer.sprite, computer.x, computer.y, computer.width, computer.height);

  // Obstacles
  obstacles.forEach((obs, i) => {
    obs.y += obstacleSpeed;
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    if(checkCollision(player, obs)) {
      if(player.shield) player.shield = false;
      else { alert('Game Over!'); location.reload(); }
    }

    if(obs.y > computer.y && obs.y < computer.y+100 && obs.lane === computer.lane) {
      if(computer.lane > 0) computer.lane--;
      else computer.lane++;
      computer.x = lanes[computer.lane];
    }

    if(obs.y > height) obstacles.splice(i,1);
  });

  // Power-ups
  powerUps.forEach((p,i) => {
    p.y += 4;
    ctx.fillStyle = p.type==='shield'?'cyan':'yellow';
    ctx.fillRect(p.x,p.y,p.width,p.height);

    if(checkCollision(player,p)) {
      if(p.type==='shield') player.shield = true;
      if(p.type==='boost') player.y -= 100;
      powerUps.splice(i,1);
    }

    if(p.y>height) powerUps.splice(i,1);
  });

  // Move forward
  player.y -= 2;
  computer.y -= 2;
  distance += 1;

  // Finish line
  ctx.fillStyle = 'gold';
  ctx.fillRect(0,50,width,10);
  if(player.y<=50) { alert('You win!'); location.reload(); }
  if(computer.y<=50) { alert('Computer wins!'); location.reload(); }

  updateScore();
  requestAnimationFrame(gameLoop);
}

// Resize
window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});
