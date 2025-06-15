// Initial financial model data
const financialModel = {
    accounts: [
        {id: "acc1", name: "Checking", type: "Checking", balance: 5000},
        {id: "acc2", name: "Savings", type: "Savings", balance: 10000},
        {id: "acc3", name: "401(k)", type: "Investment", balance: 50000}
    ],
    incomes: [
        {
            id: "inc1", 
            name: "Salary", 
            amount: 5000, 
            depositAccountId: "acc1",
            raises: [
                {date: "2025-01", percent: 3},
                {date: "2026-01", percent: 3}
            ]
        },
        {id: "inc2", name: "Side Gig", amount: 1000, depositAccountId: "acc1", raises: []}
    ],
    expenses: [
        {id: "exp1", name: "Rent", type: "Fixed", paymentAccountId: "acc1", amount: 1500},
        {id: "exp2", name: "Groceries", type: "Fixed", paymentAccountId: "acc1", amount: 600},
        {id: "exp3", name: "Utilities", type: "Fixed", paymentAccountId: "acc1", amount: 200},
        {id: "exp4", name: "Car Payment", type: "Amortized", paymentAccountId: "acc1", 
            principal: 25000, apr: 4.5, termYears: 5, startDate: "2023-01"},
        {id: "exp5", name: "Mortgage", type: "Amortized", paymentAccountId: "acc1", 
            principal: 300000, apr: 3.5, termYears: 30, startDate: "2023-01"},
        {id: "exp6", name: "Dining Out", type: "Fixed", paymentAccountId: "acc1", amount: 400},
        {id: "exp7", name: "Entertainment", type: "Fixed", paymentAccountId: "acc1", amount: 200},
        {id: "exp8", name: "Insurance", type: "Fixed", paymentAccountId: "acc1", amount: 150},
        {id: "exp9", name: "Subscriptions", type: "Fixed", paymentAccountId: "acc1", amount: 50},
        {id: "exp10", name: "Internet/Phone", type: "Fixed", paymentAccountId: "acc1", amount: 150},
        {id: "exp11", name: "Tithings", type: "Percentage", paymentAccountId: "acc1", percent: 10}
    ],
    transfers: [
        {id: "trn1", amount: 500, fromAccountId: "acc1", toAccountId: "acc3", increases: []},
        {
            id: "trn2", amount: 300, fromAccountId: "acc1", toAccountId: "acc2",
            increases: [
                {date: "2026-01", amount: 400},
                {date: "2027-01", amount: 500}
            ]
        }
    ]
};

let currentEditItem = null;
let currentEditType = null;
let cashFlowChart = null;
let balanceChart = null;
let projectionMonths = 12;

// Initialize the application
function init() {
    renderSidebar();
    renderDashboard();
    showDashboard();
    updateProjectionTitles();
}

// Update projection length
function updateProjectionLength() {
    projectionMonths = parseInt(document.getElementById('projectionLength').value);
    updateProjectionTitles();
    renderDashboard();
}

function updateProjectionTitles() {
    const years = Math.floor(projectionMonths / 12);
    const months = projectionMonths % 12;
    let timeLabel = '';

    if (years > 0 && months > 0) {
        timeLabel = `${years}yr ${months}mo`;
    } else if (years > 0) {
        timeLabel = `${years} Year${years > 1 ? 's' : ''}`;
    } else {
        timeLabel = `${months} Month${months > 1 ? 's' : ''}`;
    }

    document.getElementById('cash-flow-title').textContent = `📈 ${timeLabel} Cash Flow Projection`;
    document.getElementById('balance-title').textContent = `💳 ${timeLabel} Account Balance Trends`;
    document.getElementById('projections-title').textContent = `📅 ${timeLabel} Monthly Projections`;
}

// View management
function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('editor').style.display = 'none';
}

function showEditor() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('editor').style.display = 'block';
}

// Call init when the page loads
window.onload = init;
// Render sidebar lists
function renderSidebar() {
    renderAccountsList();
    renderIncomeList();
    renderExpensesList();
    renderTransfersList();
}

function renderAccountsList() {
    const container = document.getElementById('accounts-list');
    container.innerHTML = '';

    financialModel.accounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'item';
        item.onclick = () => editItem(account, 'account');
        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${account.name}</span>
                <span class="item-amount">$${account.balance.toLocaleString()}</span>
            </div>
            <div class="item-details">${account.type}</div>
        `;
        container.appendChild(item);
    });
}

function renderIncomeList() {
    const container = document.getElementById('income-list');
    container.innerHTML = '';

    financialModel.incomes.forEach(income => {
        const item = document.createElement('div');
        item.className = 'item';
        item.onclick = () => editItem(income, 'income');

        const raisesInfo = income.raises && income.raises.length > 0 
            ? `${income.raises.length} raises scheduled` 
            : 'No raises scheduled';

        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${income.name}</span>
                <span class="item-amount">$${income.amount.toLocaleString()}</span>
            </div>
            <div class="item-details">${raisesInfo}</div>
        `;
        container.appendChild(item);
    });
}

function renderExpensesList() {
    const container = document.getElementById('expenses-list');
    container.innerHTML = '';

    financialModel.expenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'item';
        item.onclick = () => editItem(expense, 'expense');

        let amountText = '';
        let detailText = expense.type;

        if (expense.type === 'Fixed') {
            amountText = `$${expense.amount.toLocaleString()}`;
        } else if (expense.type === 'Amortized') {
            const payment = calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
            amountText = `$${payment.toLocaleString()}`;
            detailText = `${expense.type} - ${expense.termYears}yr @ ${expense.apr}%`;
        } else if (expense.type === 'Percentage') {
            amountText = `${expense.percent}%`;
            detailText = `${expense.type} of income`;
        }

        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${expense.name}</span>
                <span class="item-amount">${amountText}</span>
            </div>
            <div class="item-details">${detailText}</div>
        `;
        container.appendChild(item);
    });
}

function renderTransfersList() {
    const container = document.getElementById('transfers-list');
    container.innerHTML = '';

    financialModel.transfers.forEach(transfer => {
        const item = document.createElement('div');
        item.className = 'item';
        item.onclick = () => editItem(transfer, 'transfer');

        const fromAccount = financialModel.accounts.find(acc => acc.id === transfer.fromAccountId);
        const toAccount = financialModel.accounts.find(acc => acc.id === transfer.toAccountId);

        const increasesInfo = transfer.increases && transfer.increases.length > 0 
            ? `${transfer.increases.length} increases scheduled` 
            : 'No increases scheduled';

        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${fromAccount?.name || 'Unknown'} → ${toAccount?.name || 'Unknown'}</span>
                <span class="item-amount">$${transfer.amount.toLocaleString()}</span>
            </div>
            <div class="item-details">${increasesInfo}</div>
        `;
        container.appendChild(item);
    });
}

// Helper function for amortized payments
function calculateAmortizedPayment(principal, apr, termYears) {
    const monthlyRate = apr / 100 / 12;
    const totalPayments = termYears * 12;
    
    if (monthlyRate === 0 || totalPayments === 0) return 0;
    
    const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                   (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    return Math.round(payment * 100) / 100;
}
// Add new items
function addAccount() {
    const newAccount = {
        id: `acc${Date.now()}`,
        name: "New Account",
        type: "Checking",
        balance: 0
    };
    financialModel.accounts.push(newAccount);
    renderSidebar();
    editItem(newAccount, 'account');
}

function addIncome() {
    const newIncome = {
        id: `inc${Date.now()}`,
        name: "New Income",
        amount: 0,
        depositAccountId: financialModel.accounts[0]?.id || "",
        raises: []
    };
    financialModel.incomes.push(newIncome);
    renderSidebar();
    editItem(newIncome, 'income');
}

function addExpense() {
    const newExpense = {
        id: `exp${Date.now()}`,
        name: "New Expense",
        type: "Fixed",
        paymentAccountId: financialModel.accounts[0]?.id || "",
        amount: 0
    };
    financialModel.expenses.push(newExpense);
    renderSidebar();
    editItem(newExpense, 'expense');
}

function addTransfer() {
    const newTransfer = {
        id: `trn${Date.now()}`,
        amount: 0,
        fromAccountId: financialModel.accounts[0]?.id || "",
        toAccountId: financialModel.accounts[1]?.id || "",
        increases: []
    };
    financialModel.transfers.push(newTransfer);
    renderSidebar();
    editItem(newTransfer, 'transfer');
}

// Edit item
function editItem(item, type) {
    currentEditItem = item;
    currentEditType = type;

    document.getElementById('editor-title').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('editor-content').innerHTML = generateEditor(item, type);

    showEditor();
}

function generateEditor(item, type) {
    let html = '';

    if (type === 'account') {
        html = `
            <div class="form-group">
                <label>Account Name</label>
                <input type="text" id="edit-name" value="${item.name}">
            </div>
            <div class="form-group">
                <label>Account Type</label>
                <select id="edit-type">
                    <option value="Checking" ${item.type === 'Checking' ? 'selected' : ''}>Checking</option>
                    <option value="Savings" ${item.type === 'Savings' ? 'selected' : ''}>Savings</option>
                    <option value="Investment" ${item.type === 'Investment' ? 'selected' : ''}>Investment</option>
                </select>
            </div>
            <div class="form-group">
                <label>Current Balance</label>
                <input type="number" id="edit-balance" value="${item.balance}" step="0.01">
            </div>
        `;
    } else if (type === 'income') {
        html = `
            <div class="form-group">
                <label>Income Name</label>
                <input type="text" id="edit-name" value="${item.name}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Monthly Amount</label>
                    <input type="number" id="edit-amount" value="${item.amount}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Deposit Account</label>
                    <select id="edit-depositAccountId">
                        ${financialModel.accounts.map(acc => 
                            `<option value="${acc.id}" ${acc.id === item.depositAccountId ? 'selected' : ''}>${acc.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Raises</label>
                <button class="btn btn-primary" onclick="addRaise()">Add Raise</button>
            </div>
            <div id="raises-list">
                ${(item.raises || []).map((raise, index) => `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="month" value="${raise.date}" onchange="updateRaise(${index}, 'date', this.value)">
                        </div>
                        <div class="form-group">
                            <label>Percent (%)</label>
                            <input type="number" value="${raise.percent}" step="0.1" onchange="updateRaise(${index}, 'percent', this.value)">
                        </div>
                        <button class="btn btn-danger" onclick="removeRaise(${index})">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (type === 'expense') {
        html = `
            <div class="form-group">
                <label>Expense Name</label>
                <input type="text" id="edit-name" value="${item.name}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Expense Type</label>
                    <select id="edit-type" onchange="updateExpenseType()">
                        <option value="Fixed" ${item.type === 'Fixed' ? 'selected' : ''}>Fixed</option>
                        <option value="Amortized" ${item.type === 'Amortized' ? 'selected' : ''}>Amortized</option>
                        <option value="Percentage" ${item.type === 'Percentage' ? 'selected' : ''}>Percentage</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Account</label>
                    <select id="edit-paymentAccountId">
                        ${financialModel.accounts.map(acc => 
                            `<option value="${acc.id}" ${acc.id === item.paymentAccountId ? 'selected' : ''}>${acc.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div id="expense-type-fields">
                ${generateExpenseTypeFields(item)}
            </div>
        `;
    } else if (type === 'transfer') {
        html = `
            <div class="form-group">
                <label>Monthly Amount</label>
                <input type="number" id="edit-amount" value="${item.amount}" step="0.01">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>From Account</label>
                    <select id="edit-fromAccountId">
                        ${financialModel.accounts.map(acc => 
                            `<option value="${acc.id}" ${acc.id === item.fromAccountId ? 'selected' : ''}>${acc.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>To Account</label>
                    <select id="edit-toAccountId">
                        ${financialModel.accounts.map(acc => 
                            `<option value="${acc.id}" ${acc.id === item.toAccountId ? 'selected' : ''}>${acc.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Scheduled Increases</label>
                <button class="btn btn-primary" onclick="addIncrease()">Add Increase</button>
            </div>
            <div id="increases-list">
                ${(item.increases || []).map((increase, index) => `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="month" value="${increase.date}" onchange="updateIncrease(${index}, 'date', this.value)">
                        </div>
                        <div class="form-group">
                            <label>New Amount</label>
                            <input type="number" value="${increase.amount}" step="0.01" onchange="updateIncrease(${index}, 'amount', this.value)">
                        </div>
                        <button class="btn btn-danger" onclick="removeIncrease(${index})">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    return html;
}

function generateExpenseTypeFields(item) {
    if (item.type === 'Fixed') {
        return `
            <div class="form-group">
                <label>Monthly Amount</label>
                <input type="number" id="edit-amount" value="${item.amount || 0}" step="0.01">
            </div>
        `;
    } else if (item.type === 'Amortized') {
        const payment = item.principal && item.apr && item.termYears ? 
            calculateAmortizedPayment(item.principal, item.apr, item.termYears) : 0;
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Principal Amount</label>
                    <input type="number" id="edit-principal" value="${item.principal || 0}" step="0.01" onchange="updateAmortizedPreview()">
                </div>
                <div class="form-group">
                    <label>APR (%)</label>
                    <input type="number" id="edit-apr" value="${item.apr || 0}" step="0.01" onchange="updateAmortizedPreview()">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Term (Years)</label>
                    <input type="number" id="edit-termYears" value="${item.termYears || 0}" step="1" onchange="updateAmortizedPreview()">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" id="edit-startDate" value="${item.startDate || ''}">
                </div>
            </div>
            <div class="alert alert-success">
                <strong>Monthly Payment: $<span id="amortized-preview">${payment.toLocaleString()}</span></strong>
            </div>
        `;
    } else if (item.type === 'Percentage') {
        return `
            <div class="form-group">
                <label>Percentage of Income (%)</label>
                <input type="number" id="edit-percent" value="${item.percent || 0}" step="0.1">
            </div>
        `;
    }
    return '';
}

function updateExpenseType() {
    const type = document.getElementById('edit-type').value;
    currentEditItem.type = type;
    document.getElementById('expense-type-fields').innerHTML = generateExpenseTypeFields(currentEditItem);
}

function updateAmortizedPreview() {
    const principal = parseFloat(document.getElementById('edit-principal').value) || 0;
    const apr = parseFloat(document.getElementById('edit-apr').value) || 0;
    const termYears = parseFloat(document.getElementById('edit-termYears').value) || 0;

    if (principal > 0 && apr > 0 && termYears > 0) {
        const payment = calculateAmortizedPayment(principal, apr, termYears);
        document.getElementById('amortized-preview').textContent = payment.toLocaleString();
    }
}

// Raise and increase management
function addRaise() {
    if (!currentEditItem.raises) currentEditItem.raises = [];
    currentEditItem.raises.push({date: '', percent: 0});
    document.getElementById('editor-content').innerHTML = generateEditor(currentEditItem, currentEditType);
}

function updateRaise(index, field, value) {
    if (currentEditItem.raises && currentEditItem.raises[index]) {
        currentEditItem.raises[index][field] = field === 'percent' ? parseFloat(value) : value;
    }
}

function removeRaise(index) {
    if (currentEditItem.raises) {
        currentEditItem.raises.splice(index, 1);
        document.getElementById('editor-content').innerHTML = generateEditor(currentEditItem, currentEditType);
    }
}

function addIncrease() {
    if (!currentEditItem.increases) currentEditItem.increases = [];
    currentEditItem.increases.push({date: '', amount: 0});
    document.getElementById('editor-content').innerHTML = generateEditor(currentEditItem, currentEditType);
}

function updateIncrease(index, field, value) {
    if (currentEditItem.increases && currentEditItem.increases[index]) {
        currentEditItem.increases[index][field] = field === 'amount' ? parseFloat(value) : value;
    }
}

function removeIncrease(index) {
    if (currentEditItem.increases) {
        currentEditItem.increases.splice(index, 1);
        document.getElementById('editor-content').innerHTML = generateEditor(currentEditItem, currentEditType);
    }
}

// Save current item
function saveCurrentItem() {
    if (!currentEditItem || !currentEditType) return;

    if (currentEditType === 'account') {
        currentEditItem.name = document.getElementById('edit-name').value;
        currentEditItem.type = document.getElementById('edit-type').value;
        currentEditItem.balance = parseFloat(document.getElementById('edit-balance').value) || 0;
    } else if (currentEditType === 'income') {
        currentEditItem.name = document.getElementById('edit-name').value;
        currentEditItem.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        currentEditItem.depositAccountId = document.getElementById('edit-depositAccountId').value;
    } else if (currentEditType === 'expense') {
        currentEditItem.name = document.getElementById('edit-name').value;
        currentEditItem.type = document.getElementById('edit-type').value;
        currentEditItem.paymentAccountId = document.getElementById('edit-paymentAccountId').value;

        if (currentEditItem.type === 'Fixed') {
            currentEditItem.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        } else if (currentEditItem.type === 'Amortized') {
            currentEditItem.principal = parseFloat(document.getElementById('edit-principal').value) || 0;
            currentEditItem.apr = parseFloat(document.getElementById('edit-apr').value) || 0;
            currentEditItem.termYears = parseFloat(document.getElementById('edit-termYears').value) || 0;
            currentEditItem.startDate = document.getElementById('edit-startDate').value;
        } else if (currentEditItem.type === 'Percentage') {
            currentEditItem.percent = parseFloat(document.getElementById('edit-percent').value) || 0;
        }
    } else if (currentEditType === 'transfer') {
        currentEditItem.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        currentEditItem.fromAccountId = document.getElementById('edit-fromAccountId').value;
        currentEditItem.toAccountId = document.getElementById('edit-toAccountId').value;
    }

    renderSidebar();
    renderDashboard();
    showDashboard();
}

function cancelEdit() {
    showDashboard();
}

function deleteCurrentItem() {
    if (!currentEditItem || !currentEditType) return;

    if (confirm(`Are you sure you want to delete this ${currentEditType}?`)) {
        if (currentEditType === 'account') {
            financialModel.accounts = financialModel.accounts.filter(item => item.id !== currentEditItem.id);
        } else if (currentEditType === 'income') {
            financialModel.incomes = financialModel.incomes.filter(item => item.id !== currentEditItem.id);
        } else if (currentEditType === 'expense') {
            financialModel.expenses = financialModel.expenses.filter(item => item.id !== currentEditItem.id);
        } else if (currentEditType === 'transfer') {
            financialModel.transfers = financialModel.transfers.filter(item => item.id !== currentEditItem.id);
        }

        renderSidebar();
        renderDashboard();
        showDashboard();
    }
}

// Dashboard rendering
function renderDashboard() {
    renderMetrics();
    renderAccountBalances();
    renderAlerts();
    renderCashFlowChart();
    renderBalanceChart();
    renderProjectionsTable();
}

// Render key metrics
function renderMetrics() {
    // Calculate current monthly income
    let currentMonthlyIncome = 0;
    financialModel.incomes.forEach(income => {
        currentMonthlyIncome += income.amount;
    });
    
    // Calculate current monthly expenses
    let currentMonthlyExpenses = 0;
    financialModel.expenses.forEach(expense => {
        if (expense.type === 'Fixed') {
            currentMonthlyExpenses += expense.amount;
        } else if (expense.type === 'Amortized') {
            currentMonthlyExpenses += calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
        } else if (expense.type === 'Percentage') {
            currentMonthlyExpenses += currentMonthlyIncome * (expense.percent / 100);
        }
    });
    
    // Calculate net cash flow and savings rate
    const netCashFlow = currentMonthlyIncome - currentMonthlyExpenses;
    const savingsRate = currentMonthlyIncome > 0 ? (netCashFlow / currentMonthlyIncome) * 100 : 0;
    
    // Update the metrics in the UI
    document.getElementById('metric-income').textContent = '$' + currentMonthlyIncome.toLocaleString();
    document.getElementById('metric-expenses').textContent = '$' + currentMonthlyExpenses.toLocaleString();
    document.getElementById('metric-cashflow').textContent = '$' + netCashFlow.toLocaleString();
    document.getElementById('metric-savings-rate').textContent = savingsRate.toFixed(1) + '%';
    
    // Add color coding for net cash flow
    if (netCashFlow > 0) {
        document.getElementById('metric-cashflow').style.color = '#27ae60';
    } else if (netCashFlow < 0) {
        document.getElementById('metric-cashflow').style.color = '#e74c3c';
    } else {
        document.getElementById('metric-cashflow').style.color = '#2c3e50';
    }
}

// Render account balances with projections
function renderAccountBalances() {
    const container = document.getElementById('account-balances-container');
    container.innerHTML = '';
    
    let totalAssets = 0;
    
    // Create cards for each account
    financialModel.accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        
        card.innerHTML = `
            <div class="account-name">${account.name}</div>
            <div class="account-type">${account.type}</div>
            <div class="account-balance">$${account.balance.toLocaleString()}</div>
        `;
        
        container.appendChild(card);
        totalAssets += account.balance;
    });
    
    // Add total assets card
    const totalCard = document.createElement('div');
    totalCard.className = 'account-card total-assets';
    totalCard.innerHTML = `
        <div class="account-name">Total Assets</div>
        <div class="account-balance">$${totalAssets.toLocaleString()}</div>
    `;
    container.appendChild(totalCard);
}

// Render alerts
function renderAlerts() {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    
    const alerts = generateAlerts();
    
    if (alerts.length === 0) {
        const noAlertsMessage = document.createElement('div');
        noAlertsMessage.className = 'alert-item success';
        noAlertsMessage.innerHTML = `
            <div class="alert-title">No Alerts</div>
            <div class="alert-message">Your financial model looks healthy!</div>
        `;
        container.appendChild(noAlertsMessage);
    } else {
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${alert.type}`;
            alertItem.innerHTML = `
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
            `;
            container.appendChild(alertItem);
        });
    }
}

// Generate alerts based on the financial model
function generateAlerts() {
    const alerts = [];
    
    // Calculate current monthly income and expenses
    let currentMonthlyIncome = 0;
    financialModel.incomes.forEach(income => {
        currentMonthlyIncome += income.amount;
    });
    
    let currentMonthlyExpenses = 0;
    financialModel.expenses.forEach(expense => {
        if (expense.type === 'Fixed') {
            currentMonthlyExpenses += expense.amount;
        } else if (expense.type === 'Amortized') {
            currentMonthlyExpenses += calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
        } else if (expense.type === 'Percentage') {
            currentMonthlyExpenses += currentMonthlyIncome * (expense.percent / 100);
        }
    });
    
    // Check for high expense ratio
    const expenseRatio = currentMonthlyIncome > 0 ? (currentMonthlyExpenses / currentMonthlyIncome) * 100 : 0;
    if (expenseRatio > 90) {
        alerts.push({
            type: 'warning',
            title: 'High expense ratio - limited savings capacity',
            message: 'Your expenses are taking up most of your income, limiting your ability to save.'
        });
    }
    
    // Check for low emergency fund
    const savingsAccount = financialModel.accounts.find(acc => acc.type === 'Savings');
    const monthlyCosts = currentMonthlyExpenses;
    if (savingsAccount && savingsAccount.balance < monthlyCosts * 3) {
        alerts.push({
            type: 'warning',
            title: 'Tight cash flow - build emergency fund',
            message: 'Consider building an emergency fund of 3-6 months of expenses.'
        });
    }
    
    // Add projection alert
    const projectionLength = document.getElementById('projectionLength').value;
    alerts.push({
        type: 'info',
        title: `Currently projecting ${projectionLength === '12' ? '1 year' : projectionLength/12 + ' years'} into the future`,
        message: 'Adjust the projection length in the header to see different timeframes.'
    });
    
    return alerts;
}

function renderCashFlowChart() {
    // Generate projection data
    const { months, incomeData, expenseData, netFlowData } = generateCashFlowData();
    
    // Prepare chart data
    const cashFlowData = {
        labels: months,
        datasets: [{
            label: 'Income',
            data: incomeData,
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            tension: 0.4
        }, {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.4
        }, {
            label: 'Net Cash Flow',
            data: netFlowData,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4
        }]
    };
    
    // Render cash flow chart
    const cashFlowCtx = document.getElementById('cashFlowChart').getContext('2d');
    if (cashFlowChart) cashFlowChart.destroy();
    
    cashFlowChart = new Chart(cashFlowCtx, {
        type: 'line',
        data: cashFlowData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderBalanceChart() {
    // Generate projection data
    const { months, accountBalances } = generateBalanceData();
    
    // Prepare datasets for each account
    const datasets = financialModel.accounts.map((account, index) => {
        const color = getRandomColor();
        return {
            label: account.name,
            data: accountBalances[account.id],
            borderColor: color,
            backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
            tension: 0.4
        };
    });
    
    // Prepare chart data
    const balanceData = {
        labels: months,
        datasets: datasets
    };
    
    // Render balance chart
    const balanceCtx = document.getElementById('balanceChart').getContext('2d');
    if (balanceChart) balanceChart.destroy();
    
    balanceChart = new Chart(balanceCtx, {
        type: 'line',
        data: balanceData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderProjectionsTable() {
    const { months, monthlyData } = generateProjectionTableData();
    
    const table = document.getElementById('projections-table');
    table.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Month</th><th>Income</th><th>Expenses</th><th>Net Flow</th>';
    financialModel.accounts.forEach(account => {
        headerRow.innerHTML += `<th>${account.name}</th>`;
    });
    table.appendChild(headerRow);
    
    // Create data rows
    months.forEach((month, index) => {
        const row = document.createElement('tr');
        const data = monthlyData[index];
        
        row.innerHTML = `
            <td>${month}</td>
            <td>$${data.income.toLocaleString()}</td>
            <td>$${data.expenses.toLocaleString()}</td>
            <td>$${data.netFlow.toLocaleString()}</td>
        `;
        
        financialModel.accounts.forEach(account => {
            row.innerHTML += `<td>$${data.accountBalances[account.id].toLocaleString()}</td>`;
        });
        
        table.appendChild(row);
    });
}

// Data generation functions
function generateCashFlowData() {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const netFlowData = [];
    
    const startDate = new Date();
    
    for (let i = 0; i < projectionMonths; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Calculate income for this month
        let monthlyIncome = 0;
        financialModel.incomes.forEach(income => {
            let amount = income.amount;
            
            // Apply raises if applicable
            if (income.raises) {
                income.raises.forEach(raise => {
                    if (raise.date && raise.date <= monthStr) {
                        amount *= (1 + raise.percent / 100);
                    }
                });
            }
            
            monthlyIncome += amount;
        });
        
        // Calculate expenses for this month
        let monthlyExpenses = 0;
        financialModel.expenses.forEach(expense => {
            if (expense.type === 'Fixed') {
                monthlyExpenses += expense.amount;
            } else if (expense.type === 'Amortized') {
                // Only apply if the loan has started
                if (!expense.startDate || expense.startDate <= monthStr) {
                    monthlyExpenses += calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
                }
            } else if (expense.type === 'Percentage') {
                monthlyExpenses += monthlyIncome * (expense.percent / 100);
            }
        });
        
        // Add transfers to expenses
        financialModel.transfers.forEach(transfer => {
            let amount = transfer.amount;
            
            // Apply increases if applicable
            if (transfer.increases) {
                transfer.increases.forEach(increase => {
                    if (increase.date && increase.date <= monthStr) {
                        amount = increase.amount;
                    }
                });
            }
            
            // Transfers don't affect net cash flow, they just move money between accounts
        });
        
        const netFlow = monthlyIncome - monthlyExpenses;
        
        incomeData.push(monthlyIncome);
        expenseData.push(monthlyExpenses);
        netFlowData.push(netFlow);
    }
    
    return { months, incomeData, expenseData, netFlowData };
}

function generateBalanceData() {
    const months = [];
    const accountBalances = {};
    
    // Initialize account balances
    financialModel.accounts.forEach(account => {
        accountBalances[account.id] = [];
    });
    
    const startDate = new Date();
    let currentBalances = {};
    
    // Initialize current balances with starting balances
    financialModel.accounts.forEach(account => {
        currentBalances[account.id] = account.balance;
    });
    
    for (let i = 0; i < projectionMonths; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Calculate income for this month and add to deposit accounts
        financialModel.incomes.forEach(income => {
            let amount = income.amount;
            
            // Apply raises if applicable
            if (income.raises) {
                income.raises.forEach(raise => {
                    if (raise.date && raise.date <= monthStr) {
                        amount *= (1 + raise.percent / 100);
                    }
                });
            }
            
            if (income.depositAccountId && currentBalances[income.depositAccountId] !== undefined) {
                currentBalances[income.depositAccountId] += amount;
            }
        });
        
        // Calculate expenses for this month and subtract from payment accounts
        financialModel.expenses.forEach(expense => {
            let amount = 0;
            
            if (expense.type === 'Fixed') {
                amount = expense.amount;
            } else if (expense.type === 'Amortized') {
                // Only apply if the loan has started
                if (!expense.startDate || expense.startDate <= monthStr) {
                    amount = calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
                }
            } else if (expense.type === 'Percentage') {
                // Calculate total income for percentage-based expenses
                let totalIncome = 0;
                financialModel.incomes.forEach(income => {
                    let incomeAmount = income.amount;
                    
                    // Apply raises if applicable
                    if (income.raises) {
                        income.raises.forEach(raise => {
                            if (raise.date && raise.date <= monthStr) {
                                incomeAmount *= (1 + raise.percent / 100);
                            }
                        });
                    }
                    
                    totalIncome += incomeAmount;
                });
                
                amount = totalIncome * (expense.percent / 100);
            }
            
            if (expense.paymentAccountId && currentBalances[expense.paymentAccountId] !== undefined) {
                currentBalances[expense.paymentAccountId] -= amount;
            }
        });
        
        // Process transfers
        financialModel.transfers.forEach(transfer => {
            let amount = transfer.amount;
            
            // Apply increases if applicable
            if (transfer.increases) {
                transfer.increases.forEach(increase => {
                    if (increase.date && increase.date <= monthStr) {
                        amount = increase.amount;
                    }
                });
            }
            
            if (transfer.fromAccountId && currentBalances[transfer.fromAccountId] !== undefined &&
                transfer.toAccountId && currentBalances[transfer.toAccountId] !== undefined) {
                currentBalances[transfer.fromAccountId] -= amount;
                currentBalances[transfer.toAccountId] += amount;
            }
        });
        
        // Store current balances for this month
        financialModel.accounts.forEach(account => {
            accountBalances[account.id].push(currentBalances[account.id]);
        });
    }
    
    return { months, accountBalances };
}

function generateProjectionTableData() {
    const months = [];
    const monthlyData = [];
    
    const startDate = new Date();
    let currentBalances = {};
    
    // Initialize current balances with starting balances
    financialModel.accounts.forEach(account => {
        currentBalances[account.id] = account.balance;
    });
    
    for (let i = 0; i < projectionMonths; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Calculate income for this month
        let monthlyIncome = 0;
        financialModel.incomes.forEach(income => {
            let amount = income.amount;
            
            // Apply raises if applicable
            if (income.raises) {
                income.raises.forEach(raise => {
                    if (raise.date && raise.date <= monthStr) {
                        amount *= (1 + raise.percent / 100);
                    }
                });
            }
            
            monthlyIncome += amount;
            
            if (income.depositAccountId && currentBalances[income.depositAccountId] !== undefined) {
                currentBalances[income.depositAccountId] += amount;
            }
        });
        
        // Calculate expenses for this month
        let monthlyExpenses = 0;
        financialModel.expenses.forEach(expense => {
            let amount = 0;
            
            if (expense.type === 'Fixed') {
                amount = expense.amount;
            } else if (expense.type === 'Amortized') {
                // Only apply if the loan has started
                if (!expense.startDate || expense.startDate <= monthStr) {
                    amount = calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
                }
            } else if (expense.type === 'Percentage') {
                amount = monthlyIncome * (expense.percent / 100);
            }
            
            monthlyExpenses += amount;
            
            if (expense.paymentAccountId && currentBalances[expense.paymentAccountId] !== undefined) {
                currentBalances[expense.paymentAccountId] -= amount;
            }
        });
        
        // Process transfers
        financialModel.transfers.forEach(transfer => {
            let amount = transfer.amount;
            
            // Apply increases if applicable
            if (transfer.increases) {
                transfer.increases.forEach(increase => {
                    if (increase.date && increase.date <= monthStr) {
                        amount = increase.amount;
                    }
                });
            }
            
            if (transfer.fromAccountId && currentBalances[transfer.fromAccountId] !== undefined &&
                transfer.toAccountId && currentBalances[transfer.toAccountId] !== undefined) {
                currentBalances[transfer.fromAccountId] -= amount;
                currentBalances[transfer.toAccountId] += amount;
            }
        });
        
        // Store data for this month
        monthlyData.push({
            income: monthlyIncome,
            expenses: monthlyExpenses,
            netFlow: monthlyIncome - monthlyExpenses,
            accountBalances: { ...currentBalances }
        });
    }
    
    return { months, monthlyData };
}

function getRandomColor() {
    const colors = [
        'rgb(52, 152, 219)', // Blue
        'rgb(46, 204, 113)', // Green
        'rgb(155, 89, 182)', // Purple
        'rgb(52, 73, 94)',   // Dark Blue
        'rgb(243, 156, 18)', // Orange
        'rgb(231, 76, 60)',  // Red
        'rgb(26, 188, 156)'  // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Import/Export functionality
function exportModel() {
    const dataStr = JSON.stringify(financialModel, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial_model_${new Date().toISOString().substr(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importModel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedModel = JSON.parse(e.target.result);
            financialModel = importedModel;
            renderSidebar();
            renderDashboard();
            alert('Model imported successfully!');
        } catch (error) {
            alert('Error importing model: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function resetModel() {
    if (confirm('Are you sure you want to reset to the original model? This will lose all changes.')) {
        location.reload();
    }
}