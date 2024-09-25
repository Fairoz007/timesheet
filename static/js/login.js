document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission behavior
    console.log("Sign up form submitted");

    const formData = new FormData(this);

    fetch('/signup', {  // Update endpoint to /signup
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),  // Convert FormData to JSON
        headers: {
            'Content-Type': 'application/json'  // Set the correct content type
        }
    }).then(response => response.json())
      .then(data => {
        if (data.message) {
            showPopup(data.message);
        } else {
            showPopup("Sign up failed.");
        }
    }).catch(error => {
        console.error("Sign up failed:", error);
        showPopup("An error occurred. Please try again.");
    });
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission behavior
    console.log("Login form submitted");

    const formData = new FormData(this);

    fetch('/login', {  // Update endpoint to /login
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),  // Convert FormData to JSON
        headers: {
            'Content-Type': 'application/json'  // Set the correct content type
        }
    }).then(response => response.json())
      .then(data => {
        if (data.message) {
            showPopup(data.message);
        } else {
            showPopup("Login failed.");
        }
    }).catch(error => {
        console.error("Login failed:", error);
        showPopup("An error occurred. Please try again.");
    });
});

function showPopup(message) {
    const popup = document.getElementById('popupMessage');
    document.getElementById('popupText').innerText = message;
    popup.style.display = 'block';  // Show the popup
}

function closePopup() {
    const popup = document.getElementById('popupMessage');
    popup.style.display = 'none';  // Hide the popup
}
