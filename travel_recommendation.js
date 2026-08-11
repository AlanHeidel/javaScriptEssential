const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('btnSearch');
const clearButton = document.getElementById('btnClear');
const resultsContainer = document.getElementById('result');

const countryTimeZones = {
  Australia: 'Australia/Sydney',
  Japan: 'Asia/Tokyo',
  Brazil: 'America/Sao_Paulo'
};

let travelData = null;

async function loadTravelData() {
  if (travelData) {
    return travelData;
  }

  const response = await fetch('./travel_recommendation_api.json');

  if (!response.ok) {
    throw new Error(`Could not load travel data (${response.status})`);
  }

  travelData = await response.json();
  console.log('Travel recommendation data:', travelData);
  return travelData;
}

function normalizeKeyword(value) {
  return value.trim().toLowerCase();
}

function getCountryTime(countryName) {
  const timeZone = countryTimeZones[countryName];

  if (!timeZone) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date());
}

function findRecommendations(data, keyword) {
  const keywordAliases = {
    beach: 'beach',
    beaches: 'beach',
    temple: 'temple',
    temples: 'temple',
    country: 'country',
    countries: 'country'
  };
  const singularKeyword = keywordAliases[keyword] || keyword;

  if (singularKeyword === 'beach') {
    return data.beaches.map((place) => ({ ...place, category: 'Beach' }));
  }

  if (singularKeyword === 'temple') {
    return data.temples.map((place) => ({ ...place, category: 'Temple' }));
  }

  if (singularKeyword === 'country') {
    return data.countries.flatMap((country) =>
      country.cities.map((city) => ({
        ...city,
        category: country.name,
        localTime: getCountryTime(country.name)
      }))
    );
  }

  const matchingCountry = data.countries.find((country) =>
    country.name.toLowerCase() === keyword
  );

  if (matchingCountry) {
    return matchingCountry.cities.map((city) => ({
      ...city,
      category: matchingCountry.name,
      localTime: getCountryTime(matchingCountry.name)
    }));
  }

  return [];
}

function createRecommendationCard(place) {
  const article = document.createElement('article');
  article.className = 'result-card';

  const image = document.createElement('img');
  image.src = place.imageUrl;
  image.alt = `View of ${place.name}`;
  image.loading = 'lazy';

  const content = document.createElement('div');
  content.className = 'result-card-content';

  const meta = document.createElement('p');
  meta.className = 'result-meta';
  meta.textContent = place.localTime
    ? `${place.category} | Local time: ${place.localTime}`
    : place.category;

  const title = document.createElement('h2');
  title.textContent = place.name;

  const description = document.createElement('p');
  description.textContent = place.description;

  content.append(meta, title, description);
  article.append(image, content);
  return article;
}

function showMessage(message) {
  resultsContainer.replaceChildren();
  const messageElement = document.createElement('p');
  messageElement.className = 'result-message';
  messageElement.textContent = message;
  resultsContainer.append(messageElement);
  resultsContainer.classList.add('visible');
}

async function searchRecommendations() {
  const keyword = normalizeKeyword(searchInput.value);

  if (!keyword) {
    showMessage('Enter beach, temple, country, or a country name to begin.');
    return;
  }

  showMessage('Finding places for you...');

  try {
    const data = await loadTravelData();
    const recommendations = findRecommendations(data, keyword);

    if (recommendations.length === 0) {
      showMessage('No matches found. Try beach, temple, country, Australia, Japan, or Brazil.');
      return;
    }

    const cards = recommendations.map(createRecommendationCard);
    resultsContainer.replaceChildren(...cards);
    resultsContainer.classList.add('visible');
  } catch (error) {
    console.error(error);
    showMessage('The recommendations could not be loaded. Run the project with a local server and try again.');
  }
}

function clearResults() {
  searchInput.value = '';
  resultsContainer.replaceChildren();
  resultsContainer.classList.remove('visible');
  searchInput.focus();
}

searchButton.addEventListener('click', searchRecommendations);
clearButton.addEventListener('click', clearResults);

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchRecommendations();
  }
});

loadTravelData().catch((error) => console.error(error));
