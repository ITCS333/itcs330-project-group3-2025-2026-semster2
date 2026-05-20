/*
  Requirement: Populate the "Course Resources" list page.
*/

// --- Element Selections ---
// Select the section for the resource list
const resourceListSection = document.getElementById('resource-list-section');

// --- Functions ---

/**
 * Implementation of createResourceArticle function.
 * It takes one resource object { id, title, description, link }.
 */
function createResourceArticle(resource) {
  // Create the article element
  const article = document.createElement('article');
  article.className = 'resource-item';

  // Create and add the heading (Title)
  const heading = document.createElement('h2');
  heading.textContent = resource.title;
  article.appendChild(heading);

  // Create and add the paragraph (Description)
  const description = document.createElement('p');
  description.textContent = resource.description || 'No description provided.';
  article.appendChild(description);

  // Create and add the anchor tag (Link to detail page)
  const detailLink = document.createElement('a');
  detailLink.href = `details.html?id=${resource.id}`;
  detailLink.textContent = "View Resource & Discussion";
  article.appendChild(detailLink);

  return article;
}

/**
 * Implementation of the loadResources function.
 */
async function loadResources() {
  try {
    // 1. Use fetch() to GET data from the API endpoint
    const response = await fetch('./api/index.php');
    
    // 2. Parse the JSON response
    const result = await response.json();

    if (result.success) {
      // 3. Clear any existing content
      resourceListSection.innerHTML = '';

      // 4. Loop through the resources array in data
      result.data.forEach(resource => {
        // Call createResourceArticle and append to section
        const resourceArticle = createResourceArticle(resource);
        resourceListSection.appendChild(resourceArticle);
      });
    } else {
      resourceListSection.innerHTML = '<p>Error loading resources.</p>';
    }
  } catch (error) {
    console.error('Fetch error:', error);
    resourceListSection.innerHTML = '<p>Could not connect to the server.</p>';
  }
}

// --- Initial Page Load ---
loadResources();