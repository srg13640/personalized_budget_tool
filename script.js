// =================================================================
// MODEL & STATE
// =================================================================

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

// Global State
let currentEditItem = null;
let currentEditType = null;
let cashFlowChart = null;
let balanceChart = null;
let projectionMonths = 12;
let accountColorMap = {};

// =================================================================
// INITIALIZATION & VIEW MANAGEMENT
// =================================================================

window.onload = init;

function init() {
    assignChartColors();
    renderSidebar();
    renderDashboard();
    showDashboard();
    updateProjectionTitles();
}

function updateProjectionLength() {
    projectionMonths = parseInt(document.getElementById('projectionLength').value);
    renderDashboard();
    updateProjectionTitles();
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

function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('editor').style.display = 'none';
}

function showEditor() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('editor').style.display = 'block';
}

// =================================================================
// SIDEBAR & ITEM RENDERING
// =================================================================

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
            <div class="item-details">${account.type}</div>`;
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
        const raisesInfo = income.raises && income.raises.length > 0 ? `${income.raises.length} raises scheduled` : 'No raises scheduled';
        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${income.name}</span>
                <span class="item-amount">$${income.amount.toLocaleString()}</span>
            </div>
            <div class="item-details">${raisesInfo}</div>`;
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
            <div class="item-details">${detailText}</div>`;
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
        const increasesInfo = transfer.increases && transfer.increases.length > 0 ? `${transfer.increases.length} increases scheduled` : 'No increases scheduled';
        item.innerHTML = `
            <div class="item-header">
                <span class="item-name">${fromAccount?.name || '❓'} → ${toAccount?.name || '❓'}</span>
                <span class="item-amount">$${transfer.amount.toLocaleString()}</span>
            </div>
            <div class="item-details">${increasesInfo}</div>`;
        container.appendChild(item);
    });
}

// =================================================================
// CRUD (Create, Read, Update, Delete) & EDITOR
// =================================================================

function addAccount() {
    const newAccount = { id: `acc${Date.now()}`, name: "New Account", type: "Checking", balance: 0 };
    financialModel.accounts.push(newAccount);
    assignChartColors();
    renderSidebar();
    editItem(newAccount, 'account');
}

function addIncome() {
    const newIncome = { id: `inc${Date.now()}`, name: "New Income", amount: 0, depositAccountId: financialModel.accounts[0]?.id || "", raises: [] };
    financialModel.incomes.push(newIncome);
    renderSidebar();
    editItem(newIncome, 'income');
}

function addExpense() {
    const newExpense = { id: `exp${Date.now()}`, name: "New Expense", type: "Fixed", paymentAccountId: financialModel.accounts[0]?.id || "", amount: 0 };
    financialModel.expenses.push(newExpense);
    renderSidebar();
    editItem(newExpense, 'expense');
}

function addTransfer() {
    const newTransfer = { id: `trn${Date.now()}`, amount: 0, fromAccountId: financialModel.accounts[0]?.id || "", toAccountId: financialModel.accounts[1]?.id || "", increases: [] };
    financialModel.transfers.push(newTransfer);
    renderSidebar();
    editItem(newTransfer, 'transfer');
}

function editItem(item, type) {
    currentEditItem = item;
    currentEditType = type;
    document.getElementById('editor-title').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('editor-content').innerHTML = generateEditor(item, type);
    showEditor();
}

function saveCurrentItem() {
    if (!currentEditItem || !currentEditType) return;
    const findItem = (arr) => arr.find(i => i.id === currentEditItem.id);

    if (currentEditType === 'account') {
        const item = findItem(financialModel.accounts);
        item.name = document.getElementById('edit-name').value;
        item.type = document.getElementById('edit-type').value;
        item.balance = parseFloat(document.getElementById('edit-balance').value) || 0;
    } else if (currentEditType === 'income') {
        const item = findItem(financialModel.incomes);
        item.name = document.getElementById('edit-name').value;
        item.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        item.depositAccountId = document.getElementById('edit-depositAccountId').value;
    } else if (currentEditType === 'expense') {
        const item = findItem(financialModel.expenses);
        item.name = document.getElementById('edit-name').value;
        item.type = document.getElementById('edit-type').value;
        item.paymentAccountId = document.getElementById('edit-paymentAccountId').value;
        if (item.type === 'Fixed') {
            item.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        } else if (item.type === 'Amortized') {
            item.principal = parseFloat(document.getElementById('edit-principal').value) || 0;
            item.apr = parseFloat(document.getElementById('edit-apr').value) || 0;
            item.termYears = parseFloat(document.getElementById('edit-termYears').value) || 0;
            item.startDate = document.getElementById('edit-startDate').value;
        } else if (item.type === 'Percentage') {
            item.percent = parseFloat(document.getElementById('edit-percent').value) || 0;
        }
    } else if (currentEditType === 'transfer') {
        const item = findItem(financialModel.transfers);
        item.amount = parseFloat(document.getElementById('edit-amount').value) || 0;
        item.fromAccountId = document.getElementById('edit-fromAccountId').value;
        item.toAccountId = document.getElementById('edit-toAccountId').value;
    }
    renderSidebar();
    renderDashboard();
    showDashboard();
}

function deleteCurrentItem() {
    if (!currentEditItem || !currentEditType || !confirm(`Are you sure you want to delete this ${currentEditType}?`)) return;
    
    const removeItem = (arr) => arr.filter(item => item.id !== currentEditItem.id);
    const typeToArrayMap = {
        'account': 'accounts', 'income': 'incomes', 'expense': 'expenses', 'transfer': 'transfers'
    };
    const arrayName = typeToArrayMap[currentEditType];
    if (arrayName) {
        financialModel[arrayName] = removeItem(financialModel[arrayName]);
    }
    if (currentEditType === 'account') assignChartColors();

    renderSidebar();
    renderDashboard();
    showDashboard();
}

function cancelEdit() {
    // To prevent saving partial changes from the editor, we re-render
    renderSidebar(); 
    showDashboard();
}

// (Editor HTML generation and dynamic updates remain largely the same, but are included for completeness)
function generateEditor(item, type) {
    let html = '';
    const accountOptions = financialModel.accounts.map(acc => `<option value="${acc.id}" ${acc.id === (item.depositAccountId || item.paymentAccountId || item.fromAccountId || item.toAccountId) ? 'selected' : ''}>${acc.name}</option>`).join('');

    if (type === 'account') {
        html = `<div class="form-group"><label>Account Name</label><input type="text" id="edit-name" value="${item.name}"></div>
                <div class="form-group"><label>Account Type</label><select id="edit-type">
                    <option value="Checking" ${item.type === 'Checking' ? 'selected' : ''}>Checking</option>
                    <option value="Savings" ${item.type === 'Savings' ? 'selected' : ''}>Savings</option>
                    <option value="Investment" ${item.type === 'Investment' ? 'selected' : ''}>Investment</option>
                </select></div>
                <div class="form-group"><label>Current Balance</label><input type="number" id="edit-balance" value="${item.balance}" step="0.01"></div>`;
    } else if (type === 'income') {
        html = `<div class="form-group"><label>Income Name</label><input type="text" id="edit-name" value="${item.name}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Monthly Amount</label><input type="number" id="edit-amount" value="${item.amount}" step="0.01"></div>
                    <div class="form-group"><label>Deposit Account</label><select id="edit-depositAccountId">${accountOptions}</select></div>
                </div>
                <div class="form-group"><label>Raises</label><button class="btn btn-sm btn-primary" onclick="addRaise()">Add Raise</button></div>
                <div id="raises-list">${(item.raises || []).map((raise, index) => `
                    <div class="form-row">
                        <div class="form-group"><label>Date</label><input type="month" value="${raise.date}" onchange="updateRaise(${index}, 'date', this.value)"></div>
                        <div class="form-group"><label>Percent (%)</label><input type="number" value="${raise.percent}" step="0.1" onchange="updateRaise(${index}, 'percent', this.value)"></div>
                        <button class="btn btn-sm btn-danger" onclick="removeRaise(${index})">X</button>
                    </div>`).join('')}</div>`;
    } else if (type === 'expense') {
        html = `<div class="form-group"><label>Expense Name</label><input type="text" id="edit-name" value="${item.name}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Expense Type</label><select id="edit-type" onchange="updateExpenseType()">
                        <option value="Fixed" ${item.type === 'Fixed' ? 'selected' : ''}>Fixed</option>
                        <option value="Amortized" ${item.type === 'Amortized' ? 'selected' : ''}>Amortized</option>
                        <option value="Percentage" ${item.type === 'Percentage' ? 'selected' : ''}>Percentage</option>
                    </select></div>
                    <div class="form-group"><label>Payment Account</label><select id="edit-paymentAccountId">${accountOptions}</select></div>
                </div>
                <div id="expense-type-fields">${generateExpenseTypeFields(item)}</div>`;
    } else if (type === 'transfer') {
        html = `<div class="form-group"><label>Monthly Amount</label><input type="number" id="edit-amount" value="${item.amount}" step="0.01"></div>
                <div class="form-row">
                    <div class="form-group"><label>From Account</label><select id="edit-fromAccountId">${financialModel.accounts.map(acc => `<option value="${acc.id}" ${acc.id === item.fromAccountId ? 'selected' : ''}>${acc.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>To Account</label><select id="edit-toAccountId">${financialModel.accounts.map(acc => `<option value="${acc.id}" ${acc.id === item.toAccountId ? 'selected' : ''}>${acc.name}</option>`).join('')}</select></div>
                </div>
                <div class="form-group"><label>Scheduled Increases</label><button class="btn btn-sm btn-primary" onclick="addIncrease()">Add Increase</button></div>
                <div id="increases-list">${(item.increases || []).map((increase, index) => `
                    <div class="form-row">
                        <div class="form-group"><label>Date</label><input type="month" value="${increase.date}" onchange="updateIncrease(${index}, 'date', this.value)"></div>
                        <div class="form-group"><label>New Amount</label><input type="number" value="${increase.amount}" step="0.01" onchange="updateIncrease(${index}, 'amount', this.value)"></div>
                        <button class="btn btn-sm btn-danger" onclick="removeIncrease(${index})">X</button>
                    </div>`).join('')}</div>`;
    }
    return html;
}

function generateExpenseTypeFields(item) {
    if (item.type === 'Fixed') {
        return `<div class="form-group"><label>Monthly Amount</label><input type="number" id="edit-amount" value="${item.amount || 0}" step="0.01"></div>`;
    } else if (item.type === 'Amortized') {
        const payment = item.principal && item.apr && item.termYears ? calculateAmortizedPayment(item.principal, item.apr, item.termYears) : 0;
        return `<div class="form-row">
                    <div class="form-group"><label>Principal</label><input type="number" id="edit-principal" value="${item.principal || 0}" onchange="updateAmortizedPreview()"></div>
                    <div class="form-group"><label>APR (%)</label><input type="number" id="edit-apr" value="${item.apr || 0}" step="0.01" onchange="updateAmortizedPreview()"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Term (Years)</label><input type="number" id="edit-termYears" value="${item.termYears || 0}" step="1" onchange="updateAmortizedPreview()"></div>
                    <div class="form-group"><label>Start Date</label><input type="month" id="edit-startDate" value="${item.startDate || ''}"></div>
                </div>
                <div class="alert alert-success"><strong>Monthly Payment: $<span id="amortized-preview">${payment.toLocaleString()}</span></strong></div>`;
    } else if (item.type === 'Percentage') {
        return `<div class="form-group"><label>Percentage of Income (%)</label><input type="number" id="edit-percent" value="${item.percent || 0}" step="0.1"></div>`;
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
        document.getElementById('amortized-preview').textContent = calculateAmortizedPayment(principal, apr, termYears).toLocaleString();
    }
}

function addRaise() {
    if (!currentEditItem.raises) currentEditItem.raises = [];
    currentEditItem.raises.push({date: '', percent: 0});
    editItem(currentEditItem, currentEditType);
}

function updateRaise(index, field, value) {
    currentEditItem.raises[index][field] = field === 'percent' ? parseFloat(value) : value;
}

function removeRaise(index) {
    currentEditItem.raises.splice(index, 1);
    editItem(currentEditItem, currentEditType);
}

function addIncrease() {
    if (!currentEditItem.increases) currentEditItem.increases = [];
    currentEditItem.increases.push({date: '', amount: 0});
    editItem(currentEditItem, currentEditType);
}

function updateIncrease(index, field, value) {
    currentEditItem.increases[index][field] = field === 'amount' ? parseFloat(value) : value;
}

function removeIncrease(index) {
    currentEditItem.increases.splice(index, 1);
    editItem(currentEditItem, currentEditType);
}


// =================================================================
// DASHBOARD RENDERING & CALCULATIONS
// =================================================================

function renderDashboard() {
    // Generate the full projection data once.
    const projectionData = generateMonthlyProjections(projectionMonths);

    // Pass the generated data to the rendering functions.
    renderMetrics(projectionData);
    renderAccountBalances(projectionData);
    renderAlerts(projectionData);
    renderCashFlowChart(projectionData);
    renderBalanceChart(projectionData);
    renderProjectionsTable(projectionData);
}

function renderMetrics(projectionData) {
    const firstMonth = projectionData[0] || { income: 0, expenses: 0 };
    const netCashFlow = firstMonth.income - firstMonth.expenses;
    const savingsRate = firstMonth.income > 0 ? (netCashFlow / firstMonth.income) * 100 : 0;
    
    document.getElementById('metric-income').textContent = '$' + firstMonth.income.toLocaleString(undefined, { maximumFractionDigits: 0 });
    document.getElementById('metric-expenses').textContent = '$' + firstMonth.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 });
    document.getElementById('metric-cashflow').textContent = '$' + netCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 });
    document.getElementById('metric-savings-rate').textContent = savingsRate.toFixed(1) + '%';

    const cashflowMetric = document.getElementById('metric-cashflow');
    if (netCashFlow > 0) cashflowMetric.style.color = '#27ae60';
    else if (netCashFlow < 0) cashflowMetric.style.color = '#e74c3c';
    else cashflowMetric.style.color = '#2c3e50';
}

function renderAccountBalances(projectionData) {
    const container = document.getElementById('account-balances-container');
    container.innerHTML = '';
    
    const lastMonth = projectionData[projectionData.length - 1];
    if (!lastMonth) return; // Exit if there's no projection data

    let totalCurrentAssets = 0;
    let totalProjectedAssets = 0;

    financialModel.accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.style.borderLeftColor = accountColorMap[account.id] || '#3498db';

        const projectedBalance = lastMonth.balances[account.id];
        const change = projectedBalance - account.balance;
        const changeClass = change >= 0 ? 'balance-increase' : 'balance-decrease';
        const changeSign = change >= 0 ? '+' : '';
        const timeLabel = document.getElementById('projectionLength').selectedOptions[0].text;

        card.innerHTML = `
            <div class="account-name">${account.name}</div>
            <div class="account-type">${account.type}</div>
            <div class="account-balance">Now: $${account.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div class="account-projection">
                <span class="projection-label">in ${timeLabel}:</span>
                <span class="projection-value">$${projectedBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span class="projection-change ${changeClass}">(${changeSign}$${Math.abs(change).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
            </div>`;
        
        container.appendChild(card);
        totalCurrentAssets += account.balance;
        totalProjectedAssets += projectedBalance;
    });
    
    // Total Assets Card
    const totalCard = document.createElement('div');
    totalCard.className = 'account-card total-assets';
    const totalChange = totalProjectedAssets - totalCurrentAssets;
    totalCard.innerHTML = `
        <div class="account-name">Total Assets</div>
        <div class="account-balance">Now: $${totalCurrentAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div class="account-projection">
            <span class="projection-label">Projected:</span>
            <span class="projection-value">$${totalProjectedAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span class="projection-change ${totalChange >= 0 ? 'balance-increase' : 'balance-decrease'}">(${totalChange >= 0 ? '+' : ''}$${Math.abs(totalChange).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
        </div>`;
    container.appendChild(totalCard);
}

function renderAlerts(projectionData) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    const alerts = [];
    
    // Low Emergency Fund Alert
    const firstMonthExpenses = (projectionData[0] || {}).expenses || 0;
    const emergencyFundGoal = firstMonthExpenses * 3;
    const liquidAssets = financialModel.accounts
        .filter(acc => acc.type === 'Checking' || acc.type === 'Savings')
        .reduce((sum, acc) => sum + acc.balance, 0);

    if (liquidAssets < emergencyFundGoal) {
        alerts.push({ type: 'warning', title: 'Low Emergency Fund', message: `Your liquid assets ($${liquidAssets.toLocaleString()}) are below a 3-month expense cushion of $${emergencyFundGoal.toLocaleString()}.`});
    }

    // Negative Cash Flow Alert
    const negativeMonths = projectionData.filter(p => p.netFlow < 0).length;
    if (negativeMonths > 0) {
        alerts.push({ type: 'danger', title: 'Negative Cash Flow', message: `You have a projected negative cash flow in ${negativeMonths} of the next ${projectionMonths} months.` });
    }

    // If no alerts, show success message
    if (alerts.length === 0) {
        alerts.push({ type: 'success', title: 'All Clear!', message: 'Your financial projections look healthy.' });
    }
    
    alerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alert.type}`;
        alertItem.innerHTML = `<div class="alert-title">${alert.title}</div><div class="alert-message">${alert.message}</div>`;
        container.appendChild(alertItem);
    });
}

function renderCashFlowChart(projectionData) {
    const cashFlowCtx = document.getElementById('cashFlowChart').getContext('2d');
    if (cashFlowChart) cashFlowChart.destroy();
    
    cashFlowChart = new Chart(cashFlowCtx, {
        type: 'line',
        data: {
            labels: projectionData.map(p => p.monthLabel),
            datasets: [
                { label: 'Income', data: projectionData.map(p => p.income), borderColor: '#27ae60', backgroundColor: 'rgba(39, 174, 96, 0.1)', fill: true, tension: 0.3 },
                { label: 'Expenses', data: projectionData.map(p => p.expenses), borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', fill: true, tension: 0.3 },
                { label: 'Net Flow', data: projectionData.map(p => p.netFlow), borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', fill: true, tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: false, ticks: { callback: value => '$' + value.toLocaleString() }}},
            plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`}}}
        }
    });
}

function renderBalanceChart(projectionData) {
    const balanceCtx = document.getElementById('balanceChart').getContext('2d');
    if (balanceChart) balanceChart.destroy();
    
    balanceChart = new Chart(balanceCtx, {
        type: 'line',
        data: {
            labels: projectionData.map(p => p.monthLabel),
            datasets: financialModel.accounts.map(account => ({
                label: account.name,
                data: projectionData.map(p => p.balances[account.id]),
                borderColor: accountColorMap[account.id] || '#34495e',
                backgroundColor: (accountColorMap[account.id] || 'rgb(52,73,94)').replace(')', ', 0.1)').replace('rgb', 'rgba'),
                fill: true,
                tension: 0.3
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() }}},
            plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`}}}
        }
    });
}

function renderProjectionsTable(projectionData) {
    const table = document.getElementById('projections-table');
    table.innerHTML = ''; // Clear previous table
    if (projectionData.length === 0) return;

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Month', 'Income', 'Expenses', 'Net Flow', ...financialModel.accounts.map(acc => acc.name)];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    projectionData.forEach(p => {
        const row = tbody.insertRow();
        const format = (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        let cells = `<td>${p.monthLabel}</td>
                     <td>$${format(p.income)}</td>
                     <td>$${format(p.expenses)}</td>
                     <td>$${format(p.netFlow)}</td>`;
        financialModel.accounts.forEach(acc => {
            cells += `<td>$${format(p.balances[acc.id])}</td>`;
        });
        row.innerHTML = cells;
    });
}


// =================================================================
// CORE PROJECTION ENGINE
// =================================================================

function generateMonthlyProjections(monthsToProject) {
    const projections = [];
    const startDate = new Date();

    // Create stateful clones of items that change over time
    let effectiveIncomes = JSON.parse(JSON.stringify(financialModel.incomes));
    let effectiveTransfers = JSON.parse(JSON.stringify(financialModel.transfers));

    // Get initial balances
    let currentBalances = {};
    financialModel.accounts.forEach(account => {
        currentBalances[account.id] = account.balance;
    });

    for (let i = 0; i < monthsToProject; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Update effective amounts for THIS month
        effectiveIncomes.forEach(income => {
            const raiseForThisMonth = (income.raises || []).find(r => r.date === monthStr);
            if (raiseForThisMonth) {
                income.amount *= (1 + raiseForThisMonth.percent / 100);
            }
        });
        effectiveTransfers.forEach(transfer => {
            const increaseForThisMonth = (transfer.increases || []).find(inc => inc.date === monthStr);
            if (increaseForThisMonth) {
                transfer.amount = increaseForThisMonth.amount;
            }
        });

        // 1. Calculate Total Income
        let monthlyIncome = effectiveIncomes.reduce((sum, income) => sum + income.amount, 0);

        // 2. Calculate Total Expenses
        let monthlyExpenses = 0;
        financialModel.expenses.forEach(expense => {
            if (expense.type === 'Fixed') {
                monthlyExpenses += expense.amount;
            } else if (expense.type === 'Percentage') {
                monthlyExpenses += monthlyIncome * (expense.percent / 100);
            } else if (expense.type === 'Amortized' && expense.startDate && expense.termYears > 0) {
                const termMonths = expense.termYears * 12;
                const start = new Date(expense.startDate + '-01T12:00:00Z');
                const loanMonth = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
                if (loanMonth >= 0 && loanMonth < termMonths) {
                    monthlyExpenses += calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
                }
            }
        });

        // 3. Update account balances
        // Reset and apply incomes
        let nextBalances = { ...currentBalances };
        effectiveIncomes.forEach(income => {
            if (nextBalances[income.depositAccountId] !== undefined) {
                nextBalances[income.depositAccountId] += income.amount;
            }
        });
        // Apply expenses
        financialModel.expenses.forEach(expense => {
            if (nextBalances[expense.paymentAccountId] !== undefined) {
                let expenseAmount = 0;
                 if (expense.type === 'Fixed') expenseAmount = expense.amount;
                 else if (expense.type === 'Percentage') expenseAmount = monthlyIncome * (expense.percent / 100);
                 else if (expense.type === 'Amortized' && expense.startDate && expense.termYears > 0) {
                    const termMonths = expense.termYears * 12;
                    const start = new Date(expense.startDate + '-01T12:00:00Z');
                    const loanMonth = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
                    if (loanMonth >= 0 && loanMonth < termMonths) {
                        expenseAmount = calculateAmortizedPayment(expense.principal, expense.apr, expense.termYears);
                    }
                 }
                nextBalances[expense.paymentAccountId] -= expenseAmount;
            }
        });
        // Apply transfers
        effectiveTransfers.forEach(transfer => {
            if (nextBalances[transfer.fromAccountId] !== undefined) {
                nextBalances[transfer.fromAccountId] -= transfer.amount;
            }
            if (nextBalances[transfer.toAccountId] !== undefined) {
                nextBalances[transfer.toAccountId] += transfer.amount;
            }
        });

        // 4. Store this month's results and set up for next month
        projections.push({
            monthLabel: monthLabel,
            income: monthlyIncome,
            expenses: monthlyExpenses,
            netFlow: monthlyIncome - monthlyExpenses,
            balances: nextBalances
        });
        currentBalances = nextBalances; // The new becomes the current for the next iteration
    }
    return projections;
}


// =================================================================
// HELPER FUNCTIONS & UTILITIES
// =================================================================

function calculateAmortizedPayment(principal, apr, termYears) {
    const monthlyRate = apr / 100 / 12;
    const totalPayments = termYears * 12;
    if (monthlyRate === 0) return principal / totalPayments;
    if (totalPayments === 0) return 0;
    const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    return Math.round(payment * 100) / 100;
}

function assignChartColors() {
    const colors = ['#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c', '#1abc9c', '#34495e'];
    accountColorMap = {};
    financialModel.accounts.forEach((account, index) => {
        accountColorMap[account.id] = colors[index % colors.length];
    });
}

function exportModel() {
    const dataStr = JSON.stringify(financialModel, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial_model_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importModel(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.accounts && imported.incomes && imported.expenses && imported.transfers) {
                financialModel.accounts = imported.accounts;
                financialModel.incomes = imported.incomes;
                financialModel.expenses = imported.expenses;
                financialModel.transfers = imported.transfers;
                init(); // Re-initialize the whole app with the new data
                alert('Model imported successfully!');
            } else {
                alert('Error: Invalid model file format.');
            }
        } catch (error) {
            alert('Error importing model: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function resetModel() {
    if (confirm('Are you sure you want to reset the model? This will lose all changes.')) {
        location.reload();
    }
}
