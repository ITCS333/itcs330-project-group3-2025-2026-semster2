/*
  list.js — Populates the "Weekly Course Breakdown" list page.
  Fetches all weeks from the API and renders one <article> per week.
*/

// --- Element Selections ---
const weekListSection = document.getElementById('week-list-section');

// --- Functions ---

/**
 * createWeekArticle
 * Builds and returns an <article> element for a single week object.
 *
 * @param {Object} week - { id, title, start_date, description, links }
 * @returns {HTMLElement} article
 */
function createWeekArticle(week) {
  const article = document.createElement('article');

  const h2 = document.createElement('h2');
  h2.textContent = week.title;

  const dateP = document.createElement('p');
  dateP.textContent = 'Starts on: ' + week.start_date;

  const descP = document.createElement('p');
  descP.textContent = week.description;

  const link = document.createElement('a');
  link.href = 'details.html?id=' + week.id;
  link.textContent = 'View Details & Discussion';

  article.appendChild(h2);
  article.appendChild(dateP);
  article.appendChild(descP);
  article.appendChild(link);

  // Stagger animation delay per card
  article.style.animationDelay = '0ms'; // overridden in loadWeeks

  return article;
}

/**
 * loadWeeks
 * Fetches all weeks from the API and populates #week-list-section.
 */
async function loadWeeks() {
  try {
    const response = await fetch('./api/index.php');

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to load weeks.');
    }

    // Clear loading placeholder
    weekListSection.innerHTML = '';

    if (json.data.length === 0) {
      weekListSection.innerHTML = '<p class="loading">No weeks found.</p>';
      return;
    }

    json.data.forEach((week, index) => {
      const article = createWeekArticle(week);
      // Stagger each card's fade-in
      article.style.animationDelay = (index * 60) + 'ms';
      weekListSection.appendChild(article);
    });

  } catch (error) {
    weekListSection.innerHTML =
      '<p class="error">Could not load weeks: ' + error.message + '</p>';
  }
}

// --- Initial Page Load ---
loadWeeks();