// ----------------- Global Variables -----------------
let pokemonTypes = [];
let currentPool = [];
let allSelectedPokemon = [];
let selectedCheckboxesOrder = [];
let pokemonCache = {};
let nextOpenSlot = 1;
let score = 0;
let streak = 0;

// ----------------- Dark Mode ------------------
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});

const currentTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : "dark";
if (currentTheme === "dark") {
    body.classList.add("dark-mode");
}


// ----------------- Pokemon Loading and Display Logic -----------------
async function loadRandomPokemon() {
    if (allSelectedPokemon.length === 0) {
        alert('Please select at least one generation.');
        return;
    }

    document.getElementById('result').innerText = "";
    resetTypeImages();
    nextOpenSlot = 1;
    selectedCheckboxesOrder = [];

    const randomIndex = Math.floor(Math.random() * allSelectedPokemon.length);
    const selectedPokemonId = allSelectedPokemon[randomIndex];
    const selectedPokemonData = await getPokemonDetails(selectedPokemonId);

    loadPokemon(selectedPokemonData);
}

function loadPokemon(selectedPokemonData) {
    const imageUrl = selectedPokemonData.sprites.front_default;
    const pokemonName = selectedPokemonData.name;
    pokemonTypes = selectedPokemonData.types.map(t => t.type.name);
    console.log("Expected Types:", pokemonTypes);

    document.getElementById('pokemonImage').src = imageUrl;
    document.getElementById('pokemonName').innerText = pokemonTypes.length > 1 ?
        `What types does ${pokemonName} have?` :
        `What type does ${pokemonName} have?`;

    const type2ButtonVisibility = pokemonTypes.length > 1 ? 'visible' : 'hidden';
    document.getElementById('type2Button').style.visibility = type2ButtonVisibility;
}

async function getPokemonDetails(id) {
    if (pokemonCache[id]) {
        return pokemonCache[id];
    }

    const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`).then(res => res.json());
    pokemonData.name = capitalize(pokemonData.name);

    pokemonCache[id] = pokemonData;
    return pokemonData;
}

function capitalize(str) {
    return str.split('-').map(part =>
        part.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    ).join(' ');
}

// ----------------- Generation Selection Logic -----------------
document.getElementById('genSelectContainer').addEventListener('change', function () {
    const selectedGens = [];
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.getElementById(`gen${i}`);
        if (checkbox.checked) {
            selectedGens.push(i);
        }
    }
    fetchPokemonsForGenerations(selectedGens);
});

const generationRanges = {
    1: { start: 1, end: 151 },
    2: { start: 152, end: 251 },
    3: { start: 252, end: 386 },
    4: { start: 387, end: 493 },
    5: { start: 494, end: 649 },
    6: { start: 650, end: 721 },
    7: { start: 722, end: 809 },
    8: { start: 810, end: 905 },
    9: { start: 906, end: 1017 }
};

async function fetchPokemonsForGenerations(selectedGens) {
    localStorage.setItem('selectedGenerations', JSON.stringify(selectedGens));
    allSelectedPokemon = [];

    for (let gen of selectedGens) {
        const range = generationRanges[gen];
        for (let id = range.start; id <= range.end; id++) {
            allSelectedPokemon.push(id);
        }
    }
}

function updateGenerationSelection(selectedGens) {
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.getElementById(`gen${i}`);
        checkbox.checked = selectedGens.includes(i);
    }
    fetchPokemonsForGenerations(selectedGens);
}

// ----------------- Checkbox Logic -----------------
const typeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]');
typeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        if (this.checked) {
            selectedCheckboxesOrder.push(this);
            if (selectedCheckboxesOrder.length > 2) {
                const uncheckedCheckbox = selectedCheckboxesOrder.shift();
                uncheckedCheckbox.checked = false;
            }
        } else {
            const index = selectedCheckboxesOrder.indexOf(this);
            if (index > -1) {
                selectedCheckboxesOrder.splice(index, 1);
            }
        }
        updateSelectedTypeImages(selectedCheckboxesOrder);
    });
});


function updateSelectedTypeImages(selectedCheckboxes) {
    //console.log(selectedCheckboxes);
    resetTypeImages();

    if (selectedCheckboxes.length >= 1) {
        const type1Image = getTypeImageFromCheckbox(selectedCheckboxes[0]);
        document.querySelector('#type1Button img').src = type1Image;
    }

    if (selectedCheckboxes.length === 2) {
        const type2Image = getTypeImageFromCheckbox(selectedCheckboxes[1]);
        document.querySelector('#type2Button img').src = type2Image;
    }
}

function resetTypeImages() {
    const btn1 = document.querySelector('#type1Button img');
    btn1.src = "type_images/UnknownTypeButton.png";
    btn1.style.filter = 'brightness(100%)';
    const btn2 = document.querySelector('#type2Button img');
    btn2.src = "type_images/UnknownTypeButton.png";
    btn2.style.filter = 'brightness(100%)';
    hideCorrectTypes('hidden', 2);
}


function getTypeImageFromCheckbox(checkbox) {
    const typeName = checkbox.value;
    return `type_images/${typeName}TypeButton.png`;
}

document.getElementById('submitAnswer').addEventListener('click', function () {
    if (allSelectedPokemon.length === 0) {
        alert('Please select at least one generation before submitting.');
        return false;
    }

    if (pokemonTypes.length === 2 && selectedCheckboxesOrder.length !== 2) {
        alert('Please select two types before submitting.');
        return;
    }

    if (selectedCheckboxesOrder.length === 0) {
        alert('Please select a type before submitting.');
        return;
    }

    const selectedTypes = selectedCheckboxesOrder.map(checkbox => checkbox.getAttribute('id'));
    checkAnswer(selectedTypes);

    selectedCheckboxesOrder.forEach(checkbox => checkbox.checked = false);
    fetchPokemonsForGenerations(getSelectedGenerations());
    setTimeout(loadRandomPokemon, 3000);
});

async function checkAnswer(selectedTypes) {
    console.log("Selected Types:", selectedTypes);

    hideCorrectTypes('hidden', pokemonTypes.length);

    const ticks = document.querySelectorAll('.answerTick');
    ticks.forEach(tick => {
        tick.src = `settings_images/cross.png`;
    });

    const imagePromises = [];
    const correctTypes = document.querySelectorAll('.correctAnswerType');
    for (var i = 0; i < pokemonTypes.length; i++) {
        const imgSrc = `type_images/${capitalize(pokemonTypes[i])}TypeButton.png`;
        const imagePromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.src = imgSrc;
        });
        imagePromises.push(imagePromise);
        correctTypes[i].src = imgSrc;
        let index = pokemonTypes.indexOf(selectedTypes[i]);
        let brightness = findCorrectTypes(index);
        document.querySelector(`#type${i + 1}Button img`).style.filter = `brightness(${brightness}%)`;
        let scoreIncrease = index != -1 ? 1 / pokemonTypes.length : 0;
        score += scoreIncrease;
    }
    updateScore();

    await Promise.all(imagePromises);

    hideCorrectTypes('visible', pokemonTypes.length);
}

function findCorrectTypes(index) {
    if (index === -1) { return 50; }
    const answerTick = document.querySelector(`#answerTick${index + 1}`);
    answerTick.src = `settings_images/checkmark.png`;
    return 100;
}

function hideCorrectTypes(visibility, amount) {
    const answerImages = Array.from(document.querySelectorAll('.answerImage'));
    for (var i = 0; i < amount; i++) {
        const answerElement = answerImages[i];
        const children = Array.from(answerElement.children);
        const correctAnswer = children[0];
        const answerTick = children[1];
        correctAnswer.style.visibility = visibility;
        answerTick.style.visibility = visibility;
    }
}

function updateScore() {
    document.getElementById('score').innerHTML = score;
}

function getSelectedGenerations() {
    const selectedGens = [];
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.getElementById(`gen${i}`);
        if (checkbox.checked) {
            selectedGens.push(i);
        }
    }
    return selectedGens;
}

// ----------------- Select/Deselect All Logic -----------------
document.getElementById('selectAll').addEventListener('click', function () {
    updateGenerationSelection([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

document.getElementById('deselectAll').addEventListener('click', function () {
    console.log("Deselect all clicked");
    updateGenerationSelection([]);
});

function setAllCheckboxes(state) {
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.getElementById(`gen${i}`);
        checkbox.checked = state;
    }
}

// ----------------- Initialization -----------------
window.onload = async function () {
    document.getElementById('type2Button').style.visibility = 'hidden';
    const typeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    const savedGens = JSON.parse(localStorage.getItem('selectedGenerations'));
    if (savedGens && savedGens.length > 0) {
        for (let i = 1; i <= 9; i++) {
            document.getElementById(`gen${i}`).checked = savedGens.includes(i);
        }
        await fetchPokemonsForGenerations(savedGens); 
    } else {
        console.log("No saved data found. Defaulting to gen 1...")
        setAllCheckboxes(false);
        document.getElementById('gen1').checked = true;
        await fetchPokemonsForGenerations([1]);  
    }
    loadRandomPokemon();
};

// -------------- Console Commands -----------------
async function setCurrentPokemon(pokemonName) {
    if (!pokemonName || typeof pokemonName !== 'string') {
        console.error('Please provide a valid pokemon name.');
        return;
    }

    document.getElementById('result').innerText = "";
    const selectedPokemonData = await getPokemonDetails(pokemonName);

    if (!selectedPokemonData) {
        console.error(`Could not fetch details for ${pokemonName}`);
        return;
    }

    loadPokemon(selectedPokemonData);
}

// Exposing the function to window for console access
window.setCurrentPokemon = setCurrentPokemon;

