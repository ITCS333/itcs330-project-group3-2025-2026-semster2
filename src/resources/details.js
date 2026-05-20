/*
  Requirement: Populate the resource detail page and discussion forum.
*/

// --- Global Data Store ---
let currentResourceId = null;
let currentComments = [];

// --- Element Selections ---
const titleElement = document.getElementById('resource-title');
const descriptionElement = document.getElementById('resource-description');
const linkElement = document.getElementById('resource-link');
const commentListContainer = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('new-comment');

// --- Functions ---

/**
 * Gets the query string 'id' parameter from the URL.
 */
function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Renders the resource text and link to the DOM.
 */
function renderResourceDetails(resource) {
  titleElement.textContent = resource.title;
  descriptionElement.textContent = resource.description;
  linkElement.href = resource.link;
}

/**
 * Creates an <article> for a single comment.
 */
function createCommentArticle(comment) {
  const article = document.createElement('article');
  
  const p = document.createElement('p');
  p.textContent = comment.text;
  
  const footer = document.createElement('footer');
  footer.textContent = `Posted by: ${comment.author}`;
  
  article.appendChild(p);
  article.appendChild(footer);
  
  return article;
}

/**
 * Renders all comments in the global array to the page.
 */
function renderComments() {
  commentListContainer.innerHTML = '';
  currentComments.forEach(comment => {
    const commentArticle = createCommentArticle(comment);
    commentListContainer.appendChild(commentArticle);
  });
}

/**
 * Event handler for posting a new comment.
 */
async function handleAddComment(event) {
  event.preventDefault();
  
  const commentText = commentInput.value.trim();
  if (!commentText) return;

  try {
    const response = await fetch('./api/index.php?action=comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_id: currentResourceId,
        author: 'Student', // Hardcoded as per instructions
        text: commentText
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Create local comment object to update UI immediately
      const newComment = {
        author: 'Student',
        text: commentText,
        created_at: new Date().toISOString()
      };
      
      currentComments.push(newComment);
      renderComments();
      commentInput.value = ''; // Clear textarea
    }
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}

/**
 * Initializes the page by fetching resource and comments data.
 */
async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    titleElement.textContent = "Resource not found.";
    return;
  }

  try {
    // Fetch resource details and comments simultaneously
    const [resResponse, comResponse] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
    ]);

    const resResult = await resResponse.json();
    const comResult = await comResponse.json();

    if (resResult.success && resResult.data) {
      currentComments = comResult.data || [];
      renderResourceDetails(resResult.data);
      renderComments();
      
      // Add the submit listener to the form
      commentForm.addEventListener('submit', handleAddComment);
    } else {
      titleElement.textContent = "Resource not found.";
    }
  } catch (error) {
    console.error('Initialization error:', error);
    titleElement.textContent = "Error loading resource.";
  }
}

// --- Initial Page Load ---
initializePage();