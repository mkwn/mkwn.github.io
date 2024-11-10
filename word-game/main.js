// main.js

// ---------------------------
// Configuration and Constants
// ---------------------------

// Define German substitutions
const germanSubstitutions = {
    'ä': ['ae', 'a'],
    'ö': ['oe', 'o'],
    'ü': ['ue', 'u'],
    'ß': ['ss']
};

// Initialize variantToBase object
const variantToBase = {}; // Structure: { 'de': { 'straße': 'straße', 'strasse': 'straße', ... }, 'countries': { 'czechia': 'czechia', 'czech republic': 'czechia', ... }, ... }

// ---------------------------
// Utility Functions
// ---------------------------

/**
 * Generates all valid variants of a German word based on substitution rules.
 * @param {string} word - The original German word.
 * @returns {string[]} - An array of word variants.
 */
function generateGermanVariants(word) {
    let variants = [word];
    console.log(`Generating variants for word: ${word}`);

    for (const [char, replacements] of Object.entries(germanSubstitutions)) {
        if (word.includes(char)) {
            console.log(`Found character '${char}' in word '${word}'. Applying replacements: ${replacements}`);
            const tempVariants = [];
            for (const variant of variants) {
                for (const replacement of replacements) {
                    const newVariant = variant.split(char).join(replacement);
                    console.log(`Replacing '${char}' with '${replacement}' in '${variant}' -> '${newVariant}'`);
                    tempVariants.push(newVariant);
                }
            }
            variants = variants.concat(tempVariants);
        }
    }

    // Remove duplicates
    const uniqueVariants = Array.from(new Set(variants));
    console.log(`Generated variants: ${uniqueVariants}`);
    return uniqueVariants;
}

/**
 * Loads a word list into the wordSets and variantToBase objects.
 * @param {string} lang - The language code (e.g., 'en', 'de', 'countries').
 * @param {Array} words - The array of words or country objects for the language.
 */
function loadWordList(lang, words) {
    if (!Array.isArray(words)) {
        console.error(`Word list for language '${lang}' is not an array.`);
        return;
    }

    // Initialize variantToBase for the language
    variantToBase[lang] = {};

    let normalizedWords = [];

    // Special handling for 'countries' since it's an array of objects with base and variants
    if (lang === 'countries') {
        words.forEach(country => {
            const base = country.base.toLowerCase();
            const variants = country.variants.map(variant => variant.toLowerCase());
            variants.forEach(variant => {
                variantToBase[lang][variant] = base; // Map each variant to the base
            });
            normalizedWords.push(base, ...variants);
        });
    }
    // Apply German substitutions if language is German
    else if (lang === 'de') {
        normalizedWords = words.map(word => word.toLowerCase());
        const allVariants = [];
        normalizedWords.forEach(word => {
            const variants = generateGermanVariants(word);
            allVariants.push(...variants);

            // Map each variant to the base word
            variants.forEach(variant => {
                variantToBase[lang][variant] = word; // e.g., 'fuss' and 'fuß' both map to 'fuß'
            });
        });
        normalizedWords = allVariants;
    }
    // For other languages, simply map each word to itself
    else {
        normalizedWords = words.map(word => word.toLowerCase());
        normalizedWords.forEach(word => {
            variantToBase[lang][word] = word;
        });
    }

    // Initialize the word set
    wordSets[lang] = new Set(normalizedWords);
    console.log(`Loaded ${wordSets[lang].size} words for language: ${lang}`);
}

// ---------------------------
// Initialization
// ---------------------------

// Initialize wordSets object
const wordSets = {};

/**
 * Initializes word sets for all supported languages.
 */
function initializeWordSets() {
    // Mapping of language codes to their corresponding word list variables
    const languageWordLists = {
        'en': words_en,
        'de': words_de,
        'en4': words_en4,
        'us': words_us,
        'countries': words_countries
        // Add more languages and their corresponding word list variables here
    };

    for (const [lang, words] of Object.entries(languageWordLists)) {
        if (words) {
            console.log(`Loading word list for language: ${lang}`);
            loadWordList(lang, words);
        } else {
            console.warn(`Word list for language '${lang}' is not defined.`);
        }
    }

    console.log('All word sets initialized:', wordSets);
    console.log('Variant to Base Mapping:', variantToBase);
}

// Call initialization function
initializeWordSets();

// ---------------------------
// DOM Element References
// ---------------------------

const languageSelect = document.getElementById('language-select');
const timeSelect = document.getElementById('time-select');
const startButton = document.getElementById('start-button');
// const categorySelect = document.getElementById('category-select'); // If implementing categories
const inputContainer = document.getElementById('input-container');
const wordInput = document.getElementById('word-input');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const resultsContainer = document.getElementById('results'); // Container for results

// ---------------------------
// Game State Variables
// ---------------------------

let timer;                    // Reference to the timer
let timeLeft = 10;            // Time left in seconds (default)
let score = 0;                // User's score
let selectedLanguage = '';    // Currently selected language
let timePerWord = null;       // Time per word (null initially)
let currentWordSet = new Set(); // Current word set based on selected language and category
let usedWords = new Set();    // To track used base words
let enteredWords = [];        // To track all entered words
let warningThreshold = 3;     // Default warning threshold

// ---------------------------
// UI Update Functions
// ---------------------------

/**
 * Computes the warning threshold based on the total time per word.
 * @param {number} timePerWord - The total time allocated per word.
 * @returns {number} - The threshold time to start flashing.
 */
function computeWarningThreshold(timePerWord) {
    if (timePerWord <= 5) return 2;
    else return 3;
}

/**
 * Updates the state of the Start button based on selections.
 */
function updateStartButtonState() {
    // Start button is enabled only if both language and time per word are selected
    if (selectedLanguage && timePerWord) {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
}

/**
 * Updates the UI text based on the selected language.
 * Optional: Implement localization if needed.
 * @param {string} lang - The selected language code.
 */
function updateUIText(lang) {
    // Define UI text for each language
    const uiTexts = {
        en: {
            selectLanguage: "Select Word List",
            selectTime: "Select Time per Word",
            startGame: "Start Game",
            enterWord: "Enter a new word",
            timeLeft: "Time left",
            score: "Score",
            gameOver: "Game Over! Your score is",
            invalidWord: "is not a valid word in the selected word list. Try again!",
            duplicateWord: "has already been used. Enter a new word.",
            noWordsAvailable: "Selected language has no words available."
        },
        de: {
            selectLanguage: "Wortliste wählen",
            selectTime: "Zeit pro Wort wählen",
            startGame: "Spiel starten",
            enterWord: "Gib ein neues Wort ein",
            timeLeft: "Verbleibende Zeit",
            score: "Punktzahl",
            gameOver: "Spiel vorbei! Deine Punktzahl ist",
            invalidWord: "ist kein gültiges Wort in der ausgewählten Wortliste. Versuch es erneut!",
            duplicateWord: "wurde bereits verwendet. Gib ein neues Wort ein.",
            noWordsAvailable: "Für die ausgewählte Sprache sind keine Wörter verfügbar."
        }
        // Add more languages as needed
    };

    const texts = uiTexts[lang] || uiTexts['en']; // Fallback to English

    // Update placeholders and button texts
    languageSelect.options[0].text = texts.selectLanguage;
    timeSelect.options[0].text = texts.selectTime;
    startButton.textContent = texts.startGame;
    wordInput.placeholder = texts.enterWord;
    // Update other texts if implementing categories or localization
}

/**
 * Updates the timer display.
 */
function updateTimerDisplay() {
    timerDisplay.textContent = `Time left: ${timeLeft}s`;
}

/**
 * Updates the score display.
 */
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 */
function displayMessage(message) {
    messageDisplay.textContent = message;
}

/**
 * Clears the user input field.
 */
function clearInput() {
    wordInput.value = '';
}

/**
 * Adds a flash effect to an element.
 * @param {HTMLElement} element - The element to flash.
 */
function flashElement(element) {
    element.classList.add('flash');
    setTimeout(() => {
        element.classList.remove('flash');
    }, 500);
}

/**
 * Displays the list of entered words at the end of the game.
 */
function displayResults() {
    if (!resultsContainer) return;

    if (enteredWords.length === 0) {
        resultsContainer.innerHTML = '<p>No words were entered.</p>';
        return;
    }

    // Create a list of entered words
    const list = document.createElement('ul');
    enteredWords.forEach(word => {
        const listItem = document.createElement('li');
        listItem.textContent = word;
        list.appendChild(listItem);
    });

    resultsContainer.innerHTML = '<h2>Words Entered:</h2>';
    resultsContainer.appendChild(list);
}

// ---------------------------
// Game Control Functions
// ---------------------------

/**
 * Resets the game to its initial state.
 */
function resetGame() {
    score = 0;
    updateScoreDisplay();
    displayMessage('');
    usedWords.clear(); // Clear used base words
    enteredWords = []; // Reset entered words
    clearInput();      // Clear the input field
    warningThreshold = computeWarningThreshold(timePerWord); // Set threshold
    resetTimer();
    resultsContainer.innerHTML = ''; // Clear previous results
    // Remove warning class if present
    timerDisplay.classList.remove('warning');
}

/**
 * Resets and starts the timer.
 */
function resetTimer() {
    clearInterval(timer);
    timeLeft = timePerWord;
    updateTimerDisplay();
    // Remove warning class if present
    timerDisplay.classList.remove('warning');
    timer = setInterval(updateTimer, 1000);
}

/**
 * Updates the timer every second.
 */
function updateTimer() {
    timeLeft--;
    updateTimerDisplay();

    // Check if time is almost up
    if (timeLeft === warningThreshold) {
        timerDisplay.classList.add('warning');
    }

    if (timeLeft <= 0) {
        endGame();
    }
}

/**
 * Ends the game and displays the final score and entered words.
 */
function endGame() {
    clearInterval(timer);
    inputContainer.style.display = 'none';
    displayMessage(`Game Over! Your score is ${score}.`);
    clearInput(); // Clear the input field
    startButton.style.display = 'block';
    languageSelect.disabled = false;
    timeSelect.disabled = false;
    displayResults(); // Display the list of entered words
    // Remove warning class if present
    timerDisplay.classList.remove('warning');
    // If implementing high scores, update them here
}

/**
 * Handles user input when the Enter key is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleInput(event) {
    if (event.key === 'Enter') {
        const word = wordInput.value.trim().toLowerCase();
        if (word === '') {
            // Do nothing for empty input
            return;
        }

        // Get the base word using variantToBase
        const baseWord = variantToBase[selectedLanguage]?.[word];

        if (!baseWord) {
            // Invalid word
            const uiTexts = getUIText(selectedLanguage);
            displayMessage(`"${word}" ${uiTexts.invalidWord}`);
            clearInput();
            return;
        }

        if (usedWords.has(baseWord)) {
            // Duplicate word
            const uiTexts = getUIText(selectedLanguage);
            displayMessage(`"${word}" ${uiTexts.duplicateWord}`);
            clearInput();
            return;
        }

        // Valid and new word
        score++;
        updateScoreDisplay();
        usedWords.add(baseWord);
        enteredWords.push(word); // Track the entered word
        clearInput();
        displayMessage('');
        flashElement(scoreDisplay);
        resetTimer();
    }
}

/**
 * Retrieves UI text based on the selected language.
 * @param {string} lang - The language code.
 * @returns {object} - The UI text object.
 */
function getUIText(lang) {
    const uiTexts = {
        en: {
            invalidWord: "is not a valid word in the selected language. Try again!",
            duplicateWord: "has already been used. Enter a new word."
        },
        de: {
            invalidWord: "ist kein gültiges Wort in der ausgewählten Sprache. Versuch es erneut!",
            duplicateWord: "wurde bereits verwendet. Gib ein neues Wort ein."
        },
        es: {
            invalidWord: "no es una palabra válida en el idioma seleccionado. ¡Inténtalo de nuevo!",
            duplicateWord: "ya ha sido usada. Ingresa una nueva palabra."
        },
        fr: {
            invalidWord: "n'est pas un mot valide dans la langue sélectionnée. Essayez encore!",
            duplicateWord: "a déjà été utilisé. Entrez un nouveau mot."
        },
        countries: {
            invalidWord: "is not a valid country name. Try again!",
            duplicateWord: "has already been used. Enter a new country."
        }
        // Add more languages as needed
    };

    return uiTexts[lang] || uiTexts['en'];
}

// ---------------------------
// Event Listeners
// ---------------------------

// Language Selection
languageSelect.addEventListener('change', () => {
    selectedLanguage = languageSelect.value;
    updateUIText(selectedLanguage);
    timeSelect.disabled = false; // Enable time selection after language is chosen
    timeSelect.value = ''; // Reset time selection
    usedWords.clear(); // Clear used base words
    enteredWords = []; // Reset entered words
    resultsContainer.innerHTML = ''; // Clear previous results
    clearInput(); // Clear input field
    // Remove warning class if present
    timerDisplay.classList.remove('warning');

    if (wordSets[selectedLanguage]) {
        currentWordSet = wordSets[selectedLanguage];
        console.log(`Using already loaded words for language: ${selectedLanguage}`);
    } else {
        console.error(`Word list for language "${selectedLanguage}" not found.`);
        displayMessage('Selected language has no words available.');
        currentWordSet = new Set();
    }

    updateStartButtonState();
});

// Time Selection
timeSelect.addEventListener('change', () => {
    const selectedTime = parseInt(timeSelect.value, 10);
    if (!isNaN(selectedTime) && selectedTime > 0) {
        timePerWord = selectedTime;
    } else {
        // Invalid selection, set to null to prevent starting the game
        timePerWord = null;
    }
    updateStartButtonState();
});

// Start Game Button
startButton.addEventListener('click', () => {
    if (!currentWordSet || currentWordSet.size === 0) {
        displayMessage('Selected language has no words available.');
        return;
    }
    startButton.style.display = 'none';
    languageSelect.disabled = true; // Disable language selection during the game
    timeSelect.disabled = true;     // Disable time selection during the game
    inputContainer.style.display = 'block';
    wordInput.focus();
    resetGame();
});

// Word Input
wordInput.addEventListener('keydown', handleInput);

// ---------------------------
// Initial UI Setup
// ---------------------------

// Optional: Set default UI texts based on a default language (e.g., English)
updateUIText('en');

