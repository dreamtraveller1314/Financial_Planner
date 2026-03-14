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

    const expensesText = expenses.length > 0 
      ? expenses.map(e => `${e.name}: ${e.amount}`).join(', ') 
      : 'None provided';

    const prompt = `You are a friendly financial advisor.
      A user has provided the following information:
      - Monthly income (after tax): ${income}
      - Country: ${country}
      - Fixed monthly expenses: ${expensesText}
      - Lifestyle notes: ${notes || 'None'}
      Based on this, create a realistic and practical monthly budget plan.
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
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      const data = await response.json();
      const result = JSON.parse(data.reply);
      
      console.log('AI Prompt:', prompt);
      console.log('AI Budget Plan:', result);
      alert('Success! Check the console (F12) to see your budget data.');

    } catch (error) {
      console.error('Error:', error);
      alert('Could not connect to the server. Is "node server.js" running?');
    } finally {
      btn.textContent = 'Generate My Budget Plan';
      btn.disabled = false;
    }
}