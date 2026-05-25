const SUPABASE_URL = "https://fcgitbzeisbfchyiwker.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l0YnplaXNiZmNoeWl3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjQ1ODcsImV4cCI6MjA5NTA0MDU4N30.jMxlD5iOC8l44YV3WfhyeaIgeNAHN8XiZiT02WB_qnU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let loggedInUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null;
let loggedInUsername = localStorage.getItem('username') || null;

window.addEventListener('DOMContentLoaded', () => {
  if (!loggedInUserId || !loggedInUsername) {
    alert("Please log in first!");
    window.location.href = "index.html";
    return;
  }
  document.getElementById('user-display-email').textContent = `${loggedInUsername}`;
});

function handleLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}