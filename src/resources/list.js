const resourceListSection = document.getElementById('resource-list-section');

function createResourceArticle(resource) {
  const article = document.createElement('article');
  article.innerHTML = `
    <h2>${resource.title}</h2>
    <p>${resource.description || ''}</p>
    <a href="details.html?id=${resource.id}">View Resource & Discussion</a>
  `;
  return article;
}

async function loadResources() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();
    if (result.success) {
      resourceListSection.innerHTML = '';
      result.data.forEach(res => {
        resourceListSection.appendChild(createResourceArticle(res));
      });
    }
  } catch (error) { console.error(error); }
}

loadResources();