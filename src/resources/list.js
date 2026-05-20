const resourceListSection = document.getElementById('resource-list-section');

function createResourceArticle(resource) {
  const article = document.createElement('article');
  const h3 = document.createElement('h3');
  h3.textContent = resource.title;
  const p = document.createElement('p');
  p.textContent = resource.description;
  const a = document.createElement('a');
  a.href = `details.html?id=${resource.id}`;
  a.textContent = "View Resource & Discussion";
  
  article.appendChild(h3);
  article.appendChild(p);
  article.appendChild(a);
  return article;
}

async function loadResources() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();
    if (result.success && resourceListSection) {
      resourceListSection.innerHTML = '';
      result.data.forEach(resource => {
        resourceListSection.appendChild(createResourceArticle(resource));
      });
    }
  } catch (error) { console.error(error); }
}

if (document.getElementById('resource-list-section')) {
  loadResources();
}