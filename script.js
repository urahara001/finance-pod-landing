// --- UNIFIED MASTER STATE STORAGE & PERSISTENCE ---

const MASTER_STORAGE_KEY = 'safety_net_master_state';

let accounts = [
    { id: 1, name: 'Apex Evaluation #1', start: 50000, current: 51800, status: 'Active' },
    { id: 2, name: 'Topstep Combine #2', start: 50000, current: 49200, status: 'Warning' }
];

function getMasterState() {
    return {
        calculator: {
            propFirm: document.getElementById('propFirm').value,
            startingBalance: document.getElementById('startingBalance').value,
            drawdownPercent: document.getElementById('drawdownPercent').value,
            drawdownDollar: document.getElementById('drawdownDollar').value,
            peakPercent: document.getElementById('peakPercent').value,
            peakDollar: document.getElementById('peakDollar').value,
            currentPercent: document.getElementById('currentPercent').value,
            currentDollar: document.getElementById('currentDollar').value,
            simPnlPercent: document.getElementById('simPnlPercent').value,
            simPnlDollar: document.getElementById('simPnlDollar').value
        },
        accounts: accounts
    };
}

function saveMasterStateLocally() {
    const masterState = getMasterState();
    
    // Save to localStorage
    localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(masterState));
    
    // Synchronize to persistent 1-year browser cookie
    document.cookie = `safety_net_data=${encodeURIComponent(JSON.stringify(masterState))}; path=/; max-age=31536000; Secure; SameSite=Lax`;
}

function loadMasterState() {
    const saved = localStorage.getItem(MASTER_STORAGE_KEY);
    if (!saved) return;

    try {
        const masterState = JSON.parse(saved);
        
        if (masterState.calculator) {
            const calc = masterState.calculator;
            if (calc.propFirm) document.getElementById('propFirm').value = calc.propFirm;
            if (calc.startingBalance) document.getElementById('startingBalance').value = calc.startingBalance;
            if (calc.drawdownPercent) document.getElementById('drawdownPercent').value = calc.drawdownPercent;
            if (calc.drawdownDollar) document.getElementById('drawdownDollar').value = calc.drawdownDollar;
            if (calc.peakPercent) document.getElementById('peakPercent').value = calc.peakPercent;
            if (calc.peakDollar) document.getElementById('peakDollar').value = calc.peakDollar;
            if (calc.currentPercent) document.getElementById('currentPercent').value = calc.currentPercent;
            if (calc.currentDollar) document.getElementById('currentDollar').value = calc.currentDollar;
            if (calc.simPnlPercent) document.getElementById('simPnlPercent').value = calc.simPnlPercent;
            if (calc.simPnlDollar) document.getElementById('simPnlDollar').value = calc.simPnlDollar;
        }

        if (masterState.accounts && Array.isArray(masterState.accounts)) {
            accounts = masterState.accounts;
        }
    } catch (e) {
        console.error("Failed to parse saved master state:", e);
    }
}

// --- LEDGER JOURNAL LOGIC ---

function saveAndRenderAccounts() {
    saveMasterStateLocally();
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

        document.getElementById('accName').value = '';
        document.getElementById('accStart').value = '50000';
        document.getElementById('accCurrent').value = '51200';
        document.getElementById('accStatus').value = 'Active';
    });
}

// --- EVENT LISTENERS & LINKED CALCULATIONS ---

document.getElementById('propFirm').addEventListener('change', () => { calculateMetrics(); saveMasterStateLocally(); });
document.getElementById('startingBalance').addEventListener('input', () => { handleStartingBalanceChange(); saveMasterStateLocally(); });
document.getElementById('drawdownPercent').addEventListener('input', () => { handleDrawdownPercentChange(); saveMasterStateLocally(); });
document.getElementById('drawdownDollar').addEventListener('input', () => { handleDrawdownDollarChange(); saveMasterStateLocally(); });

document.getElementById('peakPercent').addEventListener('input', () => { handlePeakPercentChange(); saveMasterStateLocally(); });
document.getElementById('peakDollar').addEventListener('input', () => { handlePeakDollarChange(); saveMasterStateLocally(); });

document.getElementById('currentPercent').addEventListener('input', () => { handleCurrentPercentChange(); saveMasterStateLocally(); });
document.getElementById('currentDollar').addEventListener('input', () => { handleCurrentDollarChange(); saveMasterStateLocally(); });

document.getElementById('simPnlPercent').addEventListener('input', () => { handleSimPnlPercentChange(); saveMasterStateLocally(); });
document.getElementById('simPnlDollar').addEventListener('input', () => { handleSimPnlDollarChange(); saveMasterStateLocally(); });

// Top Update & Save Data Button Handler
const bookmarkBtn = document.getElementById('bookmarkBtn');
if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', function() {
        saveMasterStateLocally();
        const toast = document.getElementById('saveToast');
        if (toast) {
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 6000);
        }
    });
}

// Bottom Ledger "Update & Save Data" Button Handler
const updateLedgerBtn = document.getElementById('updateLedgerBtn');
if (updateLedgerBtn) {
    updateLedgerBtn.addEventListener('click', function() {
        saveMasterStateLocally();
        const ledgerToast = document.getElementById('ledgerSaveToast');
        if (ledgerToast) {
            ledgerToast.style.display = 'block';
            setTimeout(() => { ledgerToast.style.display = 'none'; }, 6000);
        }
    });
}

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

    if (!bufferElem || !explanation || !floorElem || !projectedElem) return;

    if (current > highest) {
        bufferElem.innerText = "ERROR";
        bufferElem.className = 'metric-tile-val warning';
        floorElem.innerText = "---";
        projectedElem.innerText = "---";
        explanation.className = "analysis-box";
        explanation.innerHTML = `<em>Current Equity cannot be greater than Highest Peak Equity. Please verify inputs.</em>`;
        return;
    }

    if (firmRule === 'static') {
        trueLossFloor = startBal - maxDrawdownGap;
    } else if (firmRule === 'intraday') {
        trueLossFloor = highest - maxDrawdownGap;
    }

    const projectedEquityValue = current + simPnl;
    const postStressBuffer = projectedEquityValue - trueLossFloor;

    floorElem.innerText = '$' + trueLossFloor.toLocaleString(undefined, {maximumFractionDigits: 0});
    projectedElem.innerText = '$' + projectedEquityValue.toLocaleString(undefined, {maximumFractionDigits: 0});

    if (postStressBuffer < 0) {
        bufferElem.innerText = '-$' + Math.abs(postStressBuffer).toLocaleString(undefined, {maximumFractionDigits: 0}) + ' (BREACH)';
        bufferElem.className = 'metric-tile-val danger';
        explanation.className = "analysis-box"; 
        explanation.innerHTML = `<strong>⚠️ CRITICAL WARNING:</strong> If this trade results in a PnL change of <strong>$${simPnl.toLocaleString()}</strong>, your equity drops to <strong>$${projectedEquityValue.toLocaleString()}</strong>, crashing through your liquidation floor of <strong>$${trueLossFloor.toLocaleString()}</strong>. Your account will breach.`;
    } else if (postStressBuffer < (maxDrawdownGap * 0.3)) {
        bufferElem.innerText = '$' + postStressBuffer.toLocaleString(undefined, {maximumFractionDigits: 0});
        bufferElem.className = 'metric-tile-val warning';
        explanation.className = "analysis-box"; 
        explanation.innerHTML = `<strong>⚠️ TIGHT MARGIN:</strong> This trade outcome leaves you with a razor-thin buffer of just <strong>$${postStressBuffer.toLocaleString()}</strong> above your structural limit. Tighten your stop-loss or secure partial profits.`;
    } else {
        bufferElem.innerText = '$' + postStressBuffer.toLocaleString(undefined, {maximumFractionDigits: 0});
        bufferElem.className = 'metric-tile-val';
        explanation.className = "analysis-box safe-zone"; 
        explanation.innerHTML = `<strong>Status: Secure.</strong> With this simulated trade PnL, your projected equity maintains a safe buffer of <strong>$${postStressBuffer.toLocaleString()}</strong> above the liquidation floor.`;
    }
}

// Boot up state restoration
loadMasterState();
calculateMetrics();
renderAccountsTable();