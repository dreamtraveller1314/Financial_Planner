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
