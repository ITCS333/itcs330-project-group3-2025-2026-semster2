let currentResourceId = null;
let currentComments = [];

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  const title = document.getElementById('resource-title');
  if (title) title.textContent = resource.title;
  const desc = document.getElementById('resource-description');
  if (desc) desc.textContent = resource.description;
  const link = document.getElementById('resource-link');
  if (link) link.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement('article');
  article.innerHTML = `<p>${comment.text}</p><footer>Posted by: ${comment.author}</footer>`;
  return article;
}

function renderComments() {
  const list = document.getElementById('comment-list');
  if (!list) return;
  list.innerHTML = '';
  currentComments.forEach(c => list.appendChild(createCommentArticle(c)));
}

async function handleAddComment(event) {
  event.preventDefault();
  const input = document.getElementById('new-comment');
  const text = input.value.trim();
  if (!text) return;
  const res = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    body: JSON.stringify({ resource_id: currentResourceId, author: 'Student', text: text })
  });
  if ((await res.json()).success) {
    currentComments.push({ author: 'Student', text: text });
    renderComments();
    input.value = '';
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  const title = document.getElementById('resource-title');
  if (!currentResourceId) { if(title) title.textContent = "Resource not found."; return; }

  try {
    const [rRes, cRes] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`).then(r => r.json()),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`).then(r => r.json())
    ]);
    if (rRes.success) renderResourceDetails(rRes.data);
    if (cRes.success) { currentComments = cRes.data; renderComments(); }
    const form = document.getElementById('comment-form');
    if (form) form.addEventListener('submit', handleAddComment);
  } catch (e) {}
}

if (document.getElementById('resource-title')) { initializePage(); }