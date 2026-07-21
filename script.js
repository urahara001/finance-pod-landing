// Add event listeners to all active calculation inputs
document.getElementById('propFirm').addEventListener('change', calculateMetrics);
document.getElementById('startingBalance').addEventListener('input', handleStartingBalanceChange);
document.getElementById('drawdownPercent').addEventListener('input', handleDrawdownPercentChange);
document.getElementById('drawdownDollar').addEventListener('input', handleDrawdownDollarChange);

document.getElementById('peakPercent').addEventListener('input', handlePeakPercentChange);
document.getElementById('peakDollar').addEventListener('input', handlePeakDollarChange);

document.getElementById('currentPercent').addEventListener('input', handleCurrentPercentChange);
document.getElementById('currentDollar').addEventListener('input', handleCurrentDollarChange);

document.getElementById('simPnlPercent').addEventListener('input', handleSimPnlPercentChange);
document.getElementById('simPnlDollar').addEventListener('input', handleSimPnlDollarChange);

function handleStartingBalanceChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 0;
    const ddPct = parseFloat(document.getElementById('drawdownPercent').value) || 5.0;
    document.getElementById('drawdownDollar').value = (startBal * (ddPct / 100)).toFixed(0);

    const peakPct = parseFloat(document.getElementById('peakPercent').value) || 6.0;
    document.getElementById('peakDollar').value = (startBal * (1 + peakPct / 100)).toFixed(0);

    const currPct = parseFloat(document.getElementById('currentPercent').value) || 3.0;
    document.getElementById('currentDollar').value = (startBal * (1 + currPct / 100)).toFixed(0);

    const currentEq = parseFloat(document.getElementById('currentDollar').value) || startBal;
    const pnlPct = parseFloat(document.getElementById('simPnlPercent').value) || -2.0;
    document.getElementById('simPnlDollar').value = (currentEq * (pnlPct / 100)).toFixed(0);

    calculateMetrics();
}

function handleDrawdownPercentChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 0;
    const pct = parseFloat(document.getElementById('drawdownPercent').value) || 0;
    document.getElementById('drawdownDollar').value = (startBal * (pct / 100)).toFixed(0);
    calculateMetrics();
}

function handleDrawdownDollarChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 1;
    const dollar = parseFloat(document.getElementById('drawdownDollar').value) || 0;
    document.getElementById('drawdownPercent').value = ((dollar / startBal) * 100).toFixed(2);
    calculateMetrics();
}

function handlePeakPercentChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 0;
    const pct = parseFloat(document.getElementById('peakPercent').value) || 0;
    document.getElementById('peakDollar').value = (startBal * (1 + pct / 100)).toFixed(0);
    calculateMetrics();
}

function handlePeakDollarChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 1;
    const dollar = parseFloat(document.getElementById('peakDollar').value) || startBal;
    document.getElementById('peakPercent').value = (((dollar - startBal) / startBal) * 100).toFixed(2);
    calculateMetrics();
}

function handleCurrentPercentChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 0;
    const pct = parseFloat(document.getElementById('currentPercent').value) || 0;
    document.getElementById('currentDollar').value = (startBal * (1 + pct / 100)).toFixed(0);
    
    const current = parseFloat(document.getElementById('currentDollar').value) || 0;
    const pnlPct = parseFloat(document.getElementById('simPnlPercent').value) || 0;
    document.getElementById('simPnlDollar').value = (current * (pnlPct / 100)).toFixed(0);

    calculateMetrics();
}

function handleCurrentDollarChange() {
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 1;
    const dollar = parseFloat(document.getElementById('currentDollar').value) || startBal;
    document.getElementById('currentPercent').value = (((dollar - startBal) / startBal) * 100).toFixed(2);

    const pnlPct = parseFloat(document.getElementById('simPnlPercent').value) || 0;
    document.getElementById('simPnlDollar').value = (dollar * (pnlPct / 100)).toFixed(0);

    calculateMetrics();
}

function handleSimPnlPercentChange() {
    const current = parseFloat(document.getElementById('currentDollar').value) || 0;
    const pct = parseFloat(document.getElementById('simPnlPercent').value) || 0;
    document.getElementById('simPnlDollar').value = (current * (pct / 100)).toFixed(0);
    calculateMetrics();
}

function handleSimPnlDollarChange() {
    const current = parseFloat(document.getElementById('currentDollar').value) || 1;
    const dollar = parseFloat(document.getElementById('simPnlDollar').value) || 0;
    document.getElementById('simPnlPercent').value = ((dollar / current) * 100).toFixed(2);
    calculateMetrics();
}

function calculateMetrics() {
    const firmRule = document.getElementById('propFirm').value;
    const startBal = parseFloat(document.getElementById('startingBalance').value) || 0;
    const maxDrawdownGap = parseFloat(document.getElementById('drawdownDollar').value) || 0;
    const highest = parseFloat(document.getElementById('peakDollar').value) || 0;
    const current = parseFloat(document.getElementById('currentDollar').value) || 0;
    const simPnl = parseFloat(document.getElementById('simPnlDollar').value) || 0;

    let trueLossFloor = 0;
    const bufferElem = document.getElementById('trueBuffer');
    const explanation = document.getElementById('explanationText');
    const floorElem = document.getElementById('hardFloor');
    const projectedElem = document.getElementById('projectedEquity');

    // Handle Error state
    if (current > highest) {
        bufferElem.innerText = "ERROR";
        bufferElem.className = 'metric-tile-val warning';
        floorElem.innerText = "---";
        projectedElem.innerText = "---";
        explanation.className = "analysis-box";
        explanation.innerHTML = `<em>Current Equity cannot be greater than Highest Peak Equity. Please verify inputs.</em>`;
        return;
    }

    // Determine current structural floor based on firm rules
    if (firmRule === 'static') {
        trueLossFloor = startBal - maxDrawdownGap;
    } else if (firmRule === 'intraday') {
        trueLossFloor = highest - maxDrawdownGap;
    }

    const projectedEquityValue = current + simPnl;
    const postStressBuffer = projectedEquityValue - trueLossFloor;

    // Update UI Elements
    floorElem.innerText = '$' + trueLossFloor.toLocaleString(undefined, {maximumFractionDigits: 0});
    projectedElem.innerText = '$' + projectedEquityValue.toLocaleString(undefined, {maximumFractionDigits: 0});

    if (postStressBuffer < 0) {
        // Account Terminated Under Stress
        bufferElem.innerText = '-$' + Math.abs(postStressBuffer).toLocaleString(undefined, {maximumFractionDigits: 0}) + ' (BREACH)';
        bufferElem.className = 'metric-tile-val danger';
        explanation.className = "analysis-box"; 
        explanation.innerHTML = `<strong>⚠️ CRITICAL WARNING:</strong> If this trade results in a PnL change of <strong>$${simPnl.toLocaleString()}</strong>, your equity drops to <strong>$${projectedEquityValue.toLocaleString()}</strong>, crashing through your liquidation floor of <strong>$${trueLossFloor.toLocaleString()}</strong>. Your account will breach.`;

    } else if (postStressBuffer < (maxDrawdownGap * 0.3)) {
        // High Risk Zone
        bufferElem.innerText = '$' + postStressBuffer.toLocaleString(undefined, {maximumFractionDigits: 0});
        bufferElem.className = 'metric-tile-val warning';
        explanation.className = "analysis-box"; 
        explanation.innerHTML = `<strong>⚠️ TIGHT MARGIN:</strong> This trade outcome leaves you with a razor-thin buffer of just <strong>$${postStressBuffer.toLocaleString()}</strong> above your structural limit. Tighten your stop-loss or secure partial profits.`;

    } else {
        // Safe Zone
        bufferElem.innerText = '$' + postStressBuffer.toLocaleString(undefined, {maximumFractionDigits: 0});
        bufferElem.className = 'metric-tile-val';
        explanation.className = "analysis-box safe-zone"; 
        explanation.innerHTML = `<strong>Status: Secure.</strong> With this simulated trade PnL, your projected equity maintains a safe buffer of <strong>$${postStressBuffer.toLocaleString()}</strong> above the liquidation floor.`;
    }
}

// --- MULTI-ACCOUNT LEDGER & JOURNAL LOGIC ---

let accounts = JSON.parse(localStorage.getItem('safety_net_accounts')) || [
    { id: 1, name: 'Apex Evaluation #1', start: 50000, current: 51800, status: 'Active' },
    { id: 2, name: 'Topstep Combine #2', start: 50000, current: 49200, status: 'Warning' }
];

function saveAndRenderAccounts() {
    localStorage.setItem('safety_net_accounts', JSON.stringify(accounts));
    renderAccountsTable();
}

function renderAccountsTable() {
    const tbody = document.getElementById('accountTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No accounts tracked yet. Add your evaluation accounts above.</td></tr>`;
        return;
    }

    accounts.forEach(acc => {
        const pnl = acc.current - acc.start;
        const pnlFormatted = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toLocaleString();
        const pnlColor = pnl >= 0 ? 'var(--neon-green)' : 'var(--danger-red)';
        
        let statusClass = 'active';
        if (acc.status === 'Warning') statusClass = 'warning';
        if (acc.status === 'Breached') statusClass = 'breached';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-main); font-weight: 600;">${escapeHtml(acc.name)}</td>
            <td>$${Number(acc.start).toLocaleString()}</td>
            <td>$${Number(acc.current).toLocaleString()}</td>
            <td style="color: ${pnlColor}; font-weight: 700;">${pnlFormatted}</td>
            <td><span class="badge-status ${statusClass}">${acc.status}</span></td>
            <td style="text-align: right;">
                <button onclick="deleteAccount(${acc.id})" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px 8px;" title="Delete Account"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteAccount(id) {
    accounts = accounts.filter(acc => acc.id !== id);
    saveAndRenderAccounts();
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const accountForm = document.getElementById('accountForm');
if (accountForm) {
    accountForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('accName').value;
        const start = parseFloat(document.getElementById('accStart').value) || 50000;
        const current = parseFloat(document.getElementById('accCurrent').value) || start;
        const status = document.getElementById('accStatus').value;

        const newAcc = {
            id: Date.now(),
            name,
            start,
            current,
            status
        };

        accounts.push(newAcc);
        saveAndRenderAccounts();

        // Reset form
        document.getElementById('accName').value = '';
        document.getElementById('accStart').value = '50000';
        document.getElementById('accCurrent').value = '51200';
        document.getElementById('accStatus').value = 'Active';
    });
}

// Initial render on load
renderAccountsTable();

// Initialize on load
calculateMetrics();