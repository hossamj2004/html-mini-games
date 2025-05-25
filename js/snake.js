document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');

    // Game Parameters
    const gridSize = 20; // Size of each grid cell in pixels
    const canvasWidthInCells = canvas.width / gridSize;
    const canvasHeightInCells = canvas.height / gridSize;

    let snake;
    let food;
    let score;
    let direction; // 'up', 'down', 'left', 'right'
    let changingDirection; // Flag to prevent rapid direction changes causing self-collision
    let gameLoopTimeout;

    // Colors
    const snakeColor = '#00ff00'; // Bright Green
    const foodColor = '#ff0000';  // Red
    const backgroundColor = '#111';
    const borderColor = '#00ff00';
    const textColor = '#00ff00';
    const gameOverColor = '#ff0000';

    // --- Sound Placeholder ---
    function playSound(soundName) {
        console.log(`Playing sound (Snake): ${soundName}`);
        // Example for actual sound:
        // const sounds = {
        //     'eat': 'path/to/eat.wav',
        //     'gameOver': 'path/to/gameOver.wav'
        // };
        // if (sounds[soundName]) {
        //     new Audio(sounds[soundName]).play().catch(e => console.error("Error playing sound:", e));
        // }
    }

    // --- Game Setup ---
    function initializeGame() {
        // Initialize snake
        snake = [
            { x: Math.floor(canvasWidthInCells / 2) - 2, y: Math.floor(canvasHeightInCells / 2) },
            { x: Math.floor(canvasWidthInCells / 2) - 3, y: Math.floor(canvasHeightInCells / 2) },
            { x: Math.floor(canvasWidthInCells / 2) - 4, y: Math.floor(canvasHeightInCells / 2) }
        ];
        direction = 'right';
        changingDirection = false;

        // Initialize score
        score = 0;
        updateScoreDisplay();

        // Place initial food
        placeFood();

        // Start the game loop
        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        gameLoop();
        hideGameOverMessage(); // Hide game over message if it was previously shown
    }

    // --- Game Loop ---
    function gameLoop() {
        if (checkCollision()) {
            gameOver();
            return;
        }

        changingDirection = false; // Reset flag after movement

        // Use setTimeout for a controllable game speed
        gameLoopTimeout = setTimeout(() => {
            clearCanvas();
            moveSnake();
            drawFood();
            drawSnake();
            requestAnimationFrame(gameLoop); // For smoother animation, but speed controlled by setTimeout
        }, 100); // Adjust for game speed (e.g., 100ms for 10fps)
    }

    // --- Drawing Functions ---
    function clearCanvas() {
        context.fillStyle = backgroundColor;
        context.strokeStyle = borderColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnakeSegment(segment) {
        context.fillStyle = snakeColor;
        context.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        context.strokeStyle = backgroundColor; // Add a border to segments for definition
        context.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    }

    function drawSnake() {
        snake.forEach(drawSnakeSegment);
    }

    function drawFood() {
        context.fillStyle = foodColor;
        context.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        context.strokeStyle = backgroundColor;
        context.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    // --- Movement Logic ---
    function moveSnake() {
        // Create new head based on direction
        const head = { x: snake[0].x, y: snake[0].y };
        switch (direction) {
            case 'up':    head.y -= 1; break;
            case 'down':  head.y += 1; break;
            case 'left':  head.x -= 1; break;
            case 'right': head.x += 1; break;
        }
        snake.unshift(head); // Add new head

        // Check if snake eats food
        if (head.x === food.x && head.y === food.y) {
            score++;
            updateScoreDisplay();
            placeFood();
            playSound('eat');
        } else {
            snake.pop(); // Remove tail segment
        }
    }

    // --- Movement Control ---
    document.addEventListener('keydown', (event) => {
        if (changingDirection) return; // Prevent changing direction multiple times before next move

        const keyPressed = event.key;
        const goingUp = direction === 'up';
        const goingDown = direction === 'down';
        const goingLeft = direction === 'left';
        const goingRight = direction === 'right';

        if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
            direction = 'up';
            changingDirection = true;
        } else if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
            direction = 'down';
            changingDirection = true;
        } else if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
            direction = 'left';
            changingDirection = true;
        } else if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
            direction = 'right';
            changingDirection = true;
        } else if (keyPressed === 'Enter' && isGameOver) { // Restart game on Enter if game over
            initializeGame();
        }
    });

    // --- Collision Detection ---
    function checkCollision() {
        const head = snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= canvasWidthInCells || head.y < 0 || head.y >= canvasHeightInCells) {
            return true;
        }

        // Self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        return false;
    }

    // --- Food Placement ---
    function placeFood() {
        let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * canvasWidthInCells),
                y: Math.floor(Math.random() * canvasHeightInCells)
            };
        } while (isFoodOnSnake(newFoodPosition)); // Ensure food doesn't spawn on snake
        food = newFoodPosition;
    }

    function isFoodOnSnake(position) {
        return snake.some(segment => segment.x === position.x && segment.y === position.y);
    }

    // --- Scoring ---
    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    // --- Game Over ---
    let isGameOver = false;

    function showGameOverMessage() {
        let gameOverMessageElement = document.getElementById('game-over-message');
        if (!gameOverMessageElement) {
            gameOverMessageElement = document.createElement('div');
            gameOverMessageElement.id = 'game-over-message';
            // Apply basic styles if CSS fails or is not specific enough
            gameOverMessageElement.style.position = 'absolute';
            gameOverMessageElement.style.top = '50%';
            gameOverMessageElement.style.left = '50%';
            gameOverMessageElement.style.transform = 'translate(-50%, -50%)';
            gameOverMessageElement.style.color = gameOverColor;
            gameOverMessageElement.style.fontSize = '2em';
            gameOverMessageElement.style.textAlign = 'center';
            gameOverMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            gameOverMessageElement.style.padding = '20px';
            gameOverMessageElement.style.border = `2px solid ${gameOverColor}`;
            gameOverMessageElement.style.fontFamily = '"Press Start 2P", monospace';
            document.body.appendChild(gameOverMessageElement);
        }
        gameOverMessageElement.innerHTML = `GAME OVER!<br>Score: ${score}<br>Press Enter to Restart`;
        gameOverMessageElement.style.display = 'block';
    }

    function hideGameOverMessage() {
        const gameOverMessageElement = document.getElementById('game-over-message');
        if (gameOverMessageElement) {
            gameOverMessageElement.style.display = 'none';
        }
    }

    function gameOver() {
        clearTimeout(gameLoopTimeout); // Stop the game loop
        isGameOver = true;
        showGameOverMessage();
        playSound('gameOver');
    }

    // --- Start Game ---
    initializeGame();
});
