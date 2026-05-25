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

  document.querySelector('.nav-container').classList.add('visible-flex');
  
  document.getElementById('user-display-email').textContent = `${loggedInUsername}`;
  
  loadUserGoals();
});

function handleLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}

async function loadUserGoals() {
  try {
    const { data: goals, error } = await supabaseClient
      .from('savings_goals')
      .select('*')
      .eq('user_id', loggedInUserId)
      .order('id', { ascending: false });

    if (error) {
      if (error.code === 'P0001' || error.message.includes('not found')) {
        showSchemaWarning();
        return;
      }
      throw error;
    }

    renderGoalCards(goals);
  } catch (err) {
    console.error("Error fetching goals:", err);
  }
}

async function createNewGoal() {
  const nameInput = document.getElementById('goal-name').value.trim();
  const targetInput = parseFloat(document.getElementById('goal-target').value);
  const currentInput = parseFloat(document.getElementById('goal-current').value) || 0;

  if (!nameInput || isNaN(targetInput) || targetInput <= 0) {
    alert("Please enter a valid goal name and target amount!");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('savings_goals')
      .insert([{
        user_id: loggedInUserId,
        name: nameInput,
        target: targetInput,
        current: currentInput
      }]);

    if (error) throw error;

    document.getElementById('goal-name').value = '';
    document.getElementById('goal-target').value = '';
    document.getElementById('goal-current').value = '0';

    loadUserGoals();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function deleteGoal(goalId) {
  if (!confirm("Are you sure you want to delete this goal?")) return;

  try {
    const { error } = await supabaseClient
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
    loadUserGoals();
  } catch (err) {
    console.error(err);
  }
}

function renderGoalCards(goals) {
  const container = document.getElementById('goals-list-container');
  container.innerHTML = '';

  if (!goals || goals.length === 0) {
    container.innerHTML = `
      <div class="form-box empty-goals-message">
        <p>No active savings goals found! Use the form above to add your first financial milestone.</p>
      </div>`;
    return;
  }

  goals.forEach(goal => {
    const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100)) || 0;
    const isCompleted = percentage >= 100;
    
    container.innerHTML += `
      <div class="cat-card goal-card ${isCompleted ? 'completed' : ''}">
        <div class="goal-header">
          <div class="goal-title-group">
            <span class="goal-title">${goal.name}</span>
            <span class="goal-badge ${isCompleted ? 'completed' : ''}">${percentage}%</span>
          </div>
          <button class="goal-delete-btn" onclick="deleteGoal(${goal.id})">✕</button>
        </div>

        <div class="goal-progress-wrap">
          <div class="goal-progress-bar ${isCompleted ? 'completed' : ''}" style="width: ${percentage}%;"></div>
        </div>

        <div class="goal-ledger-text">
          <span>Saved: <b>$${Number(goal.current).toLocaleString()}</b></span>
          <span>Target: $${Number(goal.target).toLocaleString()}</span>
        </div>

        ${isCompleted ? `
          <div class="goal-congrats-banner">
            🎉 Congratulations! You reached your goal!
          </div>
        ` : `
          <div class="goal-log-section">
            <label class="goal-log-label">Today's Savings:</label>
            <div class="goal-log-row">
              <input type="number" id="save-input-${goal.id}" class="goal-log-input" placeholder="Amount..." min="1" />
              <button class="goal-log-submit" onclick="submitCustomSavings(${goal.id}, ${goal.current}, ${goal.target})">Submit</button>
            </div>
          </div>
        `}
      </div>
    `;
  });
}

async function submitCustomSavings(goalId, currentAmount, targetAmount) {
  const inputField = document.getElementById(`save-input-${goalId}`);
  const loggedAmount = parseFloat(inputField.value);

  if (isNaN(loggedAmount) || loggedAmount <= 0) {
    alert("Please enter a valid saving amount greater than 0!");
    return;
  }

  const newTotal = currentAmount + loggedAmount;

  try {
    const { error } = await supabaseClient
      .from('savings_goals')
      .update({ current: newTotal })
      .eq('id', goalId);

    if (error) throw error;

    loadUserGoals();
  } catch (err) {
    console.error("Error saving contribution:", err);
    alert("Could not update savings: " + err.message);
  }
}