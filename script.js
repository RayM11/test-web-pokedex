const btnSearch = document.getElementById("searchButton");
const inputSearch = document.getElementById("searchInput");
const pokemonList = document.getElementById("pokemonList");
const selectType = document.getElementById("typeSelect");
const selectArea = document.getElementById("areaSelect");
const searchForm = document.getElementById("searchForm");
const resetButton = document.getElementById("resetButton");
const loadMoreButton = document.getElementById("loadMoreButton");

let currentResults = [];   
let displayIndex = 0;      // actual reder index
const BATCH_SIZE = 24;

const types = ["Any", "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
const areas = ["Any", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Hisui", "Paldea"];

// Mapping area names to official API names
const areaToPokedex = {
  "Kanto": "kanto",
  "Johto": "original-johto",
  "Hoenn": "hoenn",
  "Sinnoh": "original-sinnoh",
  "Unova": "original-unova",
  "Kalos": "kalos-central",
  "Alola": "original-alola",
  "Galar": "galar",
  "Hisui": "hisui",
  "Paldea": "paldea"
};

// --------- Functions ---------

async function fetchPokemon(idOrName) {
  const key = idOrName.toString().toLowerCase();
  if (currentResults[key]) return currentResults[key];

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
  if (!res.ok) throw new Error("Not found");
  const data = await res.json();
  currentResults[key] = data;
  return data;
}

async function fetchRegionPokemons(regionName) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${regionName}`);
  if (!res.ok) throw new Error("Region not found");
  const data = await res.json();
  // Nos devuelve entradas con species (name)
  return data.pokemon_entries.map(entry => entry.pokemon_species.name);
}

function renderPokemon(pokemon) {
  const typeImgs = pokemon.types.map(typeInfo => {
    const typeId = typeInfo.type.url.split('/').slice(-2, -1)[0];
    return `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeId}.png" 
              alt="${typeInfo.type.name}" 
              title="${typeInfo.type.name}" 
              class="type-icon" />`;
  });

  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <div class="pokemon-card">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <h4>#${pokemon.id}</h4>
      <h4>${pokemon.name}</h4>
      <div class="types">${typeImgs.join("")}</div>
    </div>
  `;
  return listItem;
}

function renderBatch() {
  const batch = currentResults.slice(displayIndex, displayIndex + BATCH_SIZE);
  batch.forEach(p => pokemonList.appendChild(renderPokemon(p)));
  displayIndex += BATCH_SIZE;

  loadMoreButton.style.display = displayIndex < currentResults.length ? "block" : "none";
}

function showResults(results) {
  currentResults = results;
  displayIndex = 0;
  pokemonList.innerHTML = "";

  if (currentResults.length === 0) {
    pokemonList.innerHTML = "<li>There is no results</li>";
    loadMoreButton.style.display = "none";
    return;
  }
  renderBatch();
}

// --------- Events ---------

// Load More
loadMoreButton.addEventListener("click", () => {
  renderBatch();
});

// --- Reset ---
resetButton.addEventListener("click", () => {
  inputSearch.value = "";
  selectType.value = "Any";
  selectArea.value = "Any";
  // Estado default = búsqueda de Any + Any
  runDefaultSearch();
});


// Search by name/ID
btnSearch.addEventListener("click", async (e) => {
  e.preventDefault();
  const query = inputSearch.value.trim().toLowerCase();
  if (!query) return;

  try {
    const pokemon = await fetchPokemon(query);
    showResults([pokemon]);
  } catch {
    showResults([]);
  }
});


// Filter by type and region
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selectedType = selectType.value.toLowerCase();
  const selectedArea = selectArea.value;

  pokemonList.innerHTML = "<li>Cargando...</li>";

  let candidates = [];
  if (selectedArea !== "Any" && areaToPokedex[selectedArea]) {
    candidates = await fetchRegionPokemons(areaToPokedex[selectedArea]);
  } else {
    candidates = Array.from({ length: 200 }, (_, i) => i + 1); // default
  }

  const filtered = [];
  for (const name of candidates) {
    const p = await fetchPokemon(name);
    if (selectedType !== "any") {
      if (p.types.some(t => t.type.name === selectedType)) filtered.push(p);
    } else {
      filtered.push(p);
    }
    if (filtered.length >= BATCH_SIZE*4) break;
  }

  showResults(filtered);
});

// Init
function populateSelectOptions(selectElement, options) {
  selectElement.innerHTML = "";
  options.forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    selectElement.appendChild(opt);
  });
}

async function runDefaultSearch() {
  pokemonList.innerHTML = "<li>Cargando...</li>";

  const candidates = Array.from({length: 100}, (_, i) => i + 1);
  const results = [];
  for (const id of candidates) {
    const p = await fetchPokemon(id);
    results.push(p);
  }

  showResults(results);
}

populateSelectOptions(selectType, types);
populateSelectOptions(selectArea, areas);
runDefaultSearch();


