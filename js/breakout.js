document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');

    // --- Game Parameters ---
    let score = 0;
    let lives = 3;

    // Ball properties
    const ballRadius = 8;
    let ballX = canvas.width / 2;
    let ballY = canvas.height - 30;
    let ballSpeedX = 3;
    let ballSpeedY = -3;

    // Paddle properties
    const paddleHeight = 12;
    const paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;
    const paddleSpeed = 7;

    // Brick properties
    const brickRowCount = 4;
    const brickColumnCount = 7;
    const brickWidth = 55;
    const brickHeight = 15;
    const brickPadding = 8;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;
    const bricks = [];
    const brickColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1"]; // Different colors for rows

    // Controls
    let rightPressed = false;
    let leftPressed = false;

    // Game state
    let gameRunning = true;
    let animationFrameId;

    // --- Sound Placeholder ---
    function playSound(soundName) {
        console.log(`Playing sound (Breakout): ${soundName}`);
        // Example for actual sound:
        // const sounds = {
        //     'paddleHit': 'path/to/paddleHit.wav',
        //     'brickBreak': 'path/to/brickBreak.wav',
        //     'loseLife': 'path/to/loseLife.wav',
        //     'gameOver': 'path/to/gameOver.wav',
        //     'winGame': 'path/to/winGame.wav'
        // };
        // if (sounds[soundName]) {
        //     new Audio(sounds[soundName]).play().catch(e => console.error("Error playing sound:", e));
        // }
    }

    // --- Brick Initialization ---
    function initializeBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1, color: brickColors[r % brickColors.length] };
            }
        }
        // Position bricks after creation, in case bricks array is logged for debugging
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r].status === 1) {
                    bricks[c][r].x = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                    bricks[c][r].y = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                }
            }
        }
    }

    // --- Drawing Functions ---
    function drawBall() {
        context.beginPath();
        context.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        context.fillStyle = "#00ff00"; // Bright Green
        context.fill();
        context.closePath();
    }

    function drawPaddle() {
        context.beginPath();
        context.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        context.fillStyle = "#00ff00"; // Bright Green
        context.fill();
        context.closePath();
    }

    function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r].status === 1) {
                    const brick = bricks[c][r];
                    context.beginPath();
                    context.rect(brick.x, brick.y, brickWidth, brickHeight);
                    context.fillStyle = brick.color;
                    context.fill();
                    context.closePath();
                }
            }
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    function updateLivesDisplay() {
        livesDisplay.textContent = `Lives: ${lives}`;
    }

    // --- Collision Detection ---
    function collisionDetection() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brick = bricks[c][r];
                if (brick.status === 1) {
                    if (ballX + ballRadius > brick.x && ballX - ballRadius < brick.x + brickWidth &&
                        ballY + ballRadius > brick.y && ballY - ballRadius < brick.y + brickHeight) {
                        ballSpeedY = -ballSpeedY;
                        brick.status = 0;
                        score++;
                        playSound('brickBreak');
                        if (score === brickRowCount * brickColumnCount) {
                            winGame();
                        }
                    }
                }
            }
        }
    }

    // --- Paddle Movement ---
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("mousemove", mouseMoveHandler, false);

    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
            rightPressed = true;
        } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
            leftPressed = true;
        } else if ((e.key === "Enter" || e.key === " ") && !gameRunning) { // Space or Enter to restart
            resetGame();
        }
    }

    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
            rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
            leftPressed = false;
        }
    }

    function mouseMoveHandler(e) {
        const relativeX = e.clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
            if (paddleX < 0) paddleX = 0;
            if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
        }
    }

    // --- Game Logic ---
    function resetBallAndPaddle() {
        ballX = canvas.width / 2;
        ballY = canvas.height - 30 - ballRadius; // Position above paddle
        paddleX = (canvas.width - paddleWidth) / 2;
        // Randomize initial ball direction slightly for variety
        ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 3;
        ballSpeedY = -3;
    }

    function updateGame() {
        if (!gameRunning) return;

        // Ball collision with left/right walls
        if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
            ballSpeedX = -ballSpeedX;
        }

        // Ball collision with top wall
        if (ballY + ballSpeedY < ballRadius) {
            ballSpeedY = -ballSpeedY;
        }
        // Ball collision with bottom wall (paddle miss)
        else if (ballY + ballSpeedY > canvas.height - ballRadius - paddleHeight) {
            if (ballX > paddleX && ballX < paddleX + paddleWidth && ballY + ballRadius < canvas.height) { // Check if ball is above paddle
                ballSpeedY = -ballSpeedY;
                playSound('paddleHit');
                // Optional: Change ballSpeedX based on where it hits the paddle
                let deltaX = ballX - (paddleX + paddleWidth / 2);
                ballSpeedX = deltaX * 0.2; // Adjust multiplier for desired effect
            } else if (ballY + ballSpeedY > canvas.height - ballRadius) { // Ensure ball is actually at the bottom edge
                lives--;
                updateLivesDisplay();
                playSound('loseLife');
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetBallAndPaddle();
                }
            }
        }


        // Paddle movement
        if (rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += paddleSpeed;
        } else if (leftPressed && paddleX > 0) {
            paddleX -= paddleSpeed;
        }

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        collisionDetection();
    }

    // --- Main Draw Loop ---
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        drawBricks();
        drawBall();
        drawPaddle();
        updateScoreDisplay(); // Update score text
        updateLivesDisplay();   // Update lives text

        updateGame(); // Update game logic

        if (gameRunning) {
            animationFrameId = requestAnimationFrame(draw);
        }
    }

    // --- Game State Functions ---
    function displayMessage(message, buttonText, soundToPlayOnDisplay) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        if (soundToPlayOnDisplay) {
            playSound(soundToPlayOnDisplay);
        }

        let messageElement = document.getElementById('game-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'game-message';
            document.getElementById('game-container').appendChild(messageElement); // Append to container
        }

        messageElement.innerHTML = `${message}<br><button id="restart-button">${buttonText}</button>`;
        messageElement.style.display = 'block';

        const restartButton = document.getElementById('restart-button');
        restartButton.focus(); // Focus for keyboard accessibility
        restartButton.onclick = () => {
            messageElement.style.display = 'none';
            resetGame();
        };
    }

    function gameOver() {
        displayMessage("GAME OVER!", "Restart", "gameOver");
    }

    function winGame() {
        displayMessage("YOU WIN!", "Play Again?", "winGame");
    }

    function resetGame() {
        score = 0;
        lives = 3;
        initializeBricks();
        resetBallAndPaddle();
        updateScoreDisplay();
        updateLivesDisplay();
        gameRunning = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        draw();
    }

    // --- Initialize and Start Game ---
    initializeBricks();
    updateScoreDisplay(); // Initial display
    updateLivesDisplay();   // Initial display
    draw(); // Start game loop
});
