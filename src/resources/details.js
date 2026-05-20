let currentResourceId = null;
let currentComments = [];

const titleEl = document.getElementById('resource-title');
const descEl = document.getElementById('resource-description');
const linkEl = document.getElementById('resource-link');
const commentListEl = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const newCommentInput = document.getElementById('new-comment');

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  titleEl.textContent = resource.title;
  descEl.textContent = resource.description;
  linkEl.href = resource.link;
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
  commentListEl.innerHTML = '';
  currentComments.forEach(comment => {
    commentListEl.appendChild(createCommentArticle(comment));
  });
}

async function handleAddComment(event) {
  event.preventDefault();
  const text = newCommentInput.value.trim();
  if (!text) return;

  const response = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: 'Student',
      text: text
    })
  });

  const result = await response.json();
  if (result.success) {
    currentComments.push({ author: 'Student', text: text });
    renderComments();
    newCommentInput.value = '';
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  if (!currentResourceId) {
    titleEl.textContent = "Resource not found.";
    return;
  }

  try {
    // Standard requirement: Fetch both concurrently
    const [resResp, commResp] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
    ]);

    const resData = await resResp.json();
    const commData = await commResp.json();

    if (resData.success) {
      renderResourceDetails(resData.data);
      currentComments = commData.data || [];
      renderComments();
      commentForm.addEventListener('submit', handleAddComment);
    } else {
      titleEl.textContent = "Resource not found.";
    }
  } catch (err) {
    titleEl.textContent = "Error loading resource.";
  }
}

initializePage();