// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    if (screenId === 'snakeScreen') {
        resetSnakeGame();
    } else if (screenId === 'timerScreen') {
        resetTimer();
    } else if (screenId === 'calculatorScreen') {
        clearCalc();
    } else if (screenId === 'rpsScreen') {
        resetRPS();
    }
}

// Password Generator
function generatePassword() {
    const length = parseInt(document.getElementById('lengthInput').value);
    const includeUpper = document.getElementById('upperCheck').checked;
    const includeLower = document.getElementById('lowerCheck').checked;
    const includeNumbers = document.getElementById('numberCheck').checked;
    const includeSymbols = document.getElementById('symbolCheck').checked;

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';
    let chars = '';
    if (includeUpper) chars += upper;
    if (includeLower) chars += lower;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (!chars) {
        alert('Please select at least one character type.');
        return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        const randIndex = Math.floor(Math.random() * chars.length);
        password += chars[randIndex];
    }
    document.getElementById('passwordOutput').value = password;
}

function copyPassword() {
    const password = document.getElementById('passwordOutput').value;
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
}

// Snake Game
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;

function resetSnakeGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    document.getElementById('snakeScore').textContent = score;
    clearInterval(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function startSnakeGame() {
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        snake.forEach(segment => {
            ctx.fillStyle = 'green';
            ctx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
        });
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x * 20, food.y * 20, 18, 18);

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            document.getElementById('snakeScore').textContent = score;
            food = {
                x: Math.floor(Math.random() * 20),
                y: Math.floor(Math.random() * 20)
            };
        } else {
            snake.pop();
        }

        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
            alert('Game Over! Score: ' + score);
            resetSnakeGame();
        }
    }, 100);

    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case 'ArrowDown':
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case 'ArrowLeft':
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case 'ArrowRight':
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
        }
    });
}

// Timer
let timerInterval;
let timeLeft;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timerDisplay').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!timerInterval) {
        timeLeft = parseInt(document.getElementById('timerInput').value);
        if (timeLeft <= 0) {
            alert('Please enter a valid time.');
            return;
        }
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                alert('Time’s up!');
                return;
            }
            timeLeft--;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = parseInt(document.getElementById('timerInput').value);
    updateTimerDisplay();
}

// Calculator
let calcExpression = '';

function appendCalc(value) {
    calcExpression += value;
    document.getElementById('calcDisplay').value = calcExpression;
}

function clearCalc() {
    calcExpression = '';
    document.getElementById('calcDisplay').value = '0';
}

function calculate() {
    try {
        calcExpression = eval(calcExpression).toString();
        document.getElementById('calcDisplay').value = calcExpression;
    } catch {
        document.getElementById('calcDisplay').value = 'Error';
        calcExpression = '';
    }
}

// Rock Paper Scissors
let playerScore = 0;
let aiScore = 0;

function resetRPS() {
    playerScore = 0;
    aiScore = 0;
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('aiScore').textContent = aiScore;
    document.getElementById('playerChoice').textContent = '-';
    document.getElementById('aiChoice').textContent = '-';
    document.getElementById('rpsResult').textContent = '-';
}

function playRPS(playerChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const aiChoice = choices[Math.floor(Math.random() * 3)];
    document.getElementById('playerChoice').textContent = playerChoice;
    document.getElementById('aiChoice').textContent = aiChoice;

    if (playerChoice === aiChoice) {
        document.getElementById('rpsResult').textContent = 'It’s a tie!';
    } else if (
        (playerChoice === 'rock' && aiChoice === 'scissors') ||
        (playerChoice === 'paper' && aiChoice === 'rock') ||
        (playerChoice === 'scissors' && aiChoice === 'paper')
    ) {
        playerScore++;
        document.getElementById('rpsResult').textContent = 'You win!';
    } else {
        aiScore++;
        document.getElementById('rpsResult').textContent = 'AI wins!';
    }
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('aiScore').textContent = aiScore;
}
