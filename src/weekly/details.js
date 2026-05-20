/*
  details.js — Populates the week detail page and handles the discussion forum.
  Linked to details.html via <script src="details.js" defer></script>
*/

// --- Global Data Store ---
let currentWeekId   = null;
let currentComments = [];

// --- Element Selections ---
const weekTitle       = document.getElementById('week-title');
const weekStartDate   = document.getElementById('week-start-date');
const weekDescription = document.getElementById('week-description');
const weekLinksList   = document.getElementById('week-links-list');
const commentList     = document.getElementById('comment-list');
const commentForm     = document.getElementById('comment-form');
const newCommentInput = document.getElementById('new-comment');

// --- Functions ---

/**
 * getWeekIdFromURL
 * Reads the 'id' query parameter from the current page URL.
 * e.g. details.html?id=3  →  returns "3"
 *
 * @returns {string|null}
 */
function getWeekIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * renderWeekDetails
 * Fills in all the week info elements with data from the API.
 *
 * @param {Object} week - { id, title, start_date, description, links }
 */
function renderWeekDetails(week) {
  weekTitle.textContent       = week.title;
  weekStartDate.textContent   = 'Starts on: ' + week.start_date;
  weekDescription.textContent = week.description;

  // Populate the links list
  weekLinksList.innerHTML = '';

  if (!week.links || week.links.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No resources listed for this week.';
    li.style.color = 'var(--muted)';
    li.style.fontSize = '0.9rem';
    weekLinksList.appendChild(li);
    return;
  }

  week.links.forEach(url => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = url;
    a.textContent = url;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    li.appendChild(a);
    weekLinksList.appendChild(li);
  });
}

/**
 * createCommentArticle
 * Builds and returns an <article> element for a single comment.
 *
 * @param {Object} comment - { id, week_id, author, text, created_at }
 * @returns {HTMLElement} article
 */
function createCommentArticle(comment) {
  const article = document.createElement('article');

  const p = document.createElement('p');
  p.textContent = comment.text;

  const footer = document.createElement('footer');
  footer.textContent = 'Posted by: ' + comment.author;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

/**
 * renderComments
 * Clears #comment-list and re-renders all comments in currentComments.
 */
function renderComments() {
  commentList.innerHTML = '';

  if (currentComments.length === 0) {
    const msg = document.createElement('p');
    msg.className   = 'no-comments';
    msg.textContent = 'No comments yet. Be the first to comment!';
    commentList.appendChild(msg);
    return;
  }

  currentComments.forEach(comment => {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

/**
 * handleAddComment
 * Handles the comment form submit event.
 * POSTs the new comment to the API and updates the UI on success.
 *
 * @param {Event} event
 */
async function handleAddComment(event) {
  event.preventDefault();

  const commentText = newCommentInput.value.trim();
  if (!commentText) return;

  try {
    const response = await fetch('./api/index.php?action=comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_id: parseInt(currentWeekId, 10),
        author:  'Student',
        text:    commentText
      })
    });

    const result = await response.json();

    if (result.success) {
      currentComments.push(result.data);
      renderComments();
      newCommentInput.value = '';
    } else {
      alert('Failed to post comment: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Could not post comment: ' + error.message);
  }
}

/**
 * initializePage
 * Entry point: reads the week ID from the URL, fetches data, renders the page.
 */
async function initializePage() {
  currentWeekId = getWeekIdFromURL();

  if (!currentWeekId) {
    weekTitle.textContent = 'Week not found.';
    return;
  }

  try {
    // Fetch week details and comments in parallel
    const [weekResponse, commentsResponse] = await Promise.all([
      fetch('./api/index.php?id=' + currentWeekId),
      fetch('./api/index.php?action=comments&week_id=' + currentWeekId)
    ]);

    const weekJson     = await weekResponse.json();
    const commentsJson = await commentsResponse.json();

    // Store comments (empty array if none)
    currentComments = (commentsJson.success && Array.isArray(commentsJson.data))
      ? commentsJson.data
      : [];

    if (weekJson.success && weekJson.data) {
      renderWeekDetails(weekJson.data);
      renderComments();
      commentForm.addEventListener('submit', handleAddComment);
    } else {
      weekTitle.textContent = 'Week not found.';
    }

  } catch (error) {
    weekTitle.textContent = 'Error loading week.';
    console.error('initializePage error:', error);
  }
}

// --- Initial Page Load ---
initializePage();