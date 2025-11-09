document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const questionScreen = document.getElementById('question-screen');
    const guessScreen = document.getElementById('guess-screen');
    const endScreen = document.getElementById('end-screen');

    const startBtn = document.getElementById('start-btn');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const correctBtn = document.getElementById('correct-btn');
    const wrongBtn = document.getElementById('wrong-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    const questionText = document.getElementById('question-text');
    const guessText = document.getElementById('guess-text');
    const endText = document.getElementById('end-text');

    const items = [
        { name: 'an apple', properties: { isFruit: true, isRed: true, isSweet: true, isCrunchy: true } },
        { name: 'a banana', properties: { isFruit: true, isYellow: true, isSweet: true, isLong: true } },
        { name: 'a computer', properties: { isElectronic: true, hasScreen: true, isUsedForWork: true, isMetal: true } },
        { name: 'a dog', properties: { isAnimal: true, hasFourLegs: true, isMammal: true, barks: true, isPet: true } },
        { name: 'a cat', properties: { isAnimal: true, hasFourLegs: true, isMammal: true, meows: true, isPet: true } },
        { name: 'a car', properties: { isVehicle: true, hasWheels: true, isMetal: true, isUsedForTransport: true } },
        { name: 'a book', properties: { isObject: true, isMadeOfPaper: true, hasWords: true, isRectangular: true } },
        { name: 'a tree', properties: { isPlant: true, isTall: true, hasLeaves: true, isWoody: true } },
        { name: 'a phone', properties: { isElectronic: true, hasScreen: true, isUsedForCommunication: true, isPortable: true } },
        { name: 'a chair', properties: { isFurniture: true, hasFourLegs: true, isUsedForSitting: true, isWoody: false } },
    ];

    const questions = [
        { property: 'isFruit', text: 'Is it a fruit?' },
        { property: 'isAnimal', text: 'Is it an animal?' },
        { property: 'isElectronic', text: 'Is it electronic?' },
        { property: 'isVehicle', text: 'Is it a vehicle?' },
        { property: 'isObject', text: 'Is it an object?' },
        { property: 'isPlant', text: 'Is it a plant?' },
        { property: 'isFurniture', text: 'Is it a piece of furniture?' },
        { property: 'isRed', text: 'Is it red?' },
        { property: 'isYellow', text: 'Is it yellow?' },
        { property: 'isSweet', text: 'Is it sweet?' },
        { property: 'isLong', text: 'Is it long?' },
        { property: 'hasScreen', text: 'Does it have a screen?' },
        { property: 'isUsedForWork', text: 'Is it used for work?' },
        { property: 'hasFourLegs', text: 'Does it have four legs?' },
        { property: 'isMammal', text: 'Is it a mammal?' },
        { property: 'barks', text: 'Does it bark?' },
        { property: 'meows', text: 'Does it meow?' },
        { property: 'isPet', text: 'Is it a pet?' },
        { property: 'hasWheels', text: 'Does it have wheels?' },
        { property: 'isMetal', text: 'Is it made of metal?' },
        { property: 'isUsedForTransport', text: 'Is it used for transport?' },
    ];

    let possibleItems = [...items];
    let currentQuestionIndex = 0;

    function startGame() {
        startScreen.classList.add('hidden');
        questionScreen.classList.remove('hidden');
        possibleItems = [...items];
        currentQuestionIndex = 0;
        askQuestion();
    }

    function askQuestion() {
        if (currentQuestionIndex < questions.length && possibleItems.length > 1 && currentQuestionIndex < 20) {
            questionText.textContent = questions[currentQuestionIndex].text;
        } else {
            makeGuess();
        }
    }

    function handleAnswer(answer) {
        const currentQuestion = questions[currentQuestionIndex];
        possibleItems = possibleItems.filter(item => {
            return item.properties[currentQuestion.property] === answer;
        });
        currentQuestionIndex++;
        askQuestion();
    }

    function makeGuess() {
        questionScreen.classList.add('hidden');
        guessScreen.classList.remove('hidden');
        if (possibleItems.length === 1) {
            guessText.textContent = `Is it ${possibleItems[0].name}?`;
        } else {
            guessText.textContent = "I'm not sure what it is. You win!";
        }
    }

    function handleGuess(isCorrect) {
        guessScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');
        if (isCorrect) {
            endText.textContent = 'I guessed it! I am a genius!';
        } else {
            endText.textContent = 'You win! I could not guess your object.';
        }
    }

    function resetGame() {
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    startBtn.addEventListener('click', startGame);
    yesBtn.addEventListener('click', () => handleAnswer(true));
    noBtn.addEventListener('click', () => handleAnswer(false));
    correctBtn.addEventListener('click', () => handleGuess(true));
    wrongBtn.addEventListener('click', () => handleGuess(false));
    playAgainBtn.addEventListener('click', resetGame);
});
