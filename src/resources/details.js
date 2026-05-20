let currentResourceId = null;
let currentComments = [];

const titleElement = document.getElementById('resource-title');
const descriptionElement = document.getElementById('resource-description');
const linkElement = document.getElementById('resource-link');
const commentListContainer = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('new-comment');

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  titleElement.textContent = resource.title;
  descriptionElement.textContent = resource.description;
  linkElement.href = resource.link;
}

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

function renderComments() {
  commentListContainer.innerHTML = '';
  currentComments.forEach(comment => {
    commentListContainer.appendChild(createCommentArticle(comment));
  });
}

async function handleAddComment(event) {
  event.preventDefault();
  const commentText = commentInput.value.trim();
  if (!commentText) return;

  const response = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: 'Student',
      text: commentText
    })
  });
  const result = await response.json();
  if (result.success) {
    currentComments.push({ author: 'Student', text: commentText });
    renderComments();
    commentInput.value = '';
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  if (!currentResourceId) { titleElement.textContent = "Resource not found."; return; }

  const [resRes, comRes] = await Promise.all([
    fetch(`./api/index.php?id=${currentResourceId}`).then(r => r.json()),
    fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`).then(r => r.json())
  ]);

  if (resRes.success) {
    renderResourceDetails(resRes.data);
    currentComments = comRes.data || [];
    renderComments();
    commentForm.addEventListener('submit', handleAddComment);
  } else {
    titleElement.textContent = "Resource not found.";
  }
}

initializePage();