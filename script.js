// ----------------- Global Variables -----------------
let pokemonTypes = [];
let currentPool = [];
let allSelectedPokemon = [];
let pokemonCache = {};

// ----------------- Pokemon Loading and Display Logic -----------------
async function loadRandomPokemon() {
    if (allSelectedPokemon.length === 0) {
        alert('Please select at least one generation.');
        return;
    }

    document.getElementById('result').innerText = "";

    const randomIndex = Math.floor(Math.random() * allSelectedPokemon.length);
    const selectedPokemonId = allSelectedPokemon[randomIndex];
    const selectedPokemonData = await getPokemonDetails(selectedPokemonId);

    const imageUrl = selectedPokemonData.sprites.front_default;
    const pokemonName = selectedPokemonData.name;
    pokemonTypes = selectedPokemonData.types.map(t => t.type.name);

    document.getElementById('pokemonImage').src = imageUrl;
    document.getElementById('pokemonName').innerText = pokemonTypes.length > 1 ?
        `What types does ${pokemonName} have?` :
        `What type does ${pokemonName} have?`;
}

function checkAnswer(selectedTypes) {
    console.log("Expected Types:", pokemonTypes);
    console.log("Selected Types:", selectedTypes);
    const isCorrect = selectedTypes.every(type => pokemonTypes.includes(type));

    if (isCorrect) {
        document.getElementById('result').innerText = "Correct!";
    } else {
        document.getElementById('result').innerText = "Wrong! Try again.";
    }
}

async function getPokemonDetails(id) {
    if (pokemonCache[id]) {
        return pokemonCache[id];
    }

    const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`).then(res => res.json());
    pokemonCache[id] = pokemonData;
    return pokemonData;
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
    // Save to localStorage
    localStorage.setItem('selectedGenerations', JSON.stringify(selectedGens));
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
    allSelectedPokemon = [];

    for (let gen of selectedGens) {
        const range = generationRanges[gen];
        for (let id = range.start; id <= range.end; id++) {
            allSelectedPokemon.push(id);
        }
    }
    console.log("allSelectedPokemon: " + allSelectedPokemon.length + "\n" + allSelectedPokemon);
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
        const activeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]:checked');

        if (pokemonTypes.length === 1 && activeCheckboxes.length > 1) {
            this.checked = false;
            return;
        }

        if (pokemonTypes.length === 2 && activeCheckboxes.length > 2) {
            this.checked = false;
            return;
        }
    });
});

document.getElementById('submitAnswer').addEventListener('click', function () {
    if (allSelectedPokemon.length === 0) {
        alert('Please select at least one generation before submitting.');
        return false;
    }

    console.log("After return, before everything else.");

    const activeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]:checked');

    if (pokemonTypes.length === 2 && activeCheckboxes.length !== 2) {
        alert('Please select two types before submitting.');
        return;
    }

    if (activeCheckboxes.length === 0) {
        alert('Please select a type before submitting.');
        return;
    }

    const selectedTypes = Array.from(activeCheckboxes).map(checkbox => checkbox.getAttribute('value'));
    checkAnswer(selectedTypes);
    activeCheckboxes.forEach(checkbox => checkbox.checked = false);
    fetchPokemonsForGenerations(getSelectedGenerations());
    setTimeout(loadRandomPokemon, 2000);
});

// Function to get currently selected generations:
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
    const typeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Load the saved generation selections or default to Gen 1
    const savedGens = JSON.parse(localStorage.getItem('selectedGenerations'));
    if (savedGens && savedGens.length > 0) {
        for (let i = 1; i <= 9; i++) {
            document.getElementById(`gen${i}`).checked = savedGens.includes(i);
        }
        await fetchPokemonsForGenerations(savedGens);  // Add await here to ensure it completes
    } else {
        // Default to Gen 1
        console.log("No saved data found. Defaulting to gen 1...")
        setAllCheckboxes(false);
        document.getElementById('gen1').checked = true;
        await fetchPokemonsForGenerations([1]);  // Add await here to ensure it completes
    }
    loadRandomPokemon();
};
