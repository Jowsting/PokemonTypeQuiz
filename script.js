let pokemonTypes = []; // Will now hold an array of types

function loadRandomPokemon() {
    document.getElementById('result').innerText = "";

    const randomId = Math.floor(Math.random() * 151) + 1;

    fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}/`)
        .then(response => response.json())
        .then(data => {
            const imageUrl = data.sprites.front_default;
            const pokemonName = data.name;
            pokemonTypes = data.types.map(t => t.type.name);

            document.getElementById('pokemonImage').src = imageUrl;
            document.getElementById('pokemonName').innerText = pokemonTypes.length > 1 ?
                `What types does ${pokemonName} have?` :
                `What type does ${pokemonName} have?`;
        });
}

const typeButtons = document.querySelectorAll('.type-button');
typeButtons.forEach(button => {
    button.addEventListener('click', function () {
        const activeButtons = document.querySelectorAll('.type-button.active');

        // If the Pokémon has a single type, ensure only one button can be selected
        if (pokemonTypes.length === 1 && activeButtons.length === 1 && !this.classList.contains('active')) {
            return;
        }

        if (!this.classList.contains('active') && activeButtons.length < 2) {
            this.classList.add('active');
        } else {
            this.classList.remove('active');
        }
    });
});

document.getElementById('submitAnswer').addEventListener('click', function () {
    const activeButtons = document.querySelectorAll('.type-button.active');

    if (pokemonTypes.length === 2 && activeButtons.length !== 2) {
        alert('Please select two types before submitting.');
        return;
    }

    if (activeButtons.length === 0) {
        alert('Please select a type before submitting.');
        return;
    }

    const selectedTypes = Array.from(activeButtons).map(button => button.getAttribute('data-type'));
    checkAnswer(selectedTypes);
    activeButtons.forEach(button => button.classList.remove('active'));
});

function checkAnswer(selectedTypes) {
    const isCorrect = selectedTypes.every(type => pokemonTypes.includes(type));

    if (isCorrect) {
        document.getElementById('result').innerText = "Correct!";
    } else {
        document.getElementById('result').innerText = "Wrong! Try again.";
    }

    setTimeout(loadRandomPokemon, 2000);
}


window.onload = loadRandomPokemon;
