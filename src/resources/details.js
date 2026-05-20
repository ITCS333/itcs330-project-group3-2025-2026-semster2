let currentResourceId = null;
let currentComments = [];

const titleElem = document.getElementById('resource-title');
const descElem = document.getElementById('resource-description');
const linkElem = document.getElementById('resource-link');
const commentListElem = document.getElementById('comment-list');
const commentFormElem = document.getElementById('comment-form');
const commentInputElem = document.getElementById('new-comment');

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  titleElem.textContent = resource.title;
  descElem.textContent = resource.description;
  linkElem.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement('article');
  article.innerHTML = `<p>${comment.text}</p><footer>Posted by: ${comment.author}</footer>`;
  return article;
}

function renderComments() {
  commentListElem.innerHTML = '';
  currentComments.forEach(c => commentListElem.appendChild(createCommentArticle(c)));
}

async function handleAddComment(event) {
  event.preventDefault();
  const text = commentInputElem.value.trim();
  if (!text) return;

  const response = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    body: JSON.stringify({ resource_id: currentResourceId, author: 'Student', text: text })
  });
  const result = await response.json();
  if (result.success) {
    currentComments.push({ author: 'Student', text: text });
    renderComments();
    commentInputElem.value = '';
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  if (!currentResourceId) { titleElem.textContent = "Resource not found."; return; }

  const [resRes, comRes] = await Promise.all([
    fetch(`./api/index.php?id=${currentResourceId}`),
    fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
  ]);

  const resData = await resRes.json();
  const comData = await comRes.json();

  if (resData.success) {
    renderResourceDetails(resData.data);
    currentComments = comData.data || [];
    renderComments();
    commentFormElem.addEventListener('submit', handleAddComment);
  } else {
    titleElem.textContent = "Resource not found.";
  }
}

initializePage();