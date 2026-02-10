// ===== AUTHENTICATION & USER MANAGEMENT =====

// Secure user storage
const USERS_KEY = 'fxTaeUsers';
const CURRENT_USER_KEY = 'fxTaeCurrentUser';
const AUTH_KEY = 'fxTaeAuthenticated';
const TRADES_KEY = 'fxTaeTrades';
const GOALS_KEY = 'fxTaeGoals';
const WITHDRAWALS_KEY = 'fxTaeWithdrawals';
const TRADING_RULES_KEY = 'fxTaeTradingRules';

// Initialize users storage
function initializeUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
}

// Get all users
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

// Save user
function saveUser(user) {
    const users = getUsers();
    // Check if email already exists
    if (users.some(u => u.email === user.email)) {
        return { success: false, message: 'Email already registered' };
    }
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true };
}

// Authenticate user
function authenticateUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user ? { success: true, user } : { success: false, message: 'Invalid email or password' };
}

// Set current user
function setCurrentUser(user) {
    // Store minimal info without password
    const safeUser = {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    sessionStorage.setItem(AUTH_KEY, 'true');
}

// Check if user is authenticated
function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
}

// Password validation
function validatePassword(password) {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return `$${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatCurrencyWithSign(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatDateTime(dateString, timeString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        return `${formattedDate} ${timeString || ''}`.trim();
    } catch (error) {
        return dateString;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== DASHBOARD DATA MANAGEMENT =====
let trades = [];
let goals = [];
let withdrawals = [];
let accountBalance = 10000;
let startingBalance = 10000;
let equityChart = null;
let winRateChart = null;
let winLossChart = null;
let winLossRatioChart = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function loadTrades() {
    try {
        const savedTrades = localStorage.getItem(TRADES_KEY);
        trades = savedTrades ? JSON.parse(savedTrades) : [];
    } catch (error) {
        trades = [];
    }
}

function loadGoals() {
    try {
        const savedGoals = localStorage.getItem(GOALS_KEY);
        goals = savedGoals ? JSON.parse(savedGoals) : [];
    } catch (error) {
        goals = [];
    }
}

function loadWithdrawals() {
    try {
        const savedWithdrawals = localStorage.getItem(WITHDRAWALS_KEY);
        withdrawals = savedWithdrawals ? JSON.parse(savedWithdrawals) : [];
    } catch (error) {
        withdrawals = [];
    }
}

function loadAccountBalance() {
    try {
        const savedBalance = localStorage.getItem('fxTaeAccountBalance');
        const savedStartingBalance = localStorage.getItem('fxTaeStartingBalance');
        
        if (savedBalance) accountBalance = parseFloat(savedBalance);
        if (savedStartingBalance) startingBalance = parseFloat(savedStartingBalance);
    } catch (error) {
        accountBalance = 10000;
        startingBalance = 10000;
    }
}

function saveTrades() {
    try {
        localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
    } catch (error) {
        showToast('Error saving trades data', 'error');
    }
}

function saveGoals() {
    try {
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
        showToast('Error saving goals data', 'error');
    }
}

function saveWithdrawals() {
    try {
        localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
    } catch (error) {
        showToast('Error saving withdrawals data', 'error');
    }
}

function saveAccountBalance() {
    try {
        localStorage.setItem('fxTaeAccountBalance', accountBalance.toString());
        localStorage.setItem('fxTaeStartingBalance', startingBalance.toString());
    } catch (error) {
        showToast('Error saving account balance', 'error');
    }
}

// ===== INITIALIZATION =====
function initializeDashboard() {
    console.log('Initializing FX Tae Trading Dashboard...');
    
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        loadTrades();
        loadGoals();
        loadWithdrawals();
        loadAccountBalance();
        
        updateCurrentDate();
        updateUserInfo();
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateAllTrades();
        updateWithdrawalsTable();
        updateStats();
        updateTradeLists();
        updateGoalsList();
        
        // Setup withdrawal amount listener
        const withdrawalAmountInput = document.getElementById('withdrawalAmount');
        if (withdrawalAmountInput) {
            withdrawalAmountInput.addEventListener('input', updateNewBalanceAfterWithdrawal);
        }
        
        // Set today's date in forms
        const today = new Date().toISOString().split('T')[0];
        const tradeDateInput = document.getElementById('tradeDate');
        const withdrawalDateInput = document.getElementById('withdrawalDate');
        
        if (tradeDateInput) tradeDateInput.value = today;
        if (withdrawalDateInput) withdrawalDateInput.value = today;
        
        setTimeout(() => {
            initializeCharts();
            updateCalendar();
        }, 500);
        
        setupEventListeners();
        
        const tradeTimeInput = document.getElementById('tradeTime');
        if (tradeTimeInput) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            tradeTimeInput.value = `${hours}:${minutes}`;
        }
        
        const savedTheme = localStorage.getItem('fxTaeTheme') || 'light';
        setTheme(savedTheme);
        
        console.log('Dashboard initialized successfully!');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing application', 'error');
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        
        if (userNameElement) userNameElement.textContent = user.name || 'Trader';
        if (userEmailElement) userEmailElement.textContent = user.email || 'trader@example.com';
        if (userEmailDisplay) userEmailDisplay.value = user.email || 'trader@example.com';
    }
}

function updateAccountBalanceDisplay() {
    try {
        const balanceElement = document.getElementById('accountBalance');
        const currentBalanceInput = document.getElementById('currentBalanceInput');
        const startingBalanceElement = document.getElementById('startingBalance');
        const totalGrowthElement = document.getElementById('totalGrowth');
        const growthPercentageElement = document.getElementById('growthPercentage');
        
        const calculatedBalance = startingBalance + trades.reduce((sum, trade) => sum + trade.pnl, 0) + 
                                 withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
        accountBalance = calculatedBalance;
        
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(accountBalance);
        }
        
        if (currentBalanceInput) {
            currentBalanceInput.value = accountBalance;
        }
        
        if (startingBalanceElement) {
            startingBalanceElement.textContent = formatCurrency(startingBalance);
        }
        
        if (totalGrowthElement) {
            const growth = accountBalance - startingBalance;
            totalGrowthElement.textContent = formatCurrency(growth);
            totalGrowthElement.className = `stat-value ${growth >= 0 ? 'profit' : 'loss'}`;
        }
        
        if (growthPercentageElement) {
            const growthPercentage = startingBalance > 0 ? ((accountBalance - startingBalance) / startingBalance) * 100 : 0;
            growthPercentageElement.textContent = `${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`;
            growthPercentageElement.className = `stat-value ${growthPercentage >= 0 ? 'profit' : 'loss'}`;
        }
        
        saveAccountBalance();
    } catch (error) {
        console.error('Error updating account balance display:', error);
    }
}

// ===== WITHDRAWAL SYSTEM =====
function updateNewBalanceAfterWithdrawal() {
    const withdrawalAmountInput = document.getElementById('withdrawalAmount');
    const newBalanceInput = document.getElementById('newBalanceAfterWithdrawal');
    
    if (!withdrawalAmountInput || !newBalanceInput) return;
    
    const withdrawalAmount = parseFloat(withdrawalAmountInput.value) || 0;
    const newBalance = accountBalance - withdrawalAmount;
    
    newBalanceInput.value = newBalance.toFixed(2);
}

function processWithdrawal() {
    try {
        const date = document.getElementById('withdrawalDate')?.value;
        const time = document.getElementById('withdrawalTime')?.value;
        const broker = document.getElementById('withdrawalBroker')?.value;
        const amount = parseFloat(document.getElementById('withdrawalAmount')?.value);
        const notes = document.getElementById('withdrawalNotes')?.value;
        
        if (!date || !time || !broker || isNaN(amount) || amount <= 0) {
            showToast('Please fill all required fields with valid amounts', 'error');
            return false;
        }
        
        if (amount > accountBalance) {
            showToast('Withdrawal amount exceeds account balance!', 'error');
            return false;
        }
        
        const withdrawal = {
            id: Date.now(),
            date,
            time,
            broker,
            amount: -Math.abs(amount),
            notes: notes || 'No notes provided',
            balanceBefore: accountBalance,
            balanceAfter: accountBalance - amount,
            type: 'withdrawal'
        };
        
        withdrawals.unshift(withdrawal);
        saveWithdrawals();
        
        accountBalance -= amount;
        saveAccountBalance();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateWithdrawalsTable();
        updateStats();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        const withdrawalForm = document.getElementById('withdrawalForm');
        if (withdrawalForm) withdrawalForm.reset();
        
        const withdrawalDateInput = document.getElementById('withdrawalDate');
        if (withdrawalDateInput) {
            withdrawalDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        showToast(`Withdrawal of $${amount.toFixed(2)} processed successfully!`, 'success');
        return true;
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('Error processing withdrawal', 'error');
        return false;
    }
}

function saveAndDownloadWithdrawal() {
    const success = processWithdrawal();
    if (success && withdrawals.length > 0) {
        setTimeout(() => {
            downloadWithdrawalPDF(withdrawals[0]);
        }, 500);
    }
}

function updateWithdrawalsTable() {
    const tableBody = document.getElementById('withdrawalsTable');
    if (!tableBody) return;
    
    try {
        const sortedWithdrawals = [...withdrawals].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        
        if (sortedWithdrawals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-withdrawals">
                        <i class="fas fa-money-bill-wave"></i>
                        <p>No withdrawals recorded yet.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = sortedWithdrawals.map(withdrawal => `
            <tr>
                <td>${formatDateTime(withdrawal.date, withdrawal.time)}</td>
                <td>${withdrawal.broker}</td>
                <td class="loss">${formatCurrencyWithSign(withdrawal.amount)}</td>
                <td>${formatCurrency(withdrawal.balanceBefore)}</td>
                <td>${formatCurrency(withdrawal.balanceAfter)}</td>
                <td>${withdrawal.notes || 'No notes'}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteWithdrawal(${withdrawal.id})" title="Delete Withdrawal">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating withdrawals table:', error);
    }
}

function deleteWithdrawal(withdrawalId) {
    if (!confirm('Are you sure you want to delete this withdrawal?')) return;
    
    const withdrawalIndex = withdrawals.findIndex(w => w.id === withdrawalId);
    if (withdrawalIndex === -1) return;
    
    try {
        const withdrawal = withdrawals[withdrawalIndex];
        accountBalance += Math.abs(withdrawal.amount);
        
        withdrawals.splice(withdrawalIndex, 1);
        saveWithdrawals();
        saveAccountBalance();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateWithdrawalsTable();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        showToast('Withdrawal deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting withdrawal:', error);
        showToast('Error deleting withdrawal', 'error');
    }
}

// ===== TRADE FUNCTIONS =====
function saveTrade() {
    try {
        const date = document.getElementById('tradeDate')?.value;
        const time = document.getElementById('tradeTime')?.value;
        const tradeNumber = parseInt(document.getElementById('tradeNumber')?.value);
        let strategy = document.getElementById('strategy')?.value;
        const customStrategy = document.getElementById('customStrategy')?.value;
        const pair = document.getElementById('currencyPair')?.value;
        const pnl = parseFloat(document.getElementById('pnlAmount')?.value);
        const notes = document.getElementById('tradeNotes')?.value;
        
        if (!date || !time || !tradeNumber || !strategy || !pair || isNaN(pnl)) {
            showToast('Please fill all required fields', 'error');
            return false;
        }
        
        const todayTrades = trades.filter(t => t.date === date);
        if (todayTrades.length >= 4) {
            showToast('Maximum 4 trades per day reached!', 'error');
            return false;
        }
        
        if (customStrategy && document.getElementById('customStrategy').style.display !== 'none') {
            strategy = customStrategy;
        }
        
        const trade = {
            id: Date.now(),
            date,
            time,
            tradeNumber,
            pair,
            strategy,
            pnl,
            notes: notes || 'No notes provided',
            type: 'trade'
        };
        
        trades.unshift(trade);
        saveTrades();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        if (winLossChart) {
            winLossChart.data = getWinLossData();
            winLossChart.update();
        }
        
        if (winLossRatioChart) {
            winLossRatioChart.data = getWinLossRatioData();
            winLossRatioChart.update();
        }
        
        updateCalendar();
        
        const pnlInput = document.getElementById('pnlAmount');
        const notesInput = document.getElementById('tradeNotes');
        
        if (pnlInput) pnlInput.value = '';
        if (notesInput) notesInput.value = '';
        
        showToast('Trade saved successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error saving trade:', error);
        showToast('Error saving trade', 'error');
        return false;
    }
}

function saveAndDownloadTrade() {
    const success = saveTrade();
    if (success) {
        setTimeout(() => {
            if (trades.length > 0) {
                downloadTradePDF(trades[0]);
            }
        }, 500);
    }
}

function updateRecentActivity() {
    const tableBody = document.getElementById('recentActivityTable');
    if (!tableBody) return;
    
    try {
        const allActivities = [
            ...trades.map(t => ({...t, type: 'trade'})),
            ...withdrawals.map(w => ({...w, type: 'withdrawal'}))
        ].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
         .slice(0, 5);
        
        if (allActivities.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-activity">
                        <i class="fas fa-chart-line"></i>
                        <p>No activity recorded yet. Start trading or make withdrawals to see history here.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = allActivities.map(activity => {
            if (activity.type === 'trade') {
                return `
                    <tr>
                        <td>${formatDateTime(activity.date, activity.time)}</td>
                        <td><span class="activity-type trade-type">Trade</span></td>
                        <td>${activity.pair} - ${activity.strategy}</td>
                        <td class="${activity.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(activity.pnl)}</td>
                        <td><span class="status-badge ${activity.pnl >= 0 ? 'profit' : 'loss'}">${activity.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                        <td>
                            <button class="action-btn edit-btn" onclick="editTrade(${activity.id})" title="Edit Trade">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteTrade(${activity.id})" title="Delete Trade">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } else {
                return `
                    <tr>
                        <td>${formatDateTime(activity.date, activity.time)}</td>
                        <td><span class="activity-type withdrawal-type">Withdrawal</span></td>
                        <td>${activity.broker}</td>
                        <td class="loss">${formatCurrencyWithSign(activity.amount)}</td>
                        <td><span class="status-badge processing">PROCESSED</span></td>
                        <td>
                            <button class="action-btn delete-btn" onclick="deleteWithdrawal(${activity.id})" title="Delete Withdrawal">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    } catch (error) {
        console.error('Error updating recent activity:', error);
    }
}

// ===== GOALS FUNCTIONS =====
function saveGoal() {
    const goalInput = document.getElementById('goalInput');
    const content = goalInput?.value.trim();
    
    if (!content) {
        showToast('Please write your goal first', 'error');
        return;
    }
    
    try {
        const goal = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            content: content
        };
        
        goals.unshift(goal);
        saveGoals();
        updateGoalsList();
        
        if (goalInput) goalInput.value = '';
        showToast('Goal saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving goal:', error);
        showToast('Error saving goal', 'error');
    }
}

function clearGoal() {
    const goalInput = document.getElementById('goalInput');
    if (goalInput) goalInput.value = '';
}

function updateGoalsList() {
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;
    
    try {
        if (goals.length === 0) {
            goalsList.innerHTML = `
                <div class="no-goals">
                    <i class="fas fa-bullseye"></i>
                    <p>No goals recorded yet. Write your first trading goal!</p>
                </div>
            `;
            return;
        }
        
        const sortedGoals = [...goals].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        goalsList.innerHTML = sortedGoals.map(goal => `
            <div class="goal-card">
                <div class="goal-header">
                    <span class="goal-date">${formatDate(goal.date)}</span>
                    <div class="goal-actions">
                        <button class="action-btn edit-btn" onclick="editGoal(${goal.id})" title="Edit Goal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteGoal(${goal.id})" title="Delete Goal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="goal-content">${goal.content}</div>
            </div>
        `).join('');
    } catch (error) {
        goalsList.innerHTML = `
            <div class="no-goals">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading goals. Please refresh the page.</p>
            </div>
        `;
    }
}

function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
        showToast('Goal not found', 'error');
        return;
    }
    
    const goalInput = document.getElementById('goalInput');
    if (goalInput) goalInput.value = goal.content;
    
    try {
        goals = goals.filter(g => g.id !== goalId);
        saveGoals();
        updateGoalsList();
        
        showToast('Goal loaded for editing', 'info');
    } catch (error) {
        console.error('Error editing goal:', error);
        showToast('Error loading goal for editing', 'error');
    }
}

function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
        goals = goals.filter(g => g.id !== goalId);
        saveGoals();
        updateGoalsList();
        
        showToast('Goal deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Error deleting goal', 'error');
    }
}

// ===== STATS FUNCTIONS =====
function updateStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => t.date === today);
        const todayPnl = todayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const todayPnlElement = document.getElementById('todayPnl');
        if (todayPnlElement) {
            todayPnlElement.textContent = formatCurrencyWithSign(todayPnl);
            todayPnlElement.className = `stat-value ${todayPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        const todayTradesCount = document.getElementById('todayTradesCount');
        if (todayTradesCount) {
            todayTradesCount.textContent = `${todayTrades.length}/4`;
        }
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = (todayTrades.length / 4) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const weeklyTrades = trades.filter(t => t.date >= weekAgo);
        const weeklyPnl = weeklyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const weeklyPnlElement = document.getElementById('weeklyPnl');
        if (weeklyPnlElement) {
            weeklyPnlElement.textContent = formatCurrencyWithSign(weeklyPnl);
            weeklyPnlElement.className = `stat-value ${weeklyPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const monthlyTrades = trades.filter(t => t.date >= monthAgo);
        const monthlyPnl = monthlyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const monthlyPnlElement = document.getElementById('monthlyPnl');
        if (monthlyPnlElement) {
            monthlyPnlElement.textContent = formatCurrencyWithSign(monthlyPnl);
            monthlyPnlElement.className = `stat-value ${monthlyPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        updateWinRate();
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function updateTradeLists() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => t.date === today);
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const weeklyTrades = trades.filter(t => t.date >= weekAgo);
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const monthlyTrades = trades.filter(t => t.date >= monthAgo);
        
        updateTradeList('todayTradesList', todayTrades);
        updateTradeList('weeklyTradesList', weeklyTrades);
        updateTradeList('monthlyTradesList', monthlyTrades);
    } catch (error) {
        console.error('Error updating trade lists:', error);
    }
}

function updateTradeList(elementId, tradeList) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        if (tradeList.length === 0) {
            element.innerHTML = '<p class="no-trades">No trades recorded</p>';
            return;
        }
        
        const list = tradeList.slice(0, 3).map(trade => `
            <div class="trade-item">
                <span>${formatDateTime(trade.date, trade.time)}</span>
                <span>${trade.pair}</span>
                <span class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</span>
            </div>
        `).join('');
        
        element.innerHTML = list;
    } catch (error) {
        element.innerHTML = '<p class="no-trades">Error loading trades</p>';
    }
}

function updateWinRate() {
    try {
        const winningTrades = trades.filter(t => t.pnl > 0).length;
        const losingTrades = trades.filter(t => t.pnl < 0).length;
        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const winRateElement = document.getElementById('winRateValue');
        if (winRateElement) {
            winRateElement.textContent = `${winRate.toFixed(1)}%`;
        }
    } catch (error) {
        console.error('Error updating win rate:', error);
    }
}

// ===== CHART FUNCTIONS =====
function initializeCharts() {
    console.log('Initializing charts...');
    
    try {
        // Equity Chart
        const equityCtx = document.getElementById('equityChart');
        if (equityCtx) {
            const equityData = getEquityData('7d');
            
            equityChart = new Chart(equityCtx, {
                type: 'line',
                data: equityData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `Balance: $${context.parsed.y.toLocaleString()}`;
                                },
                                title: function(context) {
                                    if (context[0].dataIndex === 0) return 'Starting Balance';
                                    return context[0].label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            title: {
                                display: true,
                                text: 'Account Balance ($)'
                            }
                        },
                        x: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            title: {
                                display: true,
                                text: 'Date & Time'
                            }
                        }
                    }
                }
            });
        }
        
        // Win Rate Chart
        const winRateCtx = document.getElementById('winRateChart');
        if (winRateCtx) {
            const winRateData = getWinRateData();
            
            winRateChart = new Chart(winRateCtx, {
                type: 'doughnut',
                data: winRateData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        // Win Loss Chart
        const winLossCtx = document.getElementById('winLossChart');
        if (winLossCtx) {
            const winLossData = getWinLossData();
            
            winLossChart = new Chart(winLossCtx, {
                type: 'pie',
                data: winLossData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        // Win/Loss Ratio Chart
        const winLossRatioCtx = document.getElementById('winLossRatioChart');
        if (winLossRatioCtx) {
            const winLossRatioData = getWinLossRatioData();
            
            winLossRatioChart = new Chart(winLossRatioCtx, {
                type: 'doughnut',
                data: winLossRatioData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    circumference: 180,
                    rotation: -90,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error initializing charts:', error);
        showToast('Error initializing charts', 'error');
    }
}

function getEquityData(period = '7d') {
    const activitiesByDate = {};
    
    trades.forEach(trade => {
        const date = trade.date;
        if (!activitiesByDate[date]) {
            activitiesByDate[date] = 0;
        }
        activitiesByDate[date] += trade.pnl;
    });
    
    withdrawals.forEach(withdrawal => {
        const date = withdrawal.date;
        if (!activitiesByDate[date]) {
            activitiesByDate[date] = 0;
        }
        activitiesByDate[date] += withdrawal.amount;
    });
    
    let filteredDates = Object.keys(activitiesByDate);
    const now = new Date();
    
    switch(period.toLowerCase()) {
        case '1m':
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filteredDates = filteredDates.filter(date => new Date(date) >= oneMonthAgo);
            break;
        case '12m':
            return getEquityData12M();
        case '7d':
        default:
            const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
            filteredDates = filteredDates.filter(date => new Date(date) >= sevenDaysAgo);
            break;
    }
    
    filteredDates.sort((a, b) => new Date(a) - new Date(b));
    
    let balance = startingBalance;
    const data = [balance];
    const labels = ['Starting'];
    
    filteredDates.forEach(date => {
        const dailyNet = activitiesByDate[date];
        balance += dailyNet;
        data.push(balance);
        
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        labels.push(formattedDate);
    });
    
    if (filteredDates.length === 0) {
        return {
            labels: ['Starting Balance'],
            datasets: [{
                label: 'Account Balance',
                data: [startingBalance],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }
    
    return {
        labels: labels,
        datasets: [{
            label: 'Account Balance',
            data: data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
}

function getEquityData12M() {
    const tradesByMonth = {};
    trades.forEach(trade => {
        const date = new Date(trade.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!tradesByMonth[monthKey]) {
            tradesByMonth[monthKey] = {
                date: new Date(date.getFullYear(), date.getMonth(), 1),
                pnl: 0
            };
        }
        tradesByMonth[monthKey].pnl += trade.pnl;
    });
    
    withdrawals.forEach(withdrawal => {
        const date = new Date(withdrawal.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!tradesByMonth[monthKey]) {
            tradesByMonth[monthKey] = {
                date: new Date(date.getFullYear(), date.getMonth(), 1),
                pnl: 0
            };
        }
        tradesByMonth[monthKey].pnl += withdrawal.amount;
    });
    
    const now = new Date();
    const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
    
    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
        const monthDate = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
        const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
        
        const monthlyPnl = tradesByMonth[monthKey] ? tradesByMonth[monthKey].pnl : 0;
        monthlyData.push({
            date: monthDate,
            pnl: monthlyPnl,
            label: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        });
    }
    
    let balance = startingBalance;
    const data = [balance];
    const labels = ['Starting'];
    
    monthlyData.forEach(month => {
        balance += month.pnl;
        data.push(balance);
        labels.push(month.label);
    });
    
    return {
        labels: labels,
        datasets: [{
            label: 'Account Balance',
            data: data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
}

function getWinLossRatioData() {
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    
    const winLossRatioElement = document.getElementById('winLossRatioValue');
    if (winLossRatioElement) {
        winLossRatioElement.textContent = `${winningTrades}:${losingTrades}`;
    }
    
    return {
        labels: ['Winning Trades', 'Losing Trades'],
        datasets: [{
            data: [winningTrades, losingTrades],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0,
            borderAlign: 'inner'
        }]
    };
}

function getWinRateData() {
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const breakEvenTrades = trades.filter(t => t.pnl === 0).length;
    
    return {
        labels: ['Winning Trades', 'Losing Trades', 'Break Even'],
        datasets: [{
            data: [winningTrades, losingTrades, breakEvenTrades],
            backgroundColor: ['#10b981', '#ef4444', '#94a3b8'],
            borderWidth: 0
        }]
    };
}

function getWinLossData() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    return {
        labels: ['Total Profit', 'Total Loss'],
        datasets: [{
            data: [totalProfit, totalLoss],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
        }]
    };
}

// ===== PDF EXPORT FUNCTIONS =====
function generatePDF({ title, content, filename }) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showToast('PDF library not loaded. Please check internet connection.', 'error');
            return;
        }
        
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        let yPosition = margin;
        
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40, 40, 150);
        pdf.text(title, margin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
        yPosition += 15;
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const lines = pdf.splitTextToSize(content, contentWidth);
        
        for (let i = 0; i < lines.length; i++) {
            if (yPosition > pdf.internal.pageSize.height - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            
            let line = lines[i];
            if (line.includes('**')) {
                const parts = line.split('**');
                let xPos = margin;
                
                for (let j = 0; j < parts.length; j++) {
                    if (j % 2 === 0) {
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(parts[j], xPos, yPosition);
                        xPos += pdf.getStringUnitWidth(parts[j]) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
                    } else {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(parts[j], xPos, yPosition);
                        xPos += pdf.getStringUnitWidth(parts[j]) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
                    }
                }
            } else {
                pdf.text(line, margin, yPosition);
            }
            
            yPosition += 7;
        }
        
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('FX Tae Trading Dashboard - www.fxtaetrader.page.gd', margin, pdf.internal.pageSize.height - 10);
        
        pdf.save(filename);
        showToast(`PDF "${filename}" downloaded successfully!`, 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}

function downloadTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **ACCOUNT SUMMARY:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Today's P&L: ${formatCurrencyWithSign(todayPnl)}
        Today's Trades: ${todayTrades.length}/4
        
        **TRADES TODAY:**
        ${todayTrades.length > 0 ? todayTrades.map(t => `
        Trade ${t.tradeNumber} (${t.time}):
        - Pair: ${t.pair}
        - Strategy: ${t.strategy}
        - P&L: ${formatCurrencyWithSign(t.pnl)}
        - Notes: ${t.notes || 'No notes'}
        `).join('\n') : 'No trades recorded today.'}
    `;
    
    generatePDF({
        title: `Today's Trading Stats - ${today}`,
        content: content,
        filename: `today-stats-${today}.pdf`
    });
}

function downloadWeeklyStats() {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyTrades = trades.filter(t => t.date >= weekAgo);
    const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **WEEKLY REPORT (Last 7 Days)**
        Period: ${weekAgo} to ${new Date().toISOString().split('T')[0]}
        
        **ACCOUNT PERFORMANCE:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Weekly P&L: ${formatCurrencyWithSign(weeklyPnl)}
        Total Trades: ${weeklyTrades.length}
        
        **WEEKLY TRADES:**
        ${weeklyTrades.length > 0 ? weeklyTrades.map(t => `
        ${t.date} ${t.time} - Trade ${t.tradeNumber}:
        - Pair: ${t.pair}
        - Strategy: ${t.strategy}
        - P&L: ${formatCurrencyWithSign(t.pnl)}
        - Status: ${t.pnl >= 0 ? 'WIN' : 'LOSS'}
        `).join('\n') : 'No trades recorded this week.'}
    `;
    
    generatePDF({
        title: 'Weekly Trading Performance Report',
        content: content,
        filename: `weekly-stats-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function downloadMonthlyStats() {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyTrades = trades.filter(t => t.date >= monthAgo);
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **MONTHLY REPORT (Last 30 Days)**
        Period: ${monthAgo} to ${new Date().toISOString().split('T')[0]}
        
        **ACCOUNT PERFORMANCE:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Monthly P&L: ${formatCurrencyWithSign(monthlyPnl)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        Total Trades: ${monthlyTrades.length}
    `;
    
    generatePDF({
        title: 'Monthly Trading Performance Report',
        content: content,
        filename: `monthly-stats-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function downloadTradePDF(trade) {
    const content = `
        **TRADE DETAILS:**
        Date: ${formatDate(trade.date)}
        Time: ${trade.time}
        Trade Number: ${trade.tradeNumber}
        Currency Pair: ${trade.pair}
        Strategy: ${trade.strategy}
        P&L: ${formatCurrencyWithSign(trade.pnl)}
        Notes: ${trade.notes}
        
        **ACCOUNT INFORMATION:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
    `;
    
    generatePDF({
        title: `Trade Details - ${trade.pair} - ${formatDate(trade.date)}`,
        content: content,
        filename: `trade-${trade.id}-${trade.date}.pdf`
    });
}

function downloadWithdrawalPDF(withdrawal) {
    const content = `
        **WITHDRAWAL RECEIPT**
        
        **Withdrawal Details:**
        Date: ${formatDate(withdrawal.date)}
        Time: ${withdrawal.time}
        Transaction ID: WD-${withdrawal.id}
        Broker: ${withdrawal.broker}
        Amount: ${formatCurrencyWithSign(withdrawal.amount)}
        
        **Account Information:**
        Balance Before: ${formatCurrency(withdrawal.balanceBefore)}
        Balance After: ${formatCurrency(withdrawal.balanceAfter)}
        
        **Notes:**
        ${withdrawal.notes || 'No notes provided'}
        
        **Transaction Summary:**
        Status: PROCESSED
        Type: WITHDRAWAL
        Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        
        **Contact Information:**
        FX Tae Trading Dashboard
        Email: fxtae.chartprogram@gmail.com
        Phone: +256 778997909
    `;
    
    generatePDF({
        title: `Withdrawal Receipt - ${formatDate(withdrawal.date)}`,
        content: content,
        filename: `withdrawal-${withdrawal.id}-${withdrawal.date}.pdf`
    });
}

function exportJournalPDF() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    const content = `
        **COMPLETE TRADING JOURNAL**
        
        **ACCOUNT SUMMARY:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        Total Trades: ${trades.length}
        
        **PERFORMANCE METRICS:**
        Winning Trades: ${winningTrades.length}
        Losing Trades: ${losingTrades.length}
        Win Rate: ${winRate}%
        Total Profit: ${formatCurrency(winningTrades.reduce((sum, t) => sum + t.pnl, 0))}
        Total Loss: ${formatCurrency(Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)))}
        Net Profit: ${formatCurrency(trades.reduce((sum, t) => sum + t.pnl, 0))}
        
        **ALL TRADES (${trades.length} Total):**
        ${trades.map(t => `
        ${t.date} ${t.time} | Trade ${t.tradeNumber} | ${t.pair} | ${t.strategy} | 
        P&L: ${formatCurrencyWithSign(t.pnl)} | Notes: ${t.notes || 'No notes'}
        `).join('\n')}
        
        **WITHDRAWALS (${withdrawals.length} Total):**
        ${withdrawals.map(w => `
        ${w.date} ${w.time} | ${w.broker} | 
        Amount: ${formatCurrencyWithSign(w.amount)} | Notes: ${w.notes || 'No notes'}
        `).join('\n')}
    `;
    
    generatePDF({
        title: 'Complete Trading Journal - All Trades',
        content: content,
        filename: `trading-journal-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function exportAnalyticsPDF() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    const content = `
        **TRADING ANALYTICS REPORT**
        
        **PERFORMANCE OVERVIEW:**
        **Total Trades:** ${trades.length}
        **Winning Trades:** ${winningTrades.length}
        **Losing Trades:** ${losingTrades.length}
        **Win Rate:** ${winRate}%
        **Win/Loss Ratio:** ${winningTrades.length}:${losingTrades.length}
        
        **PROFIT ANALYSIS:**
        **Total Profit:** ${formatCurrency(totalProfit)}
        **Total Loss:** ${formatCurrency(totalLoss)}
        **Net Profit:** ${formatCurrency(totalProfit - totalLoss)}
        
        **ACCOUNT GROWTH:**
        **Starting Balance:** ${formatCurrency(startingBalance)}
        **Current Balance:** ${formatCurrency(accountBalance)}
        **Total Growth:** ${formatCurrency(accountBalance - startingBalance)}
        **Growth %:** ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        
        **GENERATED ON:** ${new Date().toLocaleDateString()}
        **BY:** FX Tae Trading Dashboard
    `;
    
    generatePDF({
        title: 'Trading Analytics Report',
        content: content,
        filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function exportSelectedDataPDF() {
    const exportTrades = document.getElementById('exportTrades')?.checked;
    const exportWithdrawals = document.getElementById('exportWithdrawals')?.checked;
    const exportGoals = document.getElementById('exportGoals')?.checked;
    const exportSettings = document.getElementById('exportSettings')?.checked;
    
    let content = '**SELECTED DATA EXPORT**\n\n';
    let filename = 'selected-data-';
    
    if (exportTrades) {
        content += getTradesExportContent();
        filename += 'trades-';
    }
    
    if (exportWithdrawals) {
        content += getWithdrawalsExportContent();
        filename += 'withdrawals-';
    }
    
    if (exportGoals) {
        content += getGoalsExportContent();
        filename += 'goals-';
    }
    
    if (exportSettings) {
        content += getSettingsExportContent();
        filename += 'settings-';
    }
    
    if (content === '**SELECTED DATA EXPORT**\n\n') {
        showToast('Please select at least one data type to export', 'error');
        return;
    }
    
    content += `\n**EXPORT DETAILS:**\n`;
    content += `**Generated:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    content += `**Software:** FX Tae Trading Dashboard\n`;
    
    filename += `${new Date().toISOString().split('T')[0]}.pdf`;
    
    generatePDF({
        title: 'Selected Data Export',
        content: content,
        filename: filename
    });
}

function getTradesExportContent() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    return `
        **TRADES DATA (${trades.length} Total):**
        
        **Performance Summary:**
        **Total Trades:** ${trades.length}
        **Winning Trades:** ${winningTrades.length}
        **Losing Trades:** ${losingTrades.length}
        **Win Rate:** ${winRate}%
        **Total Profit:** ${formatCurrency(winningTrades.reduce((sum, t) => sum + t.pnl, 0))}
        **Total Loss:** ${formatCurrency(Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)))}
        **Net Profit:** ${formatCurrency(trades.reduce((sum, t) => sum + t.pnl, 0))}
        
        **All Trades:**
        ${trades.map(t => `
        **${formatDate(t.date)} ${t.time} | Trade ${t.tradeNumber}**
        Pair: ${t.pair}
        Strategy: ${t.strategy}
        P&L: ${formatCurrencyWithSign(t.pnl)}
        Notes: ${t.notes || 'No notes'}
        `).join('\n')}
        
    `;
}

function getWithdrawalsExportContent() {
    return `
        **WITHDRAWALS DATA (${withdrawals.length} Total):**
        
        **Summary:**
        **Total Withdrawals:** ${withdrawals.length}
        **Total Withdrawn:** ${formatCurrency(Math.abs(withdrawals.reduce((sum, w) => sum + w.amount, 0)))}
        
        **All Withdrawals:**
        ${withdrawals.map(w => `
        **${formatDate(w.date)} ${w.time}**
        Broker: ${w.broker}
        Amount: ${formatCurrencyWithSign(w.amount)}
        Balance Before: ${formatCurrency(w.balanceBefore)}
        Balance After: ${formatCurrency(w.balanceAfter)}
        Notes: ${w.notes || 'No notes'}
        `).join('\n')}
        
    `;
}

function getGoalsExportContent() {
    return `
        **GOALS DATA (${goals.length} Total):**
        
        **All Goals:**
        ${goals.map(g => `
        **${formatDate(g.date)}:**
        ${g.content}
        `).join('\n')}
        
    `;
}

function getSettingsExportContent() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    const tradingRules = localStorage.getItem(TRADING_RULES_KEY) || 'No trading rules saved';
    
    return `
        **SETTINGS DATA:**
        
        **Account Information:**
        **Username:** ${user.name || 'Not set'}
        **Email:** ${user.email || 'Not set'}
        **Account Created:** ${user.createdAt ? formatDate(user.createdAt.split('T')[0]) : 'Unknown'}
        
        **Trading Rules:**
        ${tradingRules}
        
        **Theme:** ${localStorage.getItem('fxTaeTheme') || 'light'}
        
    `;
}

function exportAllDataPDF() {
    const content = `
        **COMPLETE TRADING DATA BACKUP**
        
        ${getTradesExportContent()}
        ${getWithdrawalsExportContent()}
        ${getGoalsExportContent()}
        ${getSettingsExportContent()}
        
        **EXPORT DETAILS:**
        **Generated:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        **Total Records:** ${trades.length + withdrawals.length + goals.length}
        **Software:** FX Tae Trading Dashboard
        **Version:** 2.0 Professional
    `;
    
    generatePDF({
        title: 'Complete Trading Data Backup',
        content: content,
        filename: `complete-trading-data-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function exportDashboardPDF() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyTrades = trades.filter(t => t.date >= weekAgo);
    const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyTrades = trades.filter(t => t.date >= monthAgo);
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **PROFESSIONAL TRADING DASHBOARD REPORT**
        
        **DASHBOARD SNAPSHOT:**
        **Report Date:** ${new Date().toLocaleDateString()}
        **Account Name:** ${JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}').name || 'Trader'}
        
        **ACCOUNT OVERVIEW:**
        **Current Balance:** ${formatCurrency(accountBalance)}
        **Starting Balance:** ${formatCurrency(startingBalance)}
        **Total Growth:** ${formatCurrency(accountBalance - startingBalance)}
        **Growth %:** ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        
        **DAILY PERFORMANCE:**
        **Today's P&L:** ${formatCurrencyWithSign(todayPnl)}
        **Today's Trades:** ${todayTrades.length}/4
        **Daily Progress:** ${(todayTrades.length / 4 * 100).toFixed(0)}%
        
        **WEEKLY PERFORMANCE:**
        **Weekly P&L:** ${formatCurrencyWithSign(weeklyPnl)}
        **Weekly Trades:** ${weeklyTrades.length}
        **Avg Daily P&L:** ${weeklyTrades.length > 0 ? formatCurrency(weeklyPnl / 7) : '$0.00'}
        
        **MONTHLY PERFORMANCE:**
        **Monthly P&L:** ${formatCurrencyWithSign(monthlyPnl)}
        **Monthly Trades:** ${monthlyTrades.length}
        **Avg Daily P&L:** ${monthlyTrades.length > 0 ? formatCurrency(monthlyPnl / 30) : '$0.00'}
        
        **GENERATED BY:**
        FX Tae Trading Dashboard
        www.fxtaetrader.page.gd
        ${new Date().toLocaleDateString()}
    `;
    
    generatePDF({
        title: 'Professional Trading Dashboard Report',
        content: content,
        filename: `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

function downloadChartAsPDF(canvasId, chartName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        showToast('Chart not found', 'error');
        return;
    }
    
    try {
        html2canvas(canvas, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvasImage => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('landscape');
            
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(40, 40, 150);
            pdf.text(chartName, 20, 20);
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
            
            const imgData = canvasImage.toDataURL('image/png', 1.0);
            const imgWidth = 250;
            const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;
            
            pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text('FX Tae Trading Dashboard - Professional Chart Export', 20, pdf.internal.pageSize.height - 10);
            
            pdf.save(`${chartName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
            
            showToast(`${chartName} downloaded as PDF`, 'success');
        }).catch(error => {
            console.error('Error capturing chart:', error);
            showToast('Error downloading chart. Please try again.', 'error');
        });
    } catch (error) {
        console.error('Error downloading chart as PDF:', error);
        showToast('Error downloading chart', 'error');
    }
}

// ===== SETTINGS FUNCTIONS =====
function setTheme(theme) {
    try {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('fxTaeTheme', theme);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((theme === 'light' && btn.textContent.includes('Light')) || 
                (theme === 'dark' && btn.textContent.includes('Dark'))) {
                btn.classList.add('active');
            }
        });
        
        showToast(`Switched to ${theme} theme`, 'success');
    } catch (error) {
        console.error('Error setting theme:', error);
    }
}

function clearAllData() {
    if (!confirm('WARNING: This will delete ALL your trading data, goals, withdrawals, and reset your account. This action cannot be undone. Are you sure?')) {
        return;
    }
    
    try {
        localStorage.removeItem(TRADES_KEY);
        localStorage.removeItem(GOALS_KEY);
        localStorage.removeItem(WITHDRAWALS_KEY);
        localStorage.removeItem('fxTaeAccountBalance');
        localStorage.removeItem('fxTaeStartingBalance');
        
        trades = [];
        goals = [];
        withdrawals = [];
        accountBalance = 10000;
        startingBalance = 10000;
        
        saveTrades();
        saveGoals();
        saveWithdrawals();
        saveAccountBalance();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateAllTrades();
        updateGoalsList();
        updateStats();
        updateTradeLists();
        updateCalendar();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        showToast('All data cleared successfully!', 'success');
    } catch (error) {
        console.error('Error clearing all data:', error);
        showToast('Error clearing data', 'error');
    }
}

function saveUsername() {
    const newUsername = document.getElementById('editUsername')?.value.trim();
    
    if (!newUsername) {
        showToast('Please enter a username', 'error');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    user.name = newUsername;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    updateUserInfo();
    showToast('Username updated successfully!', 'success');
    
    document.getElementById('editUsername').value = '';
}

function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

function saveNewPassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    showToast('Password changed successfully!', 'success');
    closeChangePasswordModal();
}

function showTradingRulesModal() {
    const savedRules = localStorage.getItem(TRADING_RULES_KEY);
    const rulesInput = document.getElementById('tradingRulesInput');
    
    if (savedRules && rulesInput) {
        rulesInput.value = savedRules;
    }
    
    document.getElementById('tradingRulesModal').style.display = 'flex';
}

function closeTradingRulesModal() {
    document.getElementById('tradingRulesModal').style.display = 'none';
}

function saveTradingRules() {
    const rulesInput = document.getElementById('tradingRulesInput');
    const rules = rulesInput?.value.trim();
    
    if (!rules) {
        showToast('Please enter your trading rules', 'error');
        return;
    }
    
    localStorage.setItem(TRADING_RULES_KEY, rules);
    generateTradingRulesPDF(rules);
    showToast('Trading rules saved and downloaded!', 'success');
    closeTradingRulesModal();
}

function generateTradingRulesPDF(rules) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showToast('PDF library not loaded', 'error');
            return;
        }
        
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        let yPosition = margin;
        
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40, 40, 150);
        pdf.text('TRADING RULES', margin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Personal Trading Rules & Guidelines', margin, yPosition);
        yPosition += 15;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
        yPosition += 20;
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        
        const lines = rules.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (yPosition > pdf.internal.pageSize.height - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            
            let line = lines[i];
            
            if (line.trim().endsWith(':') && !line.startsWith(' ')) {
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(40, 40, 150);
            } else if (line.startsWith('  -') || line.startsWith('   -')) {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
                line = '• ' + line.trim().substring(3);
            } else if (line.startsWith(' ')) {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
            } else {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100, 100, 100);
            }
            
            const textLines = pdf.splitTextToSize(line, contentWidth);
            
            for (let j = 0; j < textLines.length; j++) {
                if (yPosition > pdf.internal.pageSize.height - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
                
                pdf.text(textLines[j], margin, yPosition);
                yPosition += 7;
            }
            
            if (line.trim().endsWith(':')) {
                yPosition += 5;
            }
        }
        
        yPosition = pdf.internal.pageSize.height - 20;
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('FX Tae Trading Dashboard - Professional Trading Rules', margin, yPosition);
        pdf.text('Generated by: ' + (JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}').name || 'Trader'), margin, yPosition + 5);
        
        pdf.save(`trading-rules-${new Date().toISOString().split('T')[0]}.pdf`);
        
        showToast('Trading rules PDF downloaded!', 'success');
    } catch (error) {
        console.error('Error generating trading rules PDF:', error);
        showToast('Error generating PDF', 'error');
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            
            const pageId = this.getAttribute('data-page');
            const pageElement = document.getElementById(pageId);
            if (pageElement) {
                pageElement.classList.add('active');
            }
            
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const period = this.getAttribute('data-period');
            
            if (equityChart) {
                equityChart.data = getEquityData(period);
                equityChart.update();
            }
            
            const periodLabel = period === '7d' ? '7 Days' : period === '1m' ? '1 Month' : '12 Months';
            showToast(`Showing equity curve for ${periodLabel}`, 'info');
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem(AUTH_KEY);
                localStorage.removeItem(CURRENT_USER_KEY);
                window.location.href = 'index.html';
            }
        });
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

// ===== CALENDAR FUNCTIONS =====
function updateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    
    if (!calendarGrid || !calendarMonth) return;
    
    try {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
        
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        let calendarHTML = `
            <div class="calendar-header">Sun</div>
            <div class="calendar-header">Mon</div>
            <div class="calendar-header">Tue</div>
            <div class="calendar-header">Wed</div>
            <div class="calendar-header">Thu</div>
            <div class="calendar-header">Fri</div>
            <div class="calendar-header">Sat</div>
        `;
        
        for (let i = 0; i < startingDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTrades = trades.filter(t => t.date === dateStr);
            const dayWithdrawals = withdrawals.filter(w => w.date === dateStr);
            const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0) + 
                          dayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
            
            let dayClass = 'calendar-day';
            let pnlClass = '';
            let pnlText = '';
            
            if (dayTrades.length > 0 || dayWithdrawals.length > 0) {
                dayClass += dayPnl >= 0 ? ' profit' : ' loss';
                pnlClass = dayPnl >= 0 ? 'profit' : 'loss';
                pnlText = formatCurrencyWithSign(dayPnl);
            }
            
            calendarHTML += `
                <div class="${dayClass}" onclick="viewDayActivities('${dateStr}')">
                    <div class="calendar-date">${day}</div>
                    ${(dayTrades.length > 0 || dayWithdrawals.length > 0) ? `
                        <div class="calendar-pnl ${pnlClass}">${pnlText}</div>
                        <div class="calendar-trades">${dayTrades.length + dayWithdrawals.length} activity</div>
                    ` : ''}
                </div>
            `;
        }
        
        calendarGrid.innerHTML = calendarHTML;
    } catch (error) {
        console.error('Error updating calendar:', error);
    }
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    updateCalendar();
}

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard page loaded');
    
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    setTimeout(() => {
        const loader = document.getElementById('loader');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loader && mainContainer) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                mainContainer.style.display = 'block';
                initializeDashboard();
            }, 500);
        } else {
            initializeDashboard();
        }
    }, 2000);
});

// ===== GLOBAL EXPORTS =====
// These functions are called from HTML onclick handlers
window.initializeDashboard = initializeDashboard;
window.saveTrade = saveTrade;
window.saveAndDownloadTrade = saveAndDownloadTrade;
window.processWithdrawal = processWithdrawal;
window.saveAndDownloadWithdrawal = saveAndDownloadWithdrawal;
window.saveGoal = saveGoal;
window.clearGoal = clearGoal;
window.editStartingBalance = function() {
    const startingBalanceElement = document.getElementById('startingBalance');
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    if (!startingBalanceElement || !startingBalanceInput) return;
    
    if (editButton) editButton.style.display = 'none';
    startingBalanceElement.style.display = 'none';
    startingBalanceInput.style.display = 'block';
    if (saveButton) saveButton.style.display = 'flex';
    if (cancelButton) cancelButton.style.display = 'flex';
    
    startingBalanceInput.value = startingBalance;
    
    setTimeout(() => {
        startingBalanceInput.focus();
        startingBalanceInput.select();
    }, 100);
};

window.saveStartingBalance = function() {
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const newStartingBalance = parseFloat(startingBalanceInput.value);
    
    if (isNaN(newStartingBalance) || newStartingBalance <= 0) {
        showToast('Please enter a valid starting balance (greater than 0)', 'error');
        startingBalanceInput.focus();
        return;
    }
    
    startingBalance = newStartingBalance;
    saveAccountBalance();
    updateAccountBalanceDisplay();
    
    if (equityChart) {
        const activePeriodBtn = document.querySelector('.period-btn.active');
        const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
        equityChart.data = getEquityData(period);
        equityChart.update();
    }
    
    showToast(`Starting balance updated to ${formatCurrency(startingBalance)}`, 'success');
    
    const startingBalanceElement = document.getElementById('startingBalance');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    if (editButton) editButton.style.display = 'flex';
    if (startingBalanceElement) startingBalanceElement.style.display = 'block';
    if (startingBalanceInput) startingBalanceInput.style.display = 'none';
    if (saveButton) saveButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
};

window.cancelStartingBalanceEdit = function() {
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    if (startingBalanceInput) startingBalanceInput.value = startingBalance;
    
    const startingBalanceElement = document.getElementById('startingBalance');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    if (editButton) editButton.style.display = 'flex';
    if (startingBalanceElement) startingBalanceElement.style.display = 'block';
    if (startingBalanceInput) startingBalanceInput.style.display = 'none';
    if (saveButton) saveButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
};

window.updateNewBalanceAfterWithdrawal = updateNewBalanceAfterWithdrawal;
window.deleteWithdrawal = deleteWithdrawal;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.setTheme = setTheme;
window.clearAllData = clearAllData;
window.changeCalendarMonth = changeCalendarMonth;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatCurrencyWithSign = formatCurrencyWithSign;
window.formatDate = formatDate;
window.showTradingRulesModal = showTradingRulesModal;
window.closeTradingRulesModal = closeTradingRulesModal;
window.saveTradingRules = saveTradingRules;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.saveNewPassword = saveNewPassword;
window.saveUsername = saveUsername;
window.exportSelectedDataPDF = exportSelectedDataPDF;
window.exportAllDataPDF = exportAllDataPDF;
window.exportJournalPDF = exportJournalPDF;
window.exportAnalyticsPDF = exportAnalyticsPDF;
window.exportDashboardPDF = exportDashboardPDF;
window.downloadChartAsPDF = downloadChartAsPDF;
window.downloadTodayStats = downloadTodayStats;
window.downloadWeeklyStats = downloadWeeklyStats;
window.downloadMonthlyStats = downloadMonthlyStats;

// Add remaining functions that are called from HTML
window.closeEditBalanceModal = function() {
    document.getElementById('editBalanceModal').style.display = 'none';
};

window.confirmBalanceUpdate = function() {
    const newBalanceInput = document.getElementById('newBalanceInput');
    const newBalance = parseFloat(newBalanceInput?.value);
    
    if (isNaN(newBalance) || newBalance <= 0) {
        showToast('Please enter a valid balance', 'error');
        return;
    }
    
    startingBalance = newBalance;
    saveAccountBalance();
    updateAccountBalanceDisplay();
    
    if (equityChart) {
        const activePeriodBtn = document.querySelector('.period-btn.active');
        const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
        equityChart.data = getEquityData(period);
        equityChart.update();
    }
    
    closeEditBalanceModal();
    showToast('Starting balance updated successfully!', 'success');
};

window.openEditBalanceModal = function() {
    const modal = document.getElementById('editBalanceModal');
    const newBalanceInput = document.getElementById('newBalanceInput');
    
    if (modal) modal.style.display = 'flex';
    if (newBalanceInput) newBalanceInput.value = accountBalance;
};

window.editTodayTrades = function() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    
    if (todayTrades.length === 0) {
        showToast('No trades to edit today', 'warning');
        return;
    }
    
    document.getElementById('editTradesModal').style.display = 'flex';
    
    const editList = document.getElementById('todayTradesEditList');
    editList.innerHTML = todayTrades.map(trade => `
        <div class="edit-trade-item">
            <div class="trade-info">
                <strong>Trade ${trade.tradeNumber} (${trade.time})</strong>
                <span>${trade.pair} - ${trade.strategy}</span>
                <span class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</span>
            </div>
            <div class="trade-actions">
                <button class="action-btn edit-btn" onclick="editTrade(${trade.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTrade(${trade.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
};

window.closeEditTradesModal = function() {
    document.getElementById('editTradesModal').style.display = 'none';
};

window.showCustomStrategy = function() {
    const customStrategy = document.getElementById('customStrategy');
    if (customStrategy) {
        customStrategy.style.display = 'block';
        customStrategy.focus();
    }
};

// Add trade edit/delete functions
window.editTrade = function(tradeId) {
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
        showToast('Trade not found', 'error');
        return;
    }
    
    const trade = trades[tradeIndex];
    document.getElementById('editTradesModal').style.display = 'flex';
    
    const editList = document.getElementById('todayTradesEditList');
    editList.innerHTML = `
        <div class="edit-trade-form">
            <div class="form-group">
                <label>Trade #</label>
                <input type="number" id="editTradeNumber" class="form-input" value="${trade.tradeNumber}" min="1" max="4">
            </div>
            <div class="form-group">
                <label>Currency Pair</label>
                <input type="text" id="editPair" class="form-input" value="${trade.pair}">
            </div>
            <div class="form-group">
                <label>Strategy</label>
                <input type="text" id="editStrategy" class="form-input" value="${trade.strategy}">
            </div>
            <div class="form-group">
                <label>P&L ($)</label>
                <input type="number" id="editPnl" class="form-input" value="${trade.pnl}" step="0.01">
            </div>
            <div class="form-group">
                <label>Time</label>
                <input type="time" id="editTime" class="form-input" value="${trade.time}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="editNotes" class="form-input">${trade.notes}</textarea>
            </div>
            <input type="hidden" id="editTradeId" value="${trade.id}">
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="saveEditedTrades()">Save Changes</button>
            <button class="btn-outline" onclick="closeEditTradesModal()">Cancel</button>
        </div>
    `;
};

window.saveEditedTrades = function() {
    try {
        const tradeId = parseInt(document.getElementById('editTradeId').value);
        const tradeIndex = trades.findIndex(t => t.id === tradeId);
        
        if (tradeIndex === -1) {
            showToast('Trade not found', 'error');
            return;
        }
        
        trades[tradeIndex] = {
            ...trades[tradeIndex],
            tradeNumber: parseInt(document.getElementById('editTradeNumber').value),
            pair: document.getElementById('editPair').value,
            strategy: document.getElementById('editStrategy').value,
            pnl: parseFloat(document.getElementById('editPnl').value),
            time: document.getElementById('editTime').value,
            notes: document.getElementById('editNotes').value
        };
        
        saveTrades();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        closeEditTradesModal();
        showToast('Trade updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving edited trade:', error);
        showToast('Error updating trade', 'error');
    }
};

window.deleteTrade = function(tradeId) {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) return;
    
    try {
        trades.splice(tradeIndex, 1);
        saveTrades();
        
        updateAccountBalanceDisplay();
        updateRecentActivity();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        updateCalendar();
        
        showToast('Trade deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting trade:', error);
        showToast('Error deleting trade', 'error');
    }
};

// Add all trades update function
window.updateAllTrades = function() {
    const tableBody = document.getElementById('allTradesTable');
    if (!tableBody) return;
    
    try {
        const allTrades = [...trades].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        
        if (allTrades.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-trades">
                        <i class="fas fa-chart-line"></i>
                        <p>No trades recorded yet. Start trading to see your journal here.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = allTrades.map(trade => `
            <tr>
                <td>${formatDateTime(trade.date, trade.time)}</td>
                <td>${trade.tradeNumber}</td>
                <td>${trade.pair}</td>
                <td>${trade.strategy}</td>
                <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</td>
                <td>${trade.notes || 'No notes'}</td>
                <td><span class="status-badge ${trade.pnl >= 0 ? 'profit' : 'loss'}">${trade.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTrade(${trade.id})" title="Edit Trade">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTrade(${trade.id})" title="Delete Trade">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating all trades:', error);
    }
};

// Initialize the updateAllTrades function on load
if (typeof updateAllTrades === 'function') {
    updateAllTrades();
}

console.log('Dashboard script loaded successfully');
