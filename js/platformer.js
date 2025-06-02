document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score-display');
    const livesElement = document.getElementById('lives-display');

    // Game Constants
    const TILE_SIZE = 40; // Each tile is 40x40 pixels
    canvas.width = 640; // 16 tiles wide
    canvas.height = 480; // 12 tiles tall

    const GRAVITY = 0.5;
    const PLAYER_SPEED = 5;
    const JUMP_FORCE = 12;
    const PLAYER_WIDTH = TILE_SIZE * 0.75; // Player is slightly smaller than a tile
    const PLAYER_HEIGHT = TILE_SIZE * 0.75;
    const COIN_RADIUS = TILE_SIZE / 4;
    const ENEMY_PATROL_RANGE = TILE_SIZE * 3;
    const ENEMY_SPEED = 1;

    // Level Data
    const level1Map = [ // Original Level 1 Map
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 0
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 1
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6], // Row 2 (Player start, Level Goal at end)
        [1,1,0,0,1,1,0,0,0,1,1,1,0,0,1,1], // Row 3 (Platforms)
        [0,0,0,3,0,0,0,3,0,0,0,0,0,3,0,0], // Row 4 (Coins)
        [0,1,1,1,0,0,1,1,1,0,0,0,1,1,0,0], // Row 5
        [0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0], // Row 6
        [1,1,0,0,1,1,1,0,0,1,1,0,0,0,1,1], // Row 7
        [0,0,0,3,0,0,0,0,3,0,0,0,0,3,0,0], // Row 8
        [0,0,1,1,1,1,1,1,1,1,0,0,0,5,1,1], // Row 9 (Boss placeholder near end)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 10 (Ground)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // Row 11 (Ground)
    ];

    const level2Map = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,2,0,0,1,1,0,0,0,3,0,0,0,0,0,6], // Start, platform, coin, goal
        [1,1,1,0,0,0,0,1,1,1,0,0,0,1,1,1],
        [0,0,0,0,3,0,0,0,0,0,0,7,0,0,0,0], // Coin, patrol enemy
        [0,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0],
        [0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,0],
        [1,1,0,0,1,1,1,1,0,0,7,0,0,1,1,0], // Patrol enemy
        [0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0],
        [0,0,1,1,0,0,3,0,0,0,0,0,0,3,0,0],
        [1,1,0,0,0,1,1,1,0,0,0,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,0,0,0,8,1,1], // Ground, Level 2 Boss (tile 8)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const level3Map = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,2,1,0,0,7,0,0,1,0,0,3,0,1,0,0], // Start, platform, enemy, coin
        [1,1,0,0,1,1,1,0,0,0,1,1,0,0,0,1],
        [0,0,0,3,0,0,0,0,1,0,0,0,0,1,3,0], // Coins
        [0,1,1,1,0,7,0,1,0,0,1,1,0,0,1,0], // Enemy
        [0,0,0,0,1,1,0,0,0,1,0,0,0,1,0,0],
        [1,0,3,1,0,0,0,7,0,0,0,1,0,0,0,6], // Coin, enemy, goal
        [0,0,1,0,0,1,1,1,1,1,0,0,0,1,1,0],
        [0,1,0,0,7,0,0,0,3,0,0,1,0,0,0,0], // Enemy, coin
        [0,0,0,1,1,1,1,0,0,1,1,1,1,1,0,0],
        [1,1,1,0,0,0,0,0,1,0,0,0,9,1,1,1], // Ground, Level 3 Boss (Tile 9, changed from 'B')
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    // Ensure level1Map and level2Map are defined above this.
    const levels = [level1Map, level2Map, level3Map];
    let currentLevelIndex = 0;

    // Player Object
    let player = {
        x: TILE_SIZE, // Default, will be updated by map parsing
        y: canvas.height - TILE_SIZE * 3, // Default
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        dx: 0,
        dy: 0,
        isOnGround: false,
        color: '#00ff00' // Bright Green
    };

    // Game Element Arrays
    let platforms = [];
    let coins = [];
    let enemies = []; // For patrol enemies
    let levelGoal = null;
    let bosses = [];

    // Input State
    let keys = {
        left: false,
        right: false,
        up: false
    };

    // Score and Lives
    let score = 0;
    let lives = 3;

    // Game State Flags
    let isGameOver = false;
    let isGameWon = false;
    let gameOverSoundPlayed = false; // Helper to play sound once
    let gameWinSoundPlayed = false; // Helper to play sound once

    // --- Input Handling ---
    function keyDownHandler(e) {
        if (isGameOver) {
            if (e.key === 'Enter') {
                isGameOver = false;
                lives = 3;
                score = 0;
                currentLevelIndex = 0;
                loadLevel(levels[currentLevelIndex]); // This will reset sounds flags via loadLevel
                playSound('gameRestart');
            }
            e.preventDefault();
            return;
        }
        if (isGameWon) {
            if (e.key === 'Enter') {
                isGameWon = false;
                lives = 3;
                score = 0;
                currentLevelIndex = 0;
                loadLevel(levels[currentLevelIndex]); // This will reset sounds flags via loadLevel
                playSound('gameRestart');
            }
            e.preventDefault();
            return;
        }

        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            keys.left = true;
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            keys.right = true;
        } else if ((e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') && !keys.up) { // Prevent holding jump
            keys.up = true;
            // Jump sound is handled in update() when player.isOnGround is true
        }
        e.preventDefault(); // Prevent default browser action for game keys
    }

    function keyUpHandler(e) {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            keys.left = false;
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            keys.right = false;
        } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') {
            keys.up = false;
        }
    }

    // --- Update Game State ---
    function update() {
        // Player horizontal movement
        if (keys.left) {
            player.dx = -PLAYER_SPEED;
        } else if (keys.right) {
            player.dx = PLAYER_SPEED;
        } else {
            player.dx = 0;
        }

        // Player jump
        if (keys.up && player.isOnGround) {
            player.dy = -JUMP_FORCE;
            player.isOnGround = false;
            playSound('jump');
        }
        // After processing a jump, set keys.up to false to require a new key press
        // This is a simple way to prevent continuous jumping if key is held.
        // More robust input systems might handle this in keyUp or by checking if key *was just pressed*.
        // For this project, if keys.up is true, it means a jump was initiated this frame if on ground.
        // We can set keys.up = false here, or rely on keyUpHandler. KeyUpHandler is generally better.

        // Apply gravity
        player.dy += GRAVITY;

        // Store previous position for collision response
        let prevPlayerX = player.x;
        let prevPlayerY = player.y;

        // Update position
        player.x += player.dx;
        player.y += player.dy;

        // Collision detection with platforms
        player.isOnGround = false; // Assume not on ground until collision says otherwise
        platforms.forEach(platform => {
            if (checkCollision(player, platform)) {
                const playerPrevBottom = prevPlayerY + player.height;
                const playerBottom = player.y + player.height;
                const platformTop = platform.y;
                const platformBottom = platform.y + platform.height;
                const platformLeft = platform.x;
                const platformRight = platform.x + platform.width;

                // Check vertical collision first (landing or hitting head)
                if (player.dy >= 0 && playerPrevBottom <= platformTop && playerBottom >= platformTop) { // Landed on top
                    player.y = platformTop - player.height;
                    player.dy = 0;
                    player.isOnGround = true;
                } else if (player.dy < 0 && prevPlayerY >= platformBottom && player.y < platformBottom) { // Hit head on underside
                    player.y = platformBottom;
                    player.dy = 0;
                }
                // Horizontal collision (resolve only if no vertical collision was definitive for this frame)
                // This 'else if' structure helps prevent corner snagging issues by prioritizing vertical.
                else if (player.dx > 0 && player.x + player.width > platformLeft && prevPlayerX + player.width <= platformLeft) { // Collided with left side of platform
                    player.x = platformLeft - player.width;
                    player.dx = 0;
                } else if (player.dx < 0 && player.x < platformRight && prevPlayerX >= platformRight) { // Collided with right side of platform
                    player.x = platformRight;
                    player.dx = 0;
                }
            }
        });

        // Collision with Coins
        coins.forEach(coin => {
            if (!coin.isCollected && checkCollision(player, coin)) {
                coin.isCollected = true;
                score += 10;
                updateScoreDisplay();
                playSound('collectCoin');
            }
        });

        // Collision with Bosses (treat as solid for now)
        bosses.forEach(boss => {
             if (checkCollision(player, boss)) {
                const playerPrevBottom = prevPlayerY + player.height;
                const playerBottom = player.y + player.height;
                const bossTop = boss.y;
                const bossBottom = boss.y + boss.height;
                const bossLeft = boss.x;
                const bossRight = boss.x + boss.width;

                // Check vertical collision first
                if (player.dy >= 0 && playerPrevBottom <= bossTop && playerBottom >= bossTop) { // Landed on top
                    player.y = bossTop - player.height;
                    player.dy = 0;
                    player.isOnGround = true;
                } else if (player.dy < 0 && prevPlayerY >= bossBottom && player.y < bossBottom) { // Hit head on underside
                    player.y = bossBottom;
                    player.dy = 0;
                }
                // Horizontal collision
                else if (player.dx > 0 && player.x + player.width > bossLeft && prevPlayerX + player.width <= bossLeft) {
                    player.x = bossLeft - player.width;
                    player.dx = 0;
                } else if (player.dx < 0 && player.x < bossRight && prevPlayerX >= bossRight) {
                    player.x = bossRight;
                    player.dx = 0;
                }
                // console.log("Collided with Boss placeholder"); // Keep console less noisy for testing
            }
        });

        // Collision with Level Goal
        if (levelGoal && checkCollision(player, levelGoal)) {
            playSound('levelComplete');
            currentLevelIndex++;
            if (currentLevelIndex < levels.length) {
                console.log(`Loading Level ${currentLevelIndex + 1}`);
                loadLevel(levels[currentLevelIndex]); // This will reset sound flags
            } else {
                isGameWon = true; // Trigger game win screen
                // console.log("Congratulations! You beat all levels!"); // Message handled by win screen
            }
        }

        // Player-Enemy Collisions (only if game is active)
        if (!isGameOver && !isGameWon) {
            checkPlayerEnemyCollisions();
        }


        // Canvas bounds (horizontal)
        if (player.x < 0) {
            player.x = 0;
            if (player.dx < 0) player.dx = 0; // Stop movement if hitting edge
        } else if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
            if (player.dx > 0) player.dx = 0; // Stop movement if hitting edge
        }

        // Handle falling off bottom (life loss placeholder)
        if (player.y > canvas.height) {
            lives--;
            updateLivesDisplay();
            playSound('loseLife'); // Called when player falls
            if (lives <= 0) {
                isGameOver = true; // Trigger game over screen
            } else {
                resetPlayerToStart();
            }
            // console.log("Player fell off. Lives: " + lives);
        }
    }

    // --- Collision Detection Helper ---
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // --- Drawing Functions ---
    function drawPlayer() {
        const headHeight = player.height * 0.3;
        const bodyHeight = player.height * 0.7;
        const eyeSize = player.width * 0.15;

        // Body
        context.fillStyle = player.color; // Main green
        context.fillRect(player.x, player.y + headHeight, player.width, bodyHeight);

        // Head
        context.fillStyle = '#00cc00'; // Slightly darker green for head
        context.fillRect(player.x, player.y, player.width, headHeight);

        // Eye (simple one) - facing right by default
        context.fillStyle = '#fff'; // White part of eye
        let eyeX = player.x + player.width * 0.6;
        if (player.dx < 0) { // Facing left
            eyeX = player.x + player.width * 0.2;
        }
        context.fillRect(eyeX, player.y + headHeight * 0.2, eyeSize * 2, eyeSize);
        context.fillStyle = '#000'; // Pupil
        context.fillRect(eyeX + eyeSize*0.5, player.y + headHeight * 0.2 + eyeSize*0.25, eyeSize, eyeSize*0.5);

    }

    function drawPlatforms() {
        const platformFillColor = '#888'; // Main gray
        const platformBorderColor = '#555'; // Darker gray for border
        const platformTextureColor = '#777'; // Slightly lighter for texture lines

        platforms.forEach(platform => {
            // Draw border
            context.fillStyle = platformBorderColor;
            context.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Draw main fill (slightly inset for border effect)
            const inset = 2; // Border thickness
            context.fillStyle = platformFillColor;
            context.fillRect(platform.x + inset, platform.y + inset, platform.width - inset * 2, platform.height - inset * 2);

            // Draw simple texture (e.g., horizontal lines)
            context.fillStyle = platformTextureColor;
            const lineThickness = 2;
            for (let i = 0; i < platform.height / (TILE_SIZE / 4); i += 2) { // Lines every 1/4 tile height, skipping one
                 if(platform.y + inset + i * (TILE_SIZE / 4) + lineThickness < platform.y + platform.height - inset*2) {
                    context.fillRect(
                        platform.x + inset,
                        platform.y + inset + i * (TILE_SIZE / 4),
                        platform.width - inset * 2,
                        lineThickness
                    );
                }
            }
        });
    }

    function drawCoins() {
        const coinOuterColor = '#ffd700'; // Gold
        const coinInnerColor = '#b8860b'; // DarkGoldenrod
        const coinShineColor = '#ffff99'; // PaleYellow

        coins.forEach(coin => {
            if (!coin.isCollected) {
                const centerX = coin.x + coin.width / 2;
                const centerY = coin.y + coin.height / 2;

                // Main coin body
                context.fillStyle = coinOuterColor;
                context.beginPath();
                context.arc(centerX, centerY, COIN_RADIUS, 0, Math.PI * 2);
                context.fill();

                // Inner darker circle
                context.fillStyle = coinInnerColor;
                context.beginPath();
                context.arc(centerX, centerY, COIN_RADIUS * 0.6, 0, Math.PI * 2);
                context.fill();

                // Simple shine effect (small arc)
                context.fillStyle = coinShineColor;
                context.beginPath();
                context.arc(centerX - COIN_RADIUS * 0.3, centerY - COIN_RADIUS * 0.3, COIN_RADIUS * 0.3, Math.PI * 1.5, Math.PI * 0.2, false); // Top-leftish shine
                context.fill();
            }
        });
    }

    function drawLevelGoal() {
        if (levelGoal) {
            context.fillStyle = '#0000ff'; // Blue for goal
            context.fillRect(levelGoal.x, levelGoal.y, levelGoal.width, levelGoal.height);
            // Simple flag pole
            context.fillStyle = '#c0c0c0'; // Silver
            context.fillRect(levelGoal.x + levelGoal.width / 2 - 2, levelGoal.y - TILE_SIZE, 4, TILE_SIZE);
            context.fillStyle = '#ff0000'; // Red flag
            context.beginPath();
            context.moveTo(levelGoal.x + levelGoal.width / 2 + 2, levelGoal.y - TILE_SIZE);
            context.lineTo(levelGoal.x + levelGoal.width / 2 + 2, levelGoal.y - TILE_SIZE / 2);
            context.lineTo(levelGoal.x + levelGoal.width / 2 + 2 + TILE_SIZE /2 , levelGoal.y - TILE_SIZE * 0.75);
            context.closePath();
            context.fill();
        }
    }

    function drawBosses() {
        bosses.forEach(boss => {
            // Main body
            context.fillStyle = boss.color;
            context.fillRect(boss.x, boss.y, boss.width, boss.height);

            const eyeColor = '#fff';
            const pupilColor = '#000';
            const spikeColor = '#555'; // Dark gray for spikes/details

            if (boss.isLevel3Boss) { // Indigo, largest
                // Large central eye
                const eyeY = boss.y + boss.height * 0.25;
                const eyeOuterRadius = boss.width * 0.2;
                const eyeInnerRadius = boss.width * 0.1;
                context.fillStyle = eyeColor;
                context.beginPath();
                context.arc(boss.x + boss.width / 2, eyeY, eyeOuterRadius, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = pupilColor;
                context.beginPath();
                context.arc(boss.x + boss.width / 2, eyeY, eyeInnerRadius, 0, Math.PI * 2);
                context.fill();

                // Horns / Armor plates
                const plateWidth = boss.width / 4;
                const plateHeight = TILE_SIZE / 2;
                context.fillStyle = spikeColor;
                context.fillRect(boss.x + plateWidth / 2, boss.y - plateHeight, plateWidth, plateHeight); // Top left horn
                context.fillRect(boss.x + boss.width - plateWidth * 1.5, boss.y - plateHeight, plateWidth, plateHeight); // Top right horn
                context.fillRect(boss.x - plateHeight, boss.y + boss.height / 3, plateHeight, plateWidth); // Side left plate
                context.fillRect(boss.x + boss.width, boss.y + boss.height / 3, plateHeight, plateWidth); // Side right plate

            } else if (boss.isLevel2Boss) { // Dark Violet, larger
                // Two eyes
                const eyeSize = TILE_SIZE / 2;
                context.fillStyle = eyeColor;
                context.fillRect(boss.x + boss.width * 0.2 - eyeSize / 2, boss.y + boss.height * 0.3, eyeSize, eyeSize);
                context.fillRect(boss.x + boss.width * 0.8 - eyeSize / 2, boss.y + boss.height * 0.3, eyeSize, eyeSize);
                context.fillStyle = pupilColor;
                context.fillRect(boss.x + boss.width * 0.2 - eyeSize / 4, boss.y + boss.height * 0.3 + eyeSize / 4, eyeSize / 2, eyeSize / 2);
                context.fillRect(boss.x + boss.width * 0.8 - eyeSize / 4, boss.y + boss.height * 0.3 + eyeSize / 4, eyeSize / 2, eyeSize / 2);

                // Simple pattern
                context.fillStyle = '#7A00AB'; // Slightly lighter violet
                for(let i=0; i < boss.width; i+= TILE_SIZE/2){
                    context.fillRect(boss.x + i, boss.y + boss.height * 0.6, TILE_SIZE/4, TILE_SIZE/4);
                }

            } else { // Level 1 Boss - Red (Original: #cc0000)
                // Spikes
                const spikeSize = TILE_SIZE / 3;
                context.fillStyle = '#A00000'; // Darker Red for spikes
                // Top spikes
                context.fillRect(boss.x + spikeSize, boss.y - spikeSize, spikeSize, spikeSize);
                context.fillRect(boss.x + boss.width / 2 - spikeSize / 2, boss.y - spikeSize, spikeSize, spikeSize);
                context.fillRect(boss.x + boss.width - spikeSize * 2, boss.y - spikeSize, spikeSize, spikeSize);
                // Side spikes
                context.fillRect(boss.x - spikeSize, boss.y + boss.height / 2 - spikeSize / 2, spikeSize, spikeSize);
                context.fillRect(boss.x + boss.width, boss.y + boss.height / 2 - spikeSize / 2, spikeSize, spikeSize);
                 // Eyes (original simple ones)
                context.fillStyle = eyeColor;
                context.fillRect(boss.x + boss.width * 0.2, boss.y + boss.height * 0.2, TILE_SIZE / 4, TILE_SIZE / 4);
                context.fillRect(boss.x + boss.width * 0.6, boss.y + boss.height * 0.2, TILE_SIZE / 4, TILE_SIZE / 4);
            }
        });
    }

    function drawEnemies() {
        const enemyBodyColor = '#ff8c00'; // Dark Orange
        const enemyEyeWhiteColor = '#fff';
        const enemyPupilColor = '#000';
        const enemyFeetColor = '#d2691e'; // Chocolate - for feet

        enemies.forEach(enemy => {
            const bodyHeight = enemy.height * 0.8;
            const feetHeight = enemy.height * 0.2;
            const eyeSize = enemy.width * 0.2;

            // Body
            context.fillStyle = enemyBodyColor;
            context.fillRect(enemy.x, enemy.y, enemy.width, bodyHeight);

            // Feet (two simple blocks)
            context.fillStyle = enemyFeetColor;
            context.fillRect(enemy.x, enemy.y + bodyHeight, enemy.width / 3, feetHeight);
            context.fillRect(enemy.x + (enemy.width * 2 / 3), enemy.y + bodyHeight, enemy.width / 3, feetHeight);

            // Eye (white part)
            context.fillStyle = enemyEyeWhiteColor;
            let eyeX = enemy.x + enemy.width * 0.6; // Default facing right
            if (enemy.direction < 0) { // Facing left
                eyeX = enemy.x + enemy.width * 0.2;
            }
            context.fillRect(eyeX, enemy.y + bodyHeight * 0.2, eyeSize, eyeSize);

            // Pupil
            context.fillStyle = enemyPupilColor;
            context.fillRect(eyeX + eyeSize * 0.25, enemy.y + bodyHeight * 0.2 + eyeSize * 0.25, eyeSize / 2, eyeSize / 2);
        });
    }

    function updateScoreDisplay() {
        scoreElement.textContent = `Score: ${score}`;
    }
    function updateLivesDisplay() {
        livesElement.textContent = `Lives: ${lives}`;
    }


    // --- Game Loop ---
    function gameLoop() {
        if (isGameOver) {
            showGameOverScreen();
        } else if (isGameWon) {
            showGameWinScreen();
        } else {
            update();
            updateEnemies();

            // Draw background (night sky)
            context.fillStyle = '#000033'; // Dark Blue
            context.fillRect(0, 0, canvas.width, canvas.height);

            // context.clearRect(0, 0, canvas.width, canvas.height); // No longer needed if drawing background
            drawPlatforms();
            drawCoins();
            drawEnemies();
            drawBosses();
            drawLevelGoal();
            drawPlayer();
        }
        requestAnimationFrame(gameLoop);
    }

    // --- Screen Drawing Functions ---
    function showGameOverScreen() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = "32px 'Press Start 2P'"; // Adjusted size
        context.fillStyle = "#FF0000"; // Red
        context.textAlign = "center";
        context.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 70); // Adjusted Y

        context.font = "20px 'Press Start 2P'";
        context.fillStyle = "#FFFFFF"; // White
        context.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 10); // Adjusted Y

        context.font = "16px 'Press Start 2P'"; // Adjusted size
        context.fillStyle = "#CCCCCC"; // Light Gray
        context.fillText("Press Enter to Restart Game", canvas.width / 2, canvas.height / 2 + 50); // Adjusted Y

        if (!gameOverSoundPlayed) {
            playSound('gameOver');
            gameOverSoundPlayed = true;
        }
        gameWinSoundPlayed = false; // Reset other sound flag
    }

    function showGameWinScreen() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = "32px 'Press Start 2P'"; // Adjusted size
        context.fillStyle = "#FFFF00"; // Yellow
        context.textAlign = "center";
        context.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 70); // Adjusted Y

        context.font = "20px 'Press Start 2P'";
        context.fillStyle = "#FFFFFF"; // White
        context.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 10); // Adjusted Y

        context.font = "16px 'Press Start 2P'"; // Adjusted size
        context.fillStyle = "#CCCCCC"; // Light Gray
        context.fillText("Press Enter to Play Again", canvas.width / 2, canvas.height / 2 + 50); // Adjusted Y

        if (!gameWinSoundPlayed) {
            playSound('gameWin');
            gameWinSoundPlayed = true;
        }
        gameOverSoundPlayed = false; // Reset other sound flag
    }

    // --- Enemy Logic ---
    function updateEnemies() {
        if (isGameOver || isGameWon) { // Stop enemy updates if game is over or won
            return;
        }
        enemies.forEach(enemy => {
            if (enemy.type === 'patrol') {
                enemy.x += enemy.speed * enemy.direction;
                if (enemy.x > enemy.originalX + enemy.patrolRange || enemy.x < enemy.originalX) {
                    enemy.direction *= -1;
                }
            }
            // Apply gravity to enemies if needed in future (e.g. for jumping enemies)
            // enemy.dy += GRAVITY;
            // enemy.y += enemy.dy;
            // Add platform collision for enemies if they need to respect terrain
        });
    }

    function checkPlayerEnemyCollisions() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (checkCollision(player, enemy)) {
                // Check for stomp: player falling and bottom of player is near top of enemy
                if (player.dy > 0 && (player.y + player.height) < (enemy.y + enemy.height * 0.5)) {
                    enemies.splice(i, 1); // Remove stomped enemy
                    score += 50;
                    updateScoreDisplay();
                    playSound('stompEnemy');
                    player.dy = -JUMP_FORCE / 2; // Small bounce after stomp
                    player.isOnGround = false;
                } else {
                    // Player hit by enemy from side or bottom
                    lives--;
                    updateLivesDisplay();
                    playSound('playerHurt');
                    if (lives <= 0) {
                        isGameOver = true; // Trigger game over screen
                    } else {
                        resetPlayerToStart(); // Reset player to current level's start
                    }
                    break; // Stop checking other enemies this frame after taking damage
                }
            }
        }
    }


    // --- Level Parsing and Initialization ---
    function parseLevelMap(levelMapData) {
        platforms = [];
        coins = [];
        enemies = [];
        bosses = [];
        levelGoal = null;

        for (let row = 0; row < levelMapData.length; row++) {
            for (let col = 0; col < levelMapData[row].length; col++) {
                const tileType = levelMapData[row][col];
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                if (tileType === 1) { // Platform
                    platforms.push({ x, y, width: TILE_SIZE, height: TILE_SIZE, color: '#888' });
                } else if (tileType === 2) { // Player Start
                    player.startX = x;
                    player.startY = y;
                    // Player x,y set in resetPlayerToStart
                } else if (tileType === 3) { // Coin
                    coins.push({ x: x + TILE_SIZE / 2 - COIN_RADIUS, y: y + TILE_SIZE / 2 - COIN_RADIUS, width: COIN_RADIUS * 2, height: COIN_RADIUS * 2, isCollected: false });
                } else if (tileType === 5) { // Level 1 Boss Placeholder
                    bosses.push({ x, y, width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: '#cc0000', isLevel2Boss: false, isLevel3Boss: false });
                } else if (tileType === 6) { // Level Goal
                    levelGoal = { x, y, width: TILE_SIZE, height: TILE_SIZE };
                } else if (tileType === 7) { // Patrol Enemy
                    enemies.push({
                        x, y: y + TILE_SIZE - PLAYER_HEIGHT, // Align to sit on its tile
                        width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
                        type: 'patrol',
                        speed: ENEMY_SPEED,
                        direction: 1,
                        originalX: x,
                        patrolRange: ENEMY_PATROL_RANGE,
                        color: '#ff8c00' // Dark Orange
                    });
                } else if (tileType === 8) { // Level 2 Boss Placeholder
                     bosses.push({ x, y, width: TILE_SIZE * 2, height: TILE_SIZE * 2, color: '#9400D3', isLevel2Boss: true, isLevel3Boss: false }); // Dark Violet, larger
                } else if (tileType === 9) { // Level 3 Boss Placeholder (using 9 instead of 'B')
                     bosses.push({ x, y, width: TILE_SIZE * 2.5, height: TILE_SIZE * 2.5, color: '#4B0082', isLevel2Boss: false, isLevel3Boss: true }); // Indigo, largest
                }
            }
        }
        if (player.startX === undefined) { // Fallback if no player start tile in map
             player.startX = TILE_SIZE;
             player.startY = canvas.height - TILE_SIZE * 3;
             // Player x,y set in resetPlayerToStart
        }
    }

    function loadLevel(levelMapData) {
        console.log("Loading level data...");
        score = 0; // Reset score when a new level loads.
        // Lives are persistent across levels until game over

        // Reset sound flags for the new level/game session
        gameOverSoundPlayed = false;
        gameWinSoundPlayed = false;

        parseLevelMap(levelMapData);
        resetPlayerToStart();
        updateScoreDisplay(); // Ensure score (which might be 0 if new game) is displayed
        updateLivesDisplay(); // Ensure lives are displayed
    }

    function resetPlayerToStart() {
        player.x = player.startX;
        player.y = player.startY; // Player Y is set relative to their tile in parseLevelMap
        player.dx = 0;
        player.dy = 0;
        player.isOnGround = false; // Will be re-evaluated
    }


    // --- Initialization ---
    function init() {
        loadLevel(levels[currentLevelIndex]); // Load the initial level
        // Score and lives display updated by loadLevel -> parse -> resetPlayer -> updateUI calls
        updateLivesDisplay(); // Ensure lives are shown initially

        // Set up event listeners
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);

        // Start the game loop
        requestAnimationFrame(gameLoop);
        console.log(`Platformer game initialized. Level ${currentLevelIndex + 1} loaded.`);
    }

    // Start the game
    init();
});

// Placeholder sound function (can be expanded later)
function playSound(soundName) {
    console.log(`Playing sound (Platformer): ${soundName}`);
}
