// --- Element Selections ---
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageContainer = document.getElementById("message-container");

// --- Functions ---

function displayMessage(message, type) {
  messageContainer.textContent = message;
  messageContainer.className = type;
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function isValidPassword(password) {
  return password.length >= 8;
}

function handleLogin(event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!isValidEmail(email)) {
    displayMessage("Invalid email format.", "error");
    return;
  }

  if (!isValidPassword(password)) {
    displayMessage("Password must be at least 8 characters.", "error");
    return;
  }

  // Send login request to PHP API
  fetch("api/index.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        displayMessage("Login successful!", "success");
        emailInput.value = "";
        passwordInput.value = "";
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = "../../index.html";
        }, 1000);
      } else {
        displayMessage(data.message || "Invalid email or password.", "error");
      }
    })
    .catch(() => {
      displayMessage("Login successful!", "success");
      emailInput.value = "";
      passwordInput.value = "";
    });
}

function setupLoginForm() {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

// --- Initial Page Load ---
setupLoginForm();