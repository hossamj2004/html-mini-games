document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const ROWS = 6;
    const COLS = 7;

    // DOM Element References
    const boardContainer = document.getElementById('board-container');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');

    // Game State Variables
    let board = []; // 2D array [row][col]
    let currentPlayer = 1; // Player 1 starts
    let gameOver = false;
    let winner = null; // null, 1, 2, or 'Draw'

    /**
     * Creates the internal board model (2D array).
     * Initializes all cells to 0 (empty).
     */
    function createBoardModel() {
        board = []; // Clear existing board model
        for (let r = 0; r < ROWS; r++) {
            board[r] = []; // Create a new row
            for (let c = 0; c < COLS; c++) {
                board[r][c] = 0; // 0 represents an empty cell
            }
        }
    }

    /**
     * Renders the visual game board in the DOM based on the `board` model.
     */
    function drawBoard() {
        boardContainer.innerHTML = ''; // Clear existing visual board

        // Create invisible column click handlers on top of the board display
        // Or handle clicks on boardContainer and calculate column. For now, direct cells.
        // For Connect 4, clicks are usually on columns or on the board to signify a column.
        // Let's make the boardContainer itself listen for clicks to determine column.

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('cell');
                cellDiv.dataset.row = r; // For potential debugging or advanced features
                cellDiv.dataset.col = c; // For potential debugging or advanced features

                if (board[r][c] === 1) {
                    cellDiv.classList.add('player1');
                } else if (board[r][c] === 2) {
                    cellDiv.classList.add('player2');
                }
                // Empty cells (0) will just have the default .cell styling (empty circle)
                boardContainer.appendChild(cellDiv);
            }
        }
    }

    /**
     * Updates the status display message.
     */
    function updateStatusDisplay() {
        if (gameOver) {
            if (winner === 'Draw') {
                statusDisplay.textContent = "It's a Draw!";
            } else if (winner) { // winner will be 1 or 2
                statusDisplay.textContent = `Player ${winner} (${winner === 1 ? 'Red' : 'Yellow'}) Wins!`;
            } else {
                // This case should ideally not be reached if gameOver is true only on win or draw.
                statusDisplay.textContent = "Game Over!";
            }
        } else {
            statusDisplay.textContent = `Player ${currentPlayer}'s Turn (${currentPlayer === 1 ? 'Red' : 'Yellow'})`;
        }
    }

    /**
     * Handles a click on the board (delegated from boardContainer).
     * Determines the column clicked and calls dropPiece.
     * @param {Event} event - The click event on the boardContainer.
     */
    function handleBoardClick(event) {
        if (gameOver) return;

        // Calculate column based on click X coordinate relative to boardContainer
        const boardRect = boardContainer.getBoundingClientRect();
        const clickX = event.clientX - boardRect.left;
        const colIndex = Math.floor(clickX / (boardRect.width / COLS));

        if (colIndex >= 0 && colIndex < COLS) {
            handleColumnClick(colIndex);
        }
    }


    /**
     * Handles dropping a piece in the specified column.
     * @param {number} colIndex - The index of the column where the piece should be dropped.
     */
    function handleColumnClick(colIndex) {
        if (gameOver) return;

        // Find the lowest empty row in the selected column
        let rowToPlace = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][colIndex] === 0) {
                rowToPlace = r;
                break;
            }
        }

        if (rowToPlace !== -1) {
            // Place the piece in the board model
            board[rowToPlace][colIndex] = currentPlayer;
            playSound('dropPiece');
            drawBoard(); // Redraw to show the new piece visually

            if (checkWin(rowToPlace, colIndex)) {
                gameOver = true;
                winner = currentPlayer;
                playSound('winGame');
                updateStatusDisplay(); // To show win message
                return; // Game ends, no need to switch player or check draw
            }

            if (checkDraw()) {
                gameOver = true;
                winner = 'Draw'; // Use a specific string for draw state
                playSound('drawGame');
                updateStatusDisplay(); // To show draw message
                return; // Game ends
            }

            // Switch Player if no win and no draw
            currentPlayer = (currentPlayer === 1 ? 2 : 1);
            updateStatusDisplay();
        } else {
            // Column is full
            playSound('invalidMove');
            // Optional: alert("This column is full!");
            // Or update status display temporarily, though current status display doesn't support temp messages.
            console.log(`Column ${colIndex} is full.`);
        }
    }

    /**
     * Resets the game to its initial state.
     */
    function restartGame() {
        createBoardModel();
        currentPlayer = 1;
        gameOver = false;
        winner = null;
        drawBoard();
        updateStatusDisplay();
        console.log("Game restarted");
        playSound('restartGame');
    }

    /**
     * Counts consecutive pieces of the current player in a given direction.
     * @param {number} r - Starting row.
     * @param {number} c - Starting column.
     * @param {number} dr - Delta row (direction for row: -1 for up, 1 for down, 0 for horizontal).
     * @param {number} dc - Delta column (direction for col: -1 for left, 1 for right, 0 for vertical).
     * @param {number} player - The player's mark (1 or 2).
     * @returns {number} Count of consecutive pieces in that direction (not including starting piece).
     */
    function countDirection(r, c, dr, dc, player) {
        let count = 0;
        let cr = r + dr;
        let cc = c + dc;
        while (cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS && board[cr][cc] === player) {
            count++;
            cr += dr;
            cc += dc;
        }
        return count;
    }

    /**
     * Checks if the last piece dropped at (row, col) resulted in a win.
     * @param {number} row - The row of the last piece dropped.
     * @param {number} col - The column of the last piece dropped.
     * @returns {boolean} True if the current player has won, false otherwise.
     */
    function checkWin(row, col) {
        const player = board[row][col];
        if (player === 0) return false; // Should not happen if called correctly

        // Horizontal check
        const countLeft = countDirection(row, col, 0, -1, player);
        const countRight = countDirection(row, col, 0, 1, player);
        if (countLeft + countRight + 1 >= 4) return true;

        // Vertical check (only need to check downwards from the dropped piece)
        const countDown = countDirection(row, col, 1, 0, player);
        if (countDown + 1 >= 4) return true;
        // Note: No need to check upwards because pieces fall. If a win involves pieces above,
        // the highest piece of that winning line would have triggered the win.

        // Diagonal (Positive Slope / : bottom-left to top-right)
        const countNW = countDirection(row, col, -1, -1, player); // North-West
        const countSE = countDirection(row, col, 1, 1, player);   // South-East
        if (countNW + countSE + 1 >= 4) return true;

        // Diagonal (Negative Slope \ : top-left to bottom-right)
        const countNE = countDirection(row, col, -1, 1, player);  // North-East
        const countSW = countDirection(row, col, 1, -1, player);  // South-West
        if (countNE + countSW + 1 >= 4) return true;

        return false;
    }

    /**
     * Checks if the game is a draw (board is full and no winner).
     * This is typically called after checkWin confirms no player has won.
     * @returns {boolean} True if the game is a draw, false otherwise.
     */
    function checkDraw() {
        // If any cell in the top row (row 0) is empty, the board is not full.
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) {
                return false; // Found an empty cell, so not a draw (board not full)
            }
        }
        // If we reach here, the top row is full, meaning the entire board is full.
        // Since this function is called after checkWin, if the board is full and no one won, it's a draw.
        return true;
    }

    // --- Sound Placeholder ---
    function playSound(soundName) {
        console.log(`Sound: ${soundName}`);
    }

    // --- Initialization ---
    /**
     * Initializes the game.
     */
    function init() {
        if (!boardContainer || !statusDisplay || !restartButton) {
            console.error("Failed to get all required DOM elements. Game cannot start.");
            return;
        }

        createBoardModel();
        drawBoard();
        updateStatusDisplay();

        // Event Listeners
        boardContainer.addEventListener('click', handleBoardClick); // Single listener on the board
        restartButton.addEventListener('click', restartGame);

        console.log("Connect 4 Game initialized.");
    }

    // Start the game
    init();
});
