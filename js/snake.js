const SnakeGame = (() => {
    const canvas = document.getElementById('game-canvas');
    const ctx    = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const gameOverScreen = document.getElementById('game-over-screen');

    const gridSize  = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [];
    let food  = { x: 0, y: 0 };
    let dx    = gridSize;
    let dy    = 0;
    let score = 0;
    let gameLoopInterval = null;
    let isGameRunning    = false;
    let speed = 170;

    function init() {
        snake = [
            { x: gridSize * 5, y: gridSize * 5 },
            { x: gridSize * 4, y: gridSize * 5 },
            { x: gridSize * 3, y: gridSize * 5 }
        ];
        dx    = gridSize;
        dy    = 0;
        score = 0;
        scoreDisplay.textContent = '0';
        spawnFood();
    }

    function spawnFood() {
        do {
            food.x = Math.floor(Math.random() * tileCount) * gridSize;
            food.y = Math.floor(Math.random() * tileCount) * gridSize;
        } while (snake.some(p => p.x === food.x && p.y === food.y));
    }

    function changeDirection(direction) {
        if (!isGameRunning) return;
        if (direction === 'UP'    && dy === 0) { dx =  0;        dy = -gridSize; }
        if (direction === 'DOWN'  && dy === 0) { dx =  0;        dy =  gridSize; }
        if (direction === 'LEFT'  && dx === 0) { dx = -gridSize; dy =  0; }
        if (direction === 'RIGHT' && dx === 0) { dx =  gridSize; dy =  0; }
    }

    function update() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        if (
            head.x < 0 || head.x >= canvas.width  ||
            head.y < 0 || head.y >= canvas.height  ||
            snake.some(p => p.x === head.x && p.y === head.y)
        ) {
            gameOver();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 1;
            scoreDisplay.textContent = score;
            spawnFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF5252';
        ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);

        snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? '#81C784' : '#4CAF50';
            ctx.fillRect(part.x, part.y, gridSize - 2, gridSize - 2);
        });
    }

    function preview() {
        init();
        draw();
    }

    function start() {
        if (isGameRunning) return;
        isGameRunning = true;
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(update, speed);
    }

    function gameOver() {
        clearInterval(gameLoopInterval);
        isGameRunning = false;

        const gameOverScore = document.getElementById('game-over-score');
        if (gameOverScore) gameOverScore.textContent = `SCORE: ${score}`;
        gameOverScreen.classList.remove('hidden');

        // Notify main.js for best score tracking
        if (typeof window.onGameOver === 'function') window.onGameOver(score);
    }

    function setSpeed(ms) { speed = ms; }

    return { start, preview, changeDirection, setSpeed };
})();