// Client ID and redirect URI
const CLIENT_ID = '880520113570-2rhja6jhijqa1qm1kkisaa4gpo3j6rgo.apps.googleusercontent.com';
const REDIRECT_URI = 'http://127.0.0.1:5500/templates/login.html';

// Function to initiate Google OAuth2 login
function googleLogin() {
  const authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  const responseType = 'token'; // Use 'code' for server-side flow
  const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  // Construct the Google OAuth2 URL
  const oauth2Url = `${authEndpoint}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

  // Redirect the user to the OAuth2 login page
  window.location.href = oauth2Url;
}

// Function to parse the OAuth2 token from URL
function getAccessTokenFromUrl() {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.replace('#', ''));
  return params.get('access_token');
}

// Function to get user info from Google API
async function fetchUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      showPopup(`Welcome, ${userData.name}!`);
      console.log('User Info:', userData);
    } else {
      throw new Error('Failed to retrieve user information.');
    }
  } catch (error) {
    showPopup(error.message);
    console.error('Error fetching user info:', error);
  }
}

// Function to show popup messages
function showPopup(message) {
  const popup = document.getElementById('popupMessage');
  const popupText = document.getElementById('popupText');

  popupText.innerText = message;
  popup.style.display = 'block'; // Show the popup
}

// Function to close the popup
function closePopup() {
  document.getElementById('popupMessage').style.display = 'none';
}

// Handle the OAuth2 redirect after login
document.addEventListener('DOMContentLoaded', () => {
  // Check if the URL contains an access token
  const accessToken = getAccessTokenFromUrl();
  if (accessToken) {
    // Fetch and display user information
    fetchUserInfo(accessToken);
  }

  // Attach event listener to the Google login button
  const googleLoginButton = document.getElementById('googleLoginButton');
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', googleLogin);
  }
});
