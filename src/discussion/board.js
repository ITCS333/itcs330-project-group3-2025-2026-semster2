/*
  Requirement: Make the "Discussion Board" page interactive.

  Instructions:
  1. This file is already linked to `board.html` via:
         <script src="board.js" defer></script>

  2. In `board.html`:
     - The new-topic form has id="new-topic-form".
     - The topic list container has id="topic-list-container".

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  All requests and responses use JSON.
  Successful list response shape: { success: true, data: [ ...topic objects ] }
  Each topic object shape (from the topics table):
    {
      id:         number,   // integer primary key from the topics table
      subject:    string,
      message:    string,
      author:     string,
      created_at: string    // "YYYY-MM-DD HH:MM:SS" — matches the SQL column name
    }
*/

// --- Global Data Store ---
let topics = [];

// --- Element Selections ---
const newTopicForm =
    document.getElementById('new-topic-form');

const topicListContainer =
    document.getElementById('topic-list-container');

// --- Functions ---

function createTopicArticle(topic) {

    const article = document.createElement('article');

    const h3 = document.createElement('h3');

    const link = document.createElement('a');

    link.href = `topic.html?id=${topic.id}`;

    link.textContent = topic.subject;

    h3.appendChild(link);

    const footer = document.createElement('footer');

    footer.textContent =
        `Posted by: ${topic.author} on ${topic.created_at}`;

    const actions = document.createElement('div');

    const editBtn = document.createElement('button');

    editBtn.className = 'edit-btn';

    editBtn.dataset.id = topic.id;

    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');

    deleteBtn.className = 'delete-btn';

    deleteBtn.dataset.id = topic.id;

    deleteBtn.textContent = 'Delete';

    actions.appendChild(editBtn);

    actions.appendChild(deleteBtn);

    article.appendChild(h3);

    article.appendChild(footer);

    article.appendChild(actions);

    return article;
}

function renderTopics() {

    topicListContainer.innerHTML = "";

    for (const topic of topics) {

        const article = createTopicArticle(topic);

        topicListContainer.appendChild(article);
    }
}

async function handleCreateTopic(event) {

    event.preventDefault();

    const subject =
        document.getElementById('topic-subject').value;

    const message =
        document.getElementById('topic-message').value;

    const submitButton =
        document.getElementById('create-topic');

    const editId =
        submitButton.dataset.editId;

    // UPDATE
    if (editId) {

        await handleUpdateTopic(
            editId,
            { subject, message }
        );

        submitButton.textContent = "Create Topic";

        delete submitButton.dataset.editId;

        newTopicForm.reset();

        return;
    }

    // CREATE
    const response = await fetch(
        './api/index.php',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                subject,
                message,
                author: "Student"
            })
        }
    );

    const result = await response.json();

    if (result.success === true) {

        topics.push({
            id: result.id,
            subject,
            message,
            author: "Student",
            created_at: new Date()
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ')
        });

        renderTopics();

        newTopicForm.reset();
    }
}

async function handleUpdateTopic(id, fields) {

    const response = await fetch(
        './api/index.php',
        {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                id,
                subject: fields.subject,
                message: fields.message
            })
        }
    );

    const result = await response.json();

    if (result.success === true) {

        const topic = topics.find(
            t => t.id == id
        );

        if (topic) {

            topic.subject = fields.subject;

            topic.message = fields.message;
        }

        renderTopics();
    }
}

async function handleTopicListClick(event) {

    // DELETE
    if (
        event.target.classList.contains(
            'delete-btn'
        )
    ) {

        const id =
            event.target.dataset.id;

        const response = await fetch(
            `./api/index.php?id=${id}`,
            {
                method: 'DELETE'
            }
        );

        const result = await response.json();

        if (result.success === true) {

            topics = topics.filter(
                topic => topic.id != id
            );

            renderTopics();
        }
    }

    // EDIT
    if (
        event.target.classList.contains(
            'edit-btn'
        )
    ) {

        const id =
            event.target.dataset.id;

        const topic = topics.find(
            t => t.id == id
        );

        if (!topic) return;

        document.getElementById(
            'topic-subject'
        ).value = topic.subject;

        document.getElementById(
            'topic-message'
        ).value = topic.message;

        const submitButton =
            document.getElementById(
                'create-topic'
            );

        submitButton.textContent =
            "Update Topic";

        submitButton.dataset.editId =
            topic.id;
    }
}

async function loadAndInitialize() {

    const response = await fetch(
        './api/index.php'
    );

    const result = await response.json();

    if (result.success === true) {

        topics = result.data;

        renderTopics();
    }

    newTopicForm.addEventListener(
        'submit',
        handleCreateTopic
    );

    topicListContainer.addEventListener(
        'click',
        handleTopicListClick
    );
}

// --- Initial Page Load ---
loadAndInitialize();
