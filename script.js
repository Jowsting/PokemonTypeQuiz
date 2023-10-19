// ----------------- Global Variables -----------------
let pokemonTypes = [];
let currentPool = [];
let allSelectedPokemon = [];
let selectedCheckboxesOrder = [];
let pokemonCache = {};
let nextOpenSlot = 1;

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

const currentTheme = localStorage.getItem("theme") ? localStorage.getItem("theme") : "light";
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

    document.getElementById('pokemonImage').src = imageUrl;
    document.getElementById('pokemonName').innerText = pokemonTypes.length > 1 ?
        `What types does ${pokemonName} have?` :
        `What type does ${pokemonName} have?`;

    const type2ButtonVisibility = pokemonTypes.length > 1 ? 'visible' : 'hidden';
    document.getElementById('type2Button').style.visibility = type2ButtonVisibility;


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
                const uncheckedCheckbox = selectedCheckboxesOrder.shift(); // remove the oldest one
                uncheckedCheckbox.checked = false;
            }
        } else {
            const index = selectedCheckboxesOrder.indexOf(this);
            if (index > -1) {
                selectedCheckboxesOrder.splice(index, 1); // remove it from the array
            }
        }
        updateSelectedTypeImages(selectedCheckboxesOrder);
    });
});


function updateSelectedTypeImages(selectedCheckboxes) {
    console.log(selectedCheckboxes);
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
    document.querySelector('#type1Button img').src = "type_images/UnknownTypeButton.png";
    document.querySelector('#type2Button img').src = "type_images/UnknownTypeButton.png";
}


function getTypeImageFromCheckbox(checkbox) {
    const typeName = checkbox.id;
    return `type_images/${typeName}TypeButton.png`;
}

document.getElementById('submitAnswer').addEventListener('click', function () {
    if (allSelectedPokemon.length === 0) {
        alert('Please select at least one generation before submitting.');
        return false;
    }

    const activeCheckboxes = document.querySelectorAll('.type-btn input[type="checkbox"]:checked');

    if (pokemonTypes.length === 2 && activeCheckboxes.length !== 2) {
        alert('Please select two types before submitting.');
        return;
    }

    if (activeCheckboxes.length === 0) {
        alert('Please select a type before submitting.');
        return;
    }

    const selectedTypes = Array.from(activeCheckboxes).map(checkbox => checkbox.getAttribute('id'));
    checkAnswer(selectedTypes);
    activeCheckboxes.forEach(checkbox => checkbox.checked = false);
    fetchPokemonsForGenerations(getSelectedGenerations());
    setTimeout(loadRandomPokemon, 2000);
});

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

    // Assuming getPokemonDetails can accept a Pokémon name instead of just an ID.
    // If not, you might need another function to convert a name to ID or modify the existing one.
    const selectedPokemonData = await getPokemonDetails(pokemonName);

    if (!selectedPokemonData) {
        console.error(`Could not fetch details for ${pokemonName}`);
        return;
    }

    loadPokemon(selectedPokemonData);
}

// Exposing the function to window for console access
window.setCurrentPokemon = setCurrentPokemon;

