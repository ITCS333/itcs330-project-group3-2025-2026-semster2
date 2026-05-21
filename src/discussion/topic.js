/*
  Requirement: Populate the single topic page and manage replies.

  Instructions:
  1. This file is already linked to `topic.html` via:
         <script src="topic.js" defer></script>

  2. The following ids must exist in topic.html (already listed in the
     HTML comments):
       #topic-subject        — <h1>
       #original-post        — <article>
       #op-message           — <p>    inside #original-post
       #op-footer            — <footer> inside #original-post
       #reply-list-container — <div>
       #reply-form           — <form>
       #new-reply            — <textarea>

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  Topic object shape returned by the API (from the topics table):
    {
      id:         number,   // integer primary key from the topics table
      subject:    string,
      message:    string,
      author:     string,
      created_at: string    // "YYYY-MM-DD HH:MM:SS"
    }

  Reply object shape returned by the API (from the replies table):
    {
      id:         number,   // integer primary key from the replies table
      topic_id:   number,   // integer FK → topics.id
      text:       string,
      author:     string,
      created_at: string    // "YYYY-MM-DD HH:MM:SS"
    }
*/

// --- Global Data Store ---
let currentTopicId = null;
let currentReplies = [];

// --- Element Selections ---
const topicSubject = document.getElementById('topic-subject');

const opMessage = document.getElementById('op-message');

const opFooter = document.getElementById('op-footer');

const replyListContainer = document.getElementById('reply-list-container');

const replyForm = document.getElementById('reply-form');

const newReplyText = document.getElementById('new-reply');

// --- Functions ---

function getTopicIdFromURL() {

    const params = new URLSearchParams(window.location.search);

    return params.get('id');
}

function renderOriginalPost(topic) {

    topicSubject.textContent = topic.subject;

    opMessage.textContent = topic.message;

    opFooter.textContent =
        "Posted by: " +
        topic.author +
        " on " +
        topic.created_at;
}

function createReplyArticle(reply) {

    const article = document.createElement('article');

    const p = document.createElement('p');

    p.textContent = reply.text;

    const footer = document.createElement('footer');

    footer.textContent =
        "Posted by: " +
        reply.author +
        " on " +
        reply.created_at;

    const div = document.createElement('div');

    const button = document.createElement('button');

    button.textContent = "Delete";

    button.className = "delete-reply-btn";

    button.dataset.id = reply.id;

    div.appendChild(button);

    article.appendChild(p);

    article.appendChild(footer);

    article.appendChild(div);

    return article;
}

function renderReplies() {

    replyListContainer.innerHTML = "";

    for (const reply of currentReplies) {

        const article = createReplyArticle(reply);

        replyListContainer.appendChild(article);
    }
}

async function handleAddReply(event) {

    event.preventDefault();

    const replyText = newReplyText.value.trim();

    if (!replyText) {
        return;
    }

    const response = await fetch(
        './api/index.php?action=reply',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                topic_id: currentTopicId,
                author: 'Student',
                text: replyText
            })
        }
    );

    const result = await response.json();

    if (result.success === true) {

        currentReplies.push(result.data);

        renderReplies();

        newReplyText.value = "";
    }
}

async function handleReplyListClick(event) {

    if (event.target.classList.contains('delete-reply-btn')) {

        const id = event.target.dataset.id;

        const response = await fetch(
            `./api/index.php?action=delete_reply&id=${id}`,
            {
                method: 'DELETE'
            }
        );

        const result = await response.json();

        if (result.success === true) {

            currentReplies = currentReplies.filter(
                reply => reply.id != id
            );

            renderReplies();
        }
    }
}

async function initializePage() {

    currentTopicId = getTopicIdFromURL();

    if (!currentTopicId) {

        topicSubject.textContent = "Topic not found.";

        return;
    }

    const [topicResponse, repliesResponse] = await Promise.all([

        fetch(`./api/index.php?id=${currentTopicId}`),

        fetch(
            `./api/index.php?action=replies&topic_id=${currentTopicId}`
        )
    ]);

    const topicResult = await topicResponse.json();

    const repliesResult = await repliesResponse.json();

    currentReplies = repliesResult.data || [];

    if (topicResult.success === true) {

        renderOriginalPost(topicResult.data);

        renderReplies();

        replyForm.addEventListener(
            'submit',
            handleAddReply
        );

        replyListContainer.addEventListener(
            'click',
            handleReplyListClick
        );

    } else {

        topicSubject.textContent = "Topic not found.";
    }
}

// --- Initial Page Load ---
initializePage(); 
