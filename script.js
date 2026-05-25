const SUPABASE_URL = "https://fcgitbzeisbfchyiwker.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l0YnplaXNiZmNoeWl3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjQ1ODcsImV4cCI6MjA5NTA0MDU4N30.jMxlD5iOC8l44YV3WfhyeaIgeNAHN8XiZiT02WB_qnU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let loggedInUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null;
let loggedInUsername = localStorage.getItem('username') || null;
let latestAIPlanData = null;

window.addEventListener('DOMContentLoaded', () => {
  if (loggedInUserId && loggedInUsername) {
    enterDashboard();
  }
});

async function handleAuth() {
  const usernameInput = document.getElementById('auth-username').value.trim();
  const passwordInput = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-primary-btn');

  if (!usernameInput || !passwordInput) {
    alert('Please enter both a username and a password!');
    return;
  }

  btn.textContent = 'Signing In...';
  btn.disabled = true;

  try {
    const { data: users, error: fetchError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('username', usernameInput.toLowerCase());

    if (fetchError) throw fetchError;

    if (users && users.length > 0) {
      const existingUser = users[0];
      if (existingUser.password === passwordInput) {
        saveSession(existingUser.id, existingUser.username);
        enterDashboard();
      } else {
        alert('This username is taken, and the password you entered is incorrect!');
      }
    } 
    else {
      const { data: newUser, error: insertError } = await supabaseClient
        .from('user_profiles')
        .insert([{ username: usernameInput.toLowerCase(), password: passwordInput }])
        .select();

      if (insertError) throw insertError;

      alert(`Welcome! Created new profile for: ${usernameInput}`);
      saveSession(newUser[0].id, newUser[0].username);
      enterDashboard();
    }
  } catch (err) {
    console.error(err);
    alert('Database connection issue: ' + err.message);
  } finally {
    btn.textContent = 'Enter Dashboard';
    btn.disabled = false;
  }
}

function saveSession(id, username) {
  loggedInUserId = id;
  loggedInUsername = username;
  localStorage.setItem('userId', id);
  localStorage.setItem('username', username);
}

function enterDashboard() {
  document.getElementById('auth-box').classList.add('hidden');
  document.getElementById('dashboard-nav').classList.add('visible-flex');
  document.getElementById('user-display-email').textContent = `${loggedInUsername}`;
  document.getElementById('tab-planner').classList.add('visible-block');
}

function handleLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}

const loadingTips = [
  "💡 The 50/30/20 rule — 50% needs, 30% wants, 20% savings",
  "💡 Emergency fund should cover 3–6 months of expenses",
  "💡 Pay yourself first — save before you spend",
  "💡 Small daily savings add up to big yearly totals",
  "💡 Tracking spending is the first step to saving more"
];

let tipInterval;
function showLoading(show) {
  const screen = document.getElementById('loading-screen');
  const formContent = document.querySelectorAll('.form-group, .submit-btn');

  if (show) {
    formContent.forEach(el => el.classList.add('hidden'));
    screen.classList.add('visible-block');
    let i = 0;
    document.getElementById('loading-text').textContent = loadingTips[0];
    tipInterval = setInterval(() => {
      i = (i + 1) % loadingTips.length;
      document.getElementById('loading-text').textContent = loadingTips[i];
    }, 2500);
  } else {
    formContent.forEach(el => el.classList.remove('hidden'));
    screen.classList.remove('visible-block');
    clearInterval(tipInterval);
  }
}

function addExpense() {
  const list = document.getElementById('expenses-list');
  const row = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
    <input type="text" placeholder="e.g. Rent" class="expense-name" />
    <input type="number" placeholder="1000" class="expense-amount" />
    <button onclick="removeExpense(this)">✕</button>
  `;
  list.appendChild(row);
}

function removeExpense(button) {
  button.parentElement.remove();
}

function getExpenses() {
  const rows = document.querySelectorAll('.expense-row');
  const expenses = [];
  rows.forEach(row => {
    const name = row.querySelector('.expense-name').value.trim();
    const amount = row.querySelector('.expense-amount').value.trim();
    if(name && amount) expenses.push ({name,amount});
  });
  return expenses;
}

function showResults(result) {
  const saveBtn = document.getElementById('save-plan-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Save This Plan to My Profile';
    saveBtn.disabled = false;
    saveBtn.className = 'submit-btn btn-save-ready';
  }
  
  const resultsBox = document.getElementById('results');
  resultsBox.classList.add('visible-block');
  resultsBox.scrollIntoView({ behavior: 'smooth' });
  
  document.getElementById('result-summary').textContent = result.summary;
  document.getElementById('health-score').textContent = result.health_score;
  document.getElementById('health-label').textContent = result.health_label;
  
  const scoreEl = document.getElementById('health-score');
  scoreEl.className = 'health-score';
  if (result.health_score >= 70) scoreEl.classList.add('score-healthy');
  else if (result.health_score >= 40) scoreEl.classList.add('score-warning');
  else scoreEl.classList.add('score-critical');

  const labels = result.categories.map(c => ' ' + c.name);
  const amounts = result.categories.map(c => c.amount);
  const colors = ['#c8956c','#e8b89a','#8fae8b','#b5c99a','#7da0b5','#a8c4d4','#c4a882','#d4b896','#9b8ea0','#c2b5c8'];
  
  if (window.myChart) window.myChart.destroy();
  const ctx = document.getElementById('pie-chart').getContext('2d');
  window.myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 2, borderColor: '#fffdf9' }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'Segoe UI' }, color: '#4a3f35', padding: 10, boxWidth: 12 }}}}
  });

  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';
  result.categories.forEach(cat => {
    grid.innerHTML += `
      <div class="cat-card">
        <div class="cat-top"><span class="cat-name">${cat.name}</span><span class="cat-percent">${cat.percent}%</span></div>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width: ${cat.percent}%"></div></div>
        <div class="cat-amount">${Number(cat.amount).toLocaleString()}</div>
        <div class="cat-tip">${cat.tip}</div>
      </div>
    `;
  });

  const tipsBox = document.getElementById('tips-box');
  tipsBox.innerHTML = '';
  result.top_tips.forEach(tip => {
    tipsBox.innerHTML += `<div class="tip-item"><div class="tip-dot"></div><span>${tip}</span></div>`;
  });

  const warningsBox = document.getElementById('warnings-box');
  warningsBox.innerHTML = '';
  if (result.warnings && result.warnings.length > 0) {
    result.warnings.forEach(w => { warningsBox.innerHTML += `<div class="warning-item">⚠️ ${w}</div>`; });
  }
}

function replan() {
  document.getElementById('results').classList.remove('visible-block');
  
  const saveBtn = document.getElementById('save-plan-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Save This Plan to My Profile';
    saveBtn.disabled = false;
    saveBtn.className = 'submit-btn btn-save-ready'; 
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.form-group, .submit-btn')
    .forEach(el => el.classList.remove('hidden'));
}

async function generatePlan() {
  const income = document.getElementById('income').value;
  const country = document.getElementById('country').value;
  const notes = document.getElementById('notes').value;
  const expenses = getExpenses();

  if (!income || !country) {
    alert('Please fill in your income and country first!');
    return;
  }

  const btn = document.querySelector('.submit-btn');
  btn.textContent = 'Planning for you...';
  btn.disabled = true;
  document.getElementById('results').classList.remove('visible-block');
  showLoading(true);

  const expensesText = expenses.length > 0 ? expenses.map(e => `${e.name}: ${e.amount}`).join(', ') : 'None provided';
  const prompt = `You are a friendly financial advisor. Create a valid budget JSON object matching this structural layout blueprint for ${country} with an income of ${income}. Notes: ${notes}, Expenses: ${expensesText}. Return JSON only. Format precisely: {"summary": "text", "health_score": 80, "health_label": "text", "categories": [{"name": "text", "amount": 10, "percent": 10, "tip": "text"}], "top_tips": ["text"], "warnings": []}`;

  try {
    const response = await fetch("https://financial-planner-api-fzgg.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt })
    });
    const data = await response.json();
    const result = JSON.parse(data.reply);
    latestAIPlanData = result;
    showResults(result);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  } finally {
    btn.textContent = 'Generate My Budget Plan';
    btn.disabled = false;
    showLoading(false);
  }
}

async function saveCurrentPlan() {
  const saveBtn = document.getElementById('save-plan-btn');
  if (!loggedInUserId) return;
  if (!latestAIPlanData) return;

  saveBtn.textContent = 'Saving to profile...';
  saveBtn.disabled = true;

  try {
    const incomeValue = parseFloat(document.getElementById('income').value) || 0;
    const { error } = await supabaseClient
      .from('budget_plans')
      .insert([{ user_id: loggedInUserId, income: incomeValue, plan_data: latestAIPlanData }]);

    if (error) throw error;
    saveBtn.textContent = 'Plan Saved!';
    saveBtn.className = 'submit-btn btn-save-success';
  } catch (err) {
    console.error("Save error:", err);
    saveBtn.textContent = 'Save This Plan to My Profile';
    saveBtn.className = 'submit-btn btn-save-ready';
    saveBtn.disabled = false;
  }
}