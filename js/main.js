document.addEventListener('DOMContentLoaded', () => {
    const gameItems = document.querySelectorAll('#game-select-screen li');
    let selectedIndex = 0;

    function updateSelection() {
        gameItems.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function navigateToGame() {
        const selectedGame = gameItems[selectedIndex];
        if (selectedGame) {
            const link = selectedGame.querySelector('a');
            if (link && link.href) {
                window.location.href = link.href;
            }
        }
    }

    // --- Sound Placeholder ---
    function playSound(soundName) {
        console.log(`Playing sound: ${soundName}`);
        // Example for actual sound (optional, if URLs are found):
        // const sounds = {
        //     'navigate': 'path/to/navigate.wav',
        //     'confirm': 'path/to/confirm.wav'
        // };
        // if (sounds[soundName]) {
        //     new Audio(sounds[soundName]).play().catch(e => console.error("Error playing sound:", e));
        // }
    }

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                selectedIndex = (selectedIndex - 1 + gameItems.length) % gameItems.length;
                updateSelection();
                playSound('navigate');
                break;
            case 'ArrowDown':
                selectedIndex = (selectedIndex + 1) % gameItems.length;
                updateSelection();
                playSound('navigate');
                break;
            case 'Enter':
                playSound('confirm');
                navigateToGame(); // navigateToGame is called here
                break;
        }
    });

    // Initial selection
    updateSelection();
});
