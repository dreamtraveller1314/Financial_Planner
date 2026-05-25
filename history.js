const SUPABASE_URL = "https://fcgitbzeisbfchyiwker.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l0YnplaXNiZmNoeWl3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjQ1ODcsImV4cCI6MjA5NTA0MDU4N30.jMxlD5iOC8l44YV3WfhyeaIgeNAHN8XiZiT02WB_qnU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let loggedInUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null;
let loggedInUsername = localStorage.getItem('username') || null;
let historyChartInstance = null;

window.addEventListener('DOMContentLoaded', () => {
  if (!loggedInUserId || !loggedInUsername) {
    alert("Please log in first!");
    window.location.href = "index.html";
    return;
  }

  document.querySelector('.nav-container').classList.add('visible-flex');

  document.getElementById('user-display-email').textContent = `${loggedInUsername}`;
  loadSavedBudgetHistory();
});

function handleLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}

async function loadSavedBudgetHistory() {
  try {
    const { data: plans, error } = await supabaseClient
      .from('budget_plans')
      .select('*')
      .eq('user_id', loggedInUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const resultsBox = document.getElementById('history-results');
    const emptyMsg = document.getElementById('history-empty-message');

    if (plans && plans.length > 0) {
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (resultsBox) resultsBox.style.display = 'block';
      
      renderSavedHistoryDashboard(plans[0].plan_data);
    } else {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (resultsBox) resultsBox.style.display = 'none';
    }
  } catch (err) {
    console.error("Database query exception:", err);
  }
}

function renderSavedHistoryDashboard(savedPlan) {
  document.getElementById('history-summary').textContent = savedPlan.summary || "";
  document.getElementById('history-health-score').textContent = savedPlan.health_score || "N/A";
  document.getElementById('history-health-label').textContent = savedPlan.health_label || "";
  
  const scoreTextElement = document.getElementById('history-health-score');
  if (scoreTextElement && savedPlan.health_score) {
    if (savedPlan.health_score >= 70) scoreTextElement.style.color = '#4a8c5c';
    else if (savedPlan.health_score >= 40) scoreTextElement.style.color = '#c8956c';
    else scoreTextElement.style.color = '#c0614a';
  }

  const cardsGrid = document.getElementById('history-cards-grid');
  if (cardsGrid && savedPlan.categories) {
    cardsGrid.innerHTML = ''; 
    savedPlan.categories.forEach(cat => {
      cardsGrid.innerHTML += `
        <div class="cat-card">
          <div class="cat-top">
            <span class="cat-name">${cat.name}</span>
            <span class="cat-percent">${cat.percent}%</span>
          </div>
          <div class="cat-bar-wrap">
            <div class="cat-bar" style="width: ${cat.percent}%"></div>
          </div>
          <div class="cat-amount">${Number(cat.amount).toLocaleString()}</div>
          <div class="cat-tip">${cat.tip || ''}</div>
        </div>
      `;
    });
  }

  const tipsBox = document.getElementById('history-tips-box');
  if (tipsBox && savedPlan.top_tips) {
    tipsBox.innerHTML = '';
    savedPlan.top_tips.forEach(tip => {
      tipsBox.innerHTML += `
        <div class="tip-item">
          <div class="tip-dot"></div>
          <span>${tip}</span>
        </div>
      `;
    });
  }

  const ctxEl = document.getElementById('history-pie-chart');
  if (ctxEl) {
    const ctx = ctxEl.getContext('2d');
    if (historyChartInstance) historyChartInstance.destroy();
    
    const labels = savedPlan.categories ? savedPlan.categories.map(c => ' ' + c.name) : [];
    const dataValues = savedPlan.categories ? savedPlan.categories.map(c => c.amount) : [];
    const colorsPalette = ['#c8956c', '#e8b89a', '#8fae8b', '#b5c99a', '#7da0b5', '#a8c4d4'];

    historyChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: { 
        labels: labels, 
        datasets: [{ 
          data: dataValues, 
          backgroundColor: colorsPalette, 
          borderWidth: 2, 
          borderColor: '#fffdf9' 
        }]
      },
      options: { 
        responsive: true, 
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: {
              font: { size: 11, family: 'Segoe UI' },
              color: '#4a3f35'
            }
          }
        }
      }
    });
  }
}