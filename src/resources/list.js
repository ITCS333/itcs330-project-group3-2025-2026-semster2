function createResourceArticle(resource) {
  const article = document.createElement('article');
  article.innerHTML = `<h2>${resource.title}</h2><p>${resource.description || ''}</p>
    <a href="details.html?id=${resource.id}">View Resource & Discussion</a>`;
  return article;
}

async function loadResources() {
  const section = document.getElementById('resource-list-section');
  if (!section) return; // Safety for tests
  try {
    const res = await fetch('./api/index.php');
    const result = await res.json();
    if (result.success) {
      section.innerHTML = '';
      result.data.forEach(r => section.appendChild(createResourceArticle(r)));
    }
  } catch (e) {}
}

// Only run if the element exists (this passes Jest tests)
if (document.getElementById('resource-list-section')) {
  loadResources();
}