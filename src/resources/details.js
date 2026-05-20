let currentResourceId = null;
let currentComments = [];

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  document.getElementById('resource-title').textContent = resource.title;
  document.getElementById('resource-description').textContent = resource.description;
  document.getElementById('resource-link').href = resource.link;
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
  const container = document.getElementById('comment-list');
  if (!container) return;
  container.innerHTML = '';
  currentComments.forEach(comment => {
    container.appendChild(createCommentArticle(comment));
  });
}

async function handleAddComment(event) {
  event.preventDefault();
  const textarea = document.getElementById('new-comment');
  const commentText = textarea.value.trim();
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
    textarea.value = '';
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  const titleElem = document.getElementById('resource-title');
  if (!currentResourceId) { if(titleElem) titleElem.textContent = "Resource not found."; return; }

  try {
    const [resRes, comRes] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`).then(r => r.json()),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`).then(r => r.json())
    ]);

    if (resRes.success) {
      renderResourceDetails(resRes.data);
      currentComments = comRes.data || [];
      renderComments();
      document.getElementById('comment-form').addEventListener('submit', handleAddComment);
    } else {
      if(titleElem) titleElem.textContent = "Resource not found.";
    }
  } catch (error) { console.error(error); }
}

if (document.getElementById('resource-title')) {
  initializePage();
}