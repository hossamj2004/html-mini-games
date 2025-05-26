document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const boardContainer = document.getElementById('board-container');
    const statusDisplay = document.getElementById('status-display');
    const restartButton = document.getElementById('restart-button');

    // Game State Variables (Initial Values)
    let board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    let currentPlayer = 'X';
    let piecesPlacedX = 0;
    let piecesPlacedO = 0;
    const MAX_PIECES_PER_PLAYER = 3;
    let gamePhase = 'placing'; // 'placing' or 'moving'
    let selectedCell = null;   // For Phase 2: { row, col, piece }
    let gameOver = false;
    let winner = null;

    // --- Drawing Functions ---
    /**
     * Renders the game board in the DOM based on the current `board` state.
     */
    function drawBoard() {
        boardContainer.innerHTML = ''; // Clear existing board
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cellElement = document.createElement('div'); // Renamed for clarity
                cellElement.classList.add('cell');
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                cellElement.textContent = board[row][col];

                // Remove old player classes and add new ones for X/O styling
                cellElement.classList.remove('player-x', 'player-o');
                if (board[row][col] === 'X') {
                    cellElement.classList.add('player-x');
                } else if (board[row][col] === 'O') {
                    cellElement.classList.add('player-o');
                }
                
                // Highlight selected piece (if any) during moving phase
                if (gamePhase === 'moving' && selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    cellElement.classList.add('selected');
                }

                cellElement.addEventListener('click', handleCellClick);
                boardContainer.appendChild(cellElement);
            }
        }
    }

    /**
     * Updates the status display message based on the current game state.
     */
    function updateStatusDisplay() {
        if (gameOver) {
            if (winner) {
                statusDisplay.textContent = `Player ${winner} Wins!`;
            } else {
                statusDisplay.textContent = "Game Over!"; // Should ideally not be reached if win is always detected
            }
        } else if (gamePhase === 'placing') {
            const pieces = currentPlayer === 'X' ? piecesPlacedX : piecesPlacedO;
            if (pieces < MAX_PIECES_PER_PLAYER) {
                statusDisplay.textContent = `Player ${currentPlayer} to Place (${pieces + 1}/${MAX_PIECES_PER_PLAYER})`;
            } else {
                statusDisplay.textContent = `Player ${currentPlayer} (All Pieces Placed)`;
            }
        } else if (gamePhase === 'moving') {
            if (selectedCell) {
                statusDisplay.textContent = `Player ${currentPlayer} to Move: Piece at [${selectedCell.row},${selectedCell.col}] selected. Click an empty adjacent cell.`;
            } else {
                statusDisplay.textContent = `Player ${currentPlayer} to Move: Select one of your pieces.`;
            }
        }
    }

    // --- Game Logic Functions ---
    /**
     * Checks if two cells are adjacent (including diagonals).
     * @param {number} r1 - Row of the first cell.
     * @param {number} c1 - Column of the first cell.
     * @param {number} r2 - Row of the second cell.
     * @param {number} c2 - Column of the second cell.
     * @returns {boolean} True if cells are adjacent, false otherwise.
     */
    function isAdjacent(r1, c1, r2, c2) {
        const rowDiff = Math.abs(r1 - r2);
        const colDiff = Math.abs(c1 - c2);
        // Cells are adjacent if they are at most 1 row and 1 column away,
        // and they are not the same cell (at least one difference must exist).
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
    }

    /**
     * Checks if the given player has won the game.
     * @param {string} playerMark - The player's mark ('X' or 'O').
     * @returns {boolean} True if the player has won, false otherwise.
     */
    function checkWin(playerMark) {
        // Check Rows
        for (let r = 0; r < 3; r++) {
            if (board[r][0] === playerMark && board[r][1] === playerMark && board[r][2] === playerMark) {
                return true;
            }
        }
        // Check Columns
        for (let c = 0; c < 3; c++) {
            if (board[0][c] === playerMark && board[1][c] === playerMark && board[2][c] === playerMark) {
                return true;
            }
        }
        // Check Diagonals
        if (board[0][0] === playerMark && board[1][1] === playerMark && board[2][2] === playerMark) {
            return true;
        }
        if (board[0][2] === playerMark && board[1][1] === playerMark && board[2][0] === playerMark) {
            return true;
        }
        return false;
    }

    // --- Event Handlers ---
    /**
     * Handles a click on a cell in the game board.
     * @param {Event} event - The click event.
     */
    function handleCellClick(event) {
        if (gameOver) return;

        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);

        if (gamePhase === 'moving') {
            if (selectedCell === null) { // Player is selecting a piece to move
                if (board[row][col] === currentPlayer) {
                    selectedCell = { row, col, piece: board[row][col] };
                    // Clear previous selections and highlight new one
                    document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
                    event.target.classList.add('selected');
                    playSound('selectPiece');
                } else if (board[row][col] !== '') { // Clicked opponent's piece
                    playSound('invalidMove');
                    alert("Not your piece! Select one of your own pieces to move.");
                } else { // Clicked an empty cell
                    playSound('invalidMove');
                    alert("Select one of your pieces to move.");
                }
            } else { // Player has selected a piece and is choosing a destination
                if (board[row][col] === '') { // Target cell is empty
                    if (isAdjacent(selectedCell.row, selectedCell.col, row, col)) {
                        // Valid move
                        board[selectedCell.row][selectedCell.col] = '';
                        board[row][col] = selectedCell.piece;
                        playSound('movePiece');

                        const prevSelectedElement = document.querySelector(`.cell[data-row='${selectedCell.row}'][data-col='${selectedCell.col}']`);
                        if (prevSelectedElement) prevSelectedElement.classList.remove('selected');
                        
                        selectedCell = null;
                        drawBoard(); // Redraw to show move and clear old highlights

                        if (checkWin(currentPlayer)) {
                            winner = currentPlayer;
                            gameOver = true;
                            playSound('winGame');
                        } else {
                            currentPlayer = (currentPlayer === 'X' ? 'O' : 'X');
                        }
                    } else { // Not adjacent
                        playSound('invalidMove');
                        alert("Invalid move. Must move to an adjacent empty cell.");
                        // Optionally deselect piece if move is invalid
                        // const prevSelectedElement = document.querySelector(`.cell.selected`);
                        // if (prevSelectedElement) prevSelectedElement.classList.remove('selected');
                        // selectedCell = null;
                    }
                } else { // Target cell is not empty
                    if (row === selectedCell.row && col === selectedCell.col) { // Clicked the selected piece again
                        event.target.classList.remove('selected');
                        selectedCell = null;
                        playSound('deselectPiece'); // Optional sound for deselection
                    } else {
                        playSound('invalidMove');
                        alert("Invalid move. Destination cell must be empty.");
                    }
                }
            }
            updateStatusDisplay();
            return; // End processing for moving phase
        }

        // --- Placing Phase Logic (ensure this part is correctly conditioned) ---
        // Check if cell is already occupied
        if (board[row][col] !== '') {
            playSound('invalidMove');
            alert("Cell already taken!"); // Using alert for immediate feedback
            return;
        }

        // Check if current player has already placed all their pieces
        const piecesPlaced = currentPlayer === 'X' ? piecesPlacedX : piecesPlacedO;
        if (piecesPlaced >= MAX_PIECES_PER_PLAYER) {
            playSound('invalidMove');
            alert(`Player ${currentPlayer} has already placed all ${MAX_PIECES_PER_PLAYER} pieces.`);
            // This should ideally not happen if gamePhase correctly transitions to 'moving'
            // or if status display is clear.
            return;
        }

        // Place the piece
        board[row][col] = currentPlayer;
        playSound('placePiece');

        if (currentPlayer === 'X') {
            piecesPlacedX++;
        } else {
            piecesPlacedO++;
        }

        drawBoard(); // Update board display

        // Check for Win
        if (checkWin(currentPlayer)) {
            winner = currentPlayer;
            gameOver = true;
            playSound('winGame');
        } else {
            // Check if Phase 1 is complete (all MAX_PIECES_PER_PLAYER for each player placed)
            if (piecesPlacedX === MAX_PIECES_PER_PLAYER && piecesPlacedO === MAX_PIECES_PER_PLAYER) {
                gamePhase = 'moving';
                // Switch player to start the moving phase
                currentPlayer = (currentPlayer === 'X' ? 'O' : 'X'); 
            } else {
                // Still in placing phase, switch player
                currentPlayer = (currentPlayer === 'X' ? 'O' : 'X');
            }
        }
        updateStatusDisplay();
    }

    /**
     * Resets the game to its initial state.
     */
    function restartGame() {
        console.log("Restarting game...");
        board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        currentPlayer = 'X';
        piecesPlacedX = 0;
        piecesPlacedO = 0;
        gamePhase = 'placing';
        selectedCell = null;
        gameOver = false;
        winner = null;

        drawBoard();
        updateStatusDisplay();
        playSound('restartGame'); 
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
        restartButton.addEventListener('click', restartGame);
        drawBoard();
        updateStatusDisplay();
        console.log("XO Game initialized.");
    }

    // Start the game
    init();
});
