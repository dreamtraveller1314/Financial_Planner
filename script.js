const SUPABASE_URL = "https://fcgitbzeisbfchyiwker.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l0YnplaXNiZmNoeWl3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjQ1ODcsImV4cCI6MjA5NTA0MDU4N30.jMxlD5iOC8l44YV3WfhyeaIgeNAHN8XiZiT02WB_qnU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let loggedInUserId = null;
let loggedInUsername = null;
let latestAIPlanData = null;

async function handleAuth() {
  const usernameInput = document.getElementById('auth-username').value.trim();
  const passwordInput = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-primary-btn');

  if (!usernameInput || !passwordInput) {
    alert('Please enter both a username and a password!');
    return;
  }

  btn.textContent = 'Checking Database...';
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
        loggedInUserId = existingUser.id;
        loggedInUsername = existingUser.username;
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
      loggedInUserId = newUser[0].id;
      loggedInUsername = newUser[0].username;
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

function enterDashboard() {
  document.getElementById('auth-box').style.display = 'none';
  document.getElementById('dashboard-nav').style.display = 'flex';
  document.getElementById('user-display-email').textContent = `👤 ${loggedInUsername}`;
  document.getElementById('tab-planner').style.display = 'block';
}

function handleLogout() {
  loggedInUserId = null;
  loggedInUsername = null;
  
  document.getElementById('auth-box').style.display = 'block';
  document.getElementById('dashboard-nav').style.display = 'none';
  document.getElementById('tab-planner').style.display = 'none';
  document.getElementById('tab-savings').style.display = 'none';
  document.getElementById('results').style.display = 'none';
  
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
}

function switchTab(tabName) {
  if (tabName === 'planner') {
    document.getElementById('tab-planner').style.display = 'block';
    document.getElementById('tab-savings').style.display = 'none';
    
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
  } else {
    document.getElementById('tab-planner').style.display = 'none';
    document.getElementById('tab-savings').style.display = 'block';
    
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
  }
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
      formContent.forEach(el => el.style.display = 'none');
      screen.style.display = 'block';
      let i = 0;
      document.getElementById('loading-text').textContent = loadingTips[0];
      tipInterval = setInterval(() => {
        i = (i + 1) % loadingTips.length;
        document.getElementById('loading-text').textContent = loadingTips[i];
      }, 2500);

    } else {
      formContent.forEach(el => el.style.display = '');
      screen.style.display = 'none';
      clearInterval(tipInterval);
    }
  }

function addExpense() {
    const list = document.getElementById('expenses-list');
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = `
      <input type="text"   placeholder="e.g. Rent" class="expense-name" />
      <input type="number" placeholder="1000" class="expense-amount" />
      <button onclick="removeExpense(this)">✕</button>
    `;
    list.appendChild(row);
  }

function removeExpense(button) {
        const row = button.parentElement.remove();
        row.remove();
    }

function getExpenses() {
    const rows = document.querySelectorAll('.expense-row');
    const expenses = [];
    rows.forEach(row => {
        const name = row.querySelector('.expense-name').value.trim();
        const amount = row.querySelector('.expense-amount').value.trim();
        if(name && amount){
            expenses.push ({name,amount});
        }
    });
    return expenses;
}

function showResults(result) {
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('result-summary').textContent = result.summary;
    document.getElementById('health-score').textContent = result.health_score;
    document.getElementById('health-label').textContent = result.health_label;
    const scoreEl = document.getElementById('health-score');
    if (result.health_score >= 70) {
      scoreEl.style.color = '#4a8c5c';
    } else if (result.health_score >= 40) {
      scoreEl.style.color = '#c8956c';
    } else {
      scoreEl.style.color = '#c0614a';
    }
    const labels  = result.categories.map(c => ' ' + c.name);
    const amounts = result.categories.map(c => c.amount);
    const colors  = [
      '#c8956c','#e8b89a','#8fae8b','#b5c99a',
      '#7da0b5','#a8c4d4','#c4a882','#d4b896',
      '#9b8ea0','#c2b5c8'
    ];
    if (window.myChart) window.myChart.destroy();

    const ctx = document.getElementById('pie-chart').getContext('2d');
    window.myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: amounts,
          backgroundColor: colors,
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
              color: '#4a3f35',
              padding: 10,
              boxWidth: 12
            }
          }
        }
      }
    });
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    result.categories.forEach(cat => {
      grid.innerHTML += `
        <div class="cat-card">
          <div class="cat-top">
            <span class="cat-name">${cat.name}</span>
            <span class="cat-percent">${cat.percent}%</span>
          </div>
          <div class="cat-bar-wrap">
            <div class="cat-bar" style="width: ${cat.percent}%"></div>
          </div>
          <div class="cat-amount">${Number(cat.amount).toLocaleString()}</div>
          <div class="cat-tip">${cat.tip}</div>
        </div>
      `;
    });
    const tipsBox = document.getElementById('tips-box');
    tipsBox.innerHTML = '';
    result.top_tips.forEach(tip => {
      tipsBox.innerHTML += `
        <div class="tip-item">
          <div class="tip-dot"></div>
          <span>${tip}</span>
        </div>
      `;
    });
    const warningsBox = document.getElementById('warnings-box');
    warningsBox.innerHTML = '';
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(w => {
        warningsBox.innerHTML += `
          <div class="warning-item">⚠️ ${w}</div>
        `;
      });
    }
  }
  function replan() {
    document.getElementById('results').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.form-group, .submit-btn')
    .forEach(el => el.style.display = '');
  }

  async function generatePlan() {
    const income = document.getElementById('income').value;
    const country = document.getElementById('country').value;
    const notes = document.getElementById('notes').value;
    window.userIncome = income;
    const expenses = getExpenses();

    if (!income || !country) {
      alert('Please fill in your income and country first!');
      return;
    }

    const btn = document.querySelector('.submit-btn');
    btn.textContent = 'Planning for you...';
    btn.disabled = true;
    document.getElementById('results').style.display = 'none';
    showLoading(true);

    const expensesText = expenses.length > 0 
      ? expenses.map(e => `${e.name}: ${e.amount}`).join(', ') 
      : 'None provided';

    const prompt = `You are a friendly financial advisor.
      A user has provided the following information:
      - Monthly income (after tax): ${income}
      - Country: ${country}
      - Fixed monthly expenses: ${expensesText}
      - Lifestyle notes: ${notes || 'None'}
      Based on this, create a realistic and practical monthly budget plan and remember to based on commodity price in ${country}.
      Reply ONLY with a valid JSON object — no explanation, no extra text, just the JSON.
      Use this exact format:
      {
        "summary": "A short 2-sentence personalised overview",
        "health_score": 75,
        "health_label": "Healthy",
        "categories": [
          {
            "name": "Housing",
            "amount": 1200,
            "percent": 27,
            "tip": "Your rent is within the recommended 30% range. Good job!",
          }
        ],
        "top_tips": [
          "Tip number one here",
          "Tip number two here",
          "Tip number three here"
        ],
        "warnings": [
          "Any warning if something looks risky, or leave this array empty"
        ]
      }
        `;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("https://financial-planner-api-fzgg.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await response.json();
      const result = JSON.parse(data.reply);
      latestAIPlanData = result;
      
      console.log('AI Prompt:', prompt);
      console.log('AI Budget Plan:', result);
      showResults(result);

    } catch (error) {
      console.error('Error:', error);
      alert('Wait for 5 mins and try again!');
    } finally {
      btn.textContent = 'Generate My Budget Plan';
      btn.disabled = false;
      showLoading(false);
    }
}

async function saveCurrentPlan() {
  const saveBtn = document.getElementById('save-plan-btn');

  if (!loggedInUserId) {
    alert("You must be logged in to save a plan!");
    return;
  }

  if (!latestAIPlanData) {
    alert("Please generate a budget plan first before saving!");
    return;
  }

  saveBtn.textContent = 'Saving to profile...';
  saveBtn.disabled = true;

  try {
    const incomeValue = parseFloat(document.getElementById('income').value) || 0;
    const { data, error } = await supabaseClient
      .from('budget_plans')
      .insert([
        {
          user_id: loggedInUserId,
          income: incomeValue,
          plan_data: latestAIPlanData
        }
      ]);

    if (error) throw error;

    saveBtn.textContent = 'Plan Saved!';
    saveBtn.style.background = '#2e5c3c';

  } catch (err) {
    console.error("Save error:", err);
    alert('Failed to save plan: ' + err.message);
    
    saveBtn.textContent = 'Save This Plan to My Profile';
    saveBtn.disabled = false;
  }
}