document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ─── DOM refs ──────────────────────────────────────────────
    const canvasWithout = document.getElementById('chartWithout');
    const canvasWith = document.getElementById('chartWith');
    const ctxWithout = canvasWithout.getContext('2d');
    const ctxWith = canvasWith.getContext('2d');

    const shieldOverlay = document.getElementById('shieldOverlay');
    const shieldStatus = document.getElementById('shieldStatus');

    const statusWithout = document.getElementById('statusWithout');
    const statusWith = document.getElementById('statusWith');

    const mwDrawdown = document.getElementById('mw-drawdown');
    const mwBalance = document.getElementById('mw-balance');
    const mwStatus = document.getElementById('mw-status');

    const mw2Drawdown = document.getElementById('mw2-drawdown');
    const mw2Balance = document.getElementById('mw2-balance');
    const mw2Status = document.getElementById('mw2-status');

    const resultSaved = document.getElementById('resultSaved');
    const resultBlown = document.getElementById('resultBlown');
    const resultFees = document.getElementById('resultFees');

    const ddTriggerSlider = document.getElementById('ddTriggerSlider');
    const drgStrengthSlider = document.getElementById('drgStrengthSlider');
    const ddTriggerValue = document.getElementById('ddTriggerValue');
    const drgStrengthValue = document.getElementById('drgStrengthValue');
    const resetBtn = document.getElementById('resetBtn');

    // ─── Chart config ──────────────────────────────────────────
    const WINDOW_SIZE = 60;
    const CHART_PADDING = 8;
    let chartWidth = 0;
    let chartHeight = 0;

    // ─── State ──────────────────────────────────────────────────
    const state = {
        w: {
            priceData: [],
            currentPrice: 100,
            drawdown: 0,
            balance: 10000,
            failed: false,
            blownCount: 0,
            reentryFeePaid: 0,
            peak: 100,
        },
        w2: {
            priceData: [],
            currentPrice: 100,
            drawdown: 0,
            balance: 10000,
            drgActive: true,
            protected: 0,
            peak: 100,
            earningsEarned: 0,
        },
        params: {
            ddTrigger: 2.5,
            drgStrength: 0.6,
        },
        totalFrames: 0,
        maxFrames: 300,
        challengePassed: false,
        running: false,
        loopTimeout: null,
        priceHistory: [],
    };

    // ─── Data generator ────────────────────────────────────────
    function generateMarketData() {
        const data = [];
        let price = 100;
        let volatility = 0.5;
        let trend = 0;

        for (let i = 0; i < 300; i++) {
            if (Math.random() < 0.005) volatility = 0.3 + Math.random() * 1.5;
            if (Math.random() < 0.01) trend = (Math.random() - 0.5) * 0.4;
            const change = (Math.random() - 0.5) * volatility + trend;
            price = Math.max(90, Math.min(110, price + change));
            data.push(price);
        }
        return data;
    }

    // ─── Resize canvases ──────────────────────────────────────
    function resizeCanvases() {
        const rect1 = canvasWithout.parentElement.getBoundingClientRect();
        const rect2 = canvasWith.parentElement.getBoundingClientRect();
        const w1 = Math.floor(rect1.width - 12);
        const h1 = Math.min(160, w1 * 0.4);
        canvasWithout.width = w1 * 2;
        canvasWithout.height = h1 * 2;
        canvasWithout.style.width = w1 + 'px';
        canvasWithout.style.height = h1 + 'px';
        chartWidth = w1 * 2;
        chartHeight = h1 * 2;

        const w2 = Math.floor(rect2.width - 12);
        const h2 = Math.min(160, w2 * 0.4);
        canvasWith.width = w2 * 2;
        canvasWith.height = h2 * 2;
        canvasWith.style.width = w2 + 'px';
        canvasWith.style.height = h2 + 'px';
    }

    // ─── Draw a single chart ──────────────────────────────────
    function drawChart(ctx, data, highlightShield, earnings) {
        const w = chartWidth;
        const h = chartHeight;
        ctx.clearRect(0, 0, w, h);

        if (!data || data.length < 2) return;

        const displayData = data.slice(-WINDOW_SIZE);
        const min = Math.min(...displayData) - 1.5;
        const max = Math.max(...displayData) + 1.5;
        const range = max - min || 1;
        const padding = CHART_PADDING;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            const y = padding + (i / 3) * (h - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        // Price line
        ctx.beginPath();
        for (let i = 0; i < displayData.length; i++) {
            const x = padding + (i / (displayData.length - 1)) * (w - padding * 2);
            const y = padding + ((max - displayData[i]) / range) * (h - padding * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        const lineColor = highlightShield ? '#00e676' : '#3b82f6';
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = highlightShield ? 'rgba(0,230,118,0.15)' : 'rgba(59,130,246,0.15)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill under line
        const lastX = padding + ((displayData.length - 1) / (displayData.length - 1)) * (w - padding * 2);
        const lastY = padding + ((max - displayData[displayData.length - 1]) / range) * (h - padding * 2);
        ctx.lineTo(lastX, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        const color = highlightShield ? 'rgba(0,230,118,0.06)' : 'rgba(59,130,246,0.06)';
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(59,130,246,0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Shield icon
        if (highlightShield && displayData.length > 5) {
            const lastIdx = displayData.length - 1;
            const x = padding + (lastIdx / (displayData.length - 1)) * (w - padding * 2);
            const y = padding + ((max - displayData[lastIdx]) / range) * (h - padding * 2);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = '#00e676';
            ctx.shadowColor = 'rgba(0,230,118,0.3)';
            ctx.shadowBlur = 12;
            ctx.fillText('🛡️', x - 18, y - 2);
            ctx.shadowBlur = 0;

            if (earnings > 0) {
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#00e676';
                ctx.textBaseline = 'top';
                ctx.fillText('+$' + Math.round(earnings), x - 18, y + 8);
            }
        }

        // Drawdown limit line
        if (displayData.length > 0) {
            const peak = Math.max(...displayData);
            const ddLimitPrice = peak * 0.95;
            if (ddLimitPrice >= min && ddLimitPrice <= max) {
                const y = padding + ((max - ddLimitPrice) / range) * (h - padding * 2);
                ctx.strokeStyle = 'rgba(239,68,68,0.15)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 4]);
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(w - padding, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(239,68,68,0.25)';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText('5% limit', w - padding, y - 2);
            }
        }
    }

    // ─── Update metrics ──────────────────────────────────────
    function updateMetrics() {
        const w = state.w;
        const w2 = state.w2;

        mwDrawdown.textContent = w.drawdown.toFixed(1) + '%';
        mwDrawdown.className = 'metric-value' + (w.drawdown > 4.5 ? ' red' : w.drawdown > 2.5 ? ' amber' : '');
        mwBalance.textContent = '$' + Math.round(w.balance).toLocaleString();
        mwBalance.className = 'metric-value' + (w.balance < 5000 ? ' red' : '');
        const wStatusText = w.failed ? '💀 BLOWN' : 'ACTIVE';
        mwStatus.textContent = wStatusText;
        mwStatus.className = 'metric-value' + (w.failed ? ' red' : '');
        statusWithout.textContent = wStatusText;
        statusWithout.className = 'status-tag' + (w.failed ? ' fail' : '');

        mw2Drawdown.textContent = w2.drawdown.toFixed(1) + '%';
        mw2Drawdown.className = 'metric-value' + (w2.drawdown > 4.5 ? ' red' : w2.drawdown > 2.5 ? ' amber' : 'green');
        mw2Balance.textContent = '$' + Math.round(w2.balance).toLocaleString();
        mw2Balance.className = 'metric-value' + (w2.balance < 5000 ? ' red' : '');
        const w2StatusText = w2.drgActive ? '🛡️ PROTECTED' : 'ACTIVE';
        mw2Status.textContent = w2StatusText;
        mw2Status.className = 'metric-value' + (w2.drgActive ? ' green' : '');
        statusWith.textContent = w2.drgActive ? 'PROTECTED' : 'ACTIVE';
        statusWith.className = 'status-tag pass';

        shieldOverlay.className = w2.drgActive ? 'shield-overlay on' : 'shield-overlay off';
        shieldStatus.textContent = w2.drgActive ? 'DRG ON' : 'DRG OFF';

        const saved = Math.round(w2.balance - w.balance);
        resultSaved.textContent = '+$' + Math.max(0, saved).toLocaleString();
        resultBlown.textContent = w.blownCount;
        resultFees.textContent = w.reentryFeePaid;
    }

    // ─── Simulation step ──────────────────────────────────────
    function stepSimulation() {
        if (!state.running) return;

        if (state.totalFrames >= state.maxFrames) {
            state.running = false;
            if (state.w.failed) {
                statusWithout.textContent = '💀 BLOWN';
                statusWithout.className = 'status-tag fail';
            }
            if (state.challengePassed) {
                statusWith.textContent = '✅ PASSED';
                statusWith.className = 'status-tag pass';
                mw2Status.textContent = 'PASSED';
                mw2Status.className = 'metric-value green';
            }
            updateMetrics();
            state.loopTimeout = setTimeout(resetAndRestart, 4000);
            return;
        }

        const nextPrice = state.priceHistory[state.totalFrames];
        if (nextPrice === undefined) {
            state.running = false;
            return;
        }

        state.totalFrames++;
        const newPrice = nextPrice;

        state.w.currentPrice = newPrice;
        state.w2.currentPrice = newPrice;

        // ── Without DRG ──
        state.w.priceData.push(newPrice);
        if (state.w.priceData.length > 200) state.w.priceData.shift();
        if (newPrice > state.w.peak) state.w.peak = newPrice;
        state.w.drawdown = ((state.w.peak - newPrice) / state.w.peak) * 100;
        state.w.balance = Math.max(0, 10000 - state.w.drawdown * 180);
        if (state.w.drawdown >= state.params.ddTrigger && !state.w.failed) {
            state.w.failed = true;
            state.w.blownCount++;
            state.w.reentryFeePaid += 50;
            state.w.balance = Math.max(0, state.w.balance - 50);
            state.w.peak = newPrice;
        }

        // ── With DRG ──
        state.w2.priceData.push(newPrice);
        if (state.w2.priceData.length > 200) state.w2.priceData.shift();
        if (newPrice > state.w2.peak) state.w2.peak = newPrice;
        state.w2.drawdown = ((state.w2.peak - newPrice) / state.w2.peak) * 100;

        const drgStrength = state.params.drgStrength;
        if (state.w2.drgActive) {
            const effectiveDD = state.w2.drawdown * (1 - drgStrength);
            state.w2.balance = Math.max(0, 10000 - effectiveDD * 140);
            if (state.w2.drawdown < 1.0 && state.w2.balance > 9500) {
                state.w2.earningsEarned += 0.5;
                state.w2.balance += 0.3;
            }
        } else {
            state.w2.balance = Math.max(0, 10000 - state.w2.drawdown * 160);
        }
        state.w2.balance = Math.max(0, state.w2.balance);

        if (state.totalFrames > 30 && state.w2.balance > 9000 && !state.challengePassed) {
            state.challengePassed = true;
            state.w2.protected++;
        }

        drawChart(ctxWithout, state.w.priceData, false, 0);
        drawChart(ctxWith, state.w2.priceData, state.w2.drgActive, state.w2.earningsEarned);
        updateMetrics();

        setTimeout(stepSimulation, 120);
    }

    // ─── Reset and restart ────────────────────────────────────
    function resetAndRestart() {
        state.priceHistory = generateMarketData();
        state.maxFrames = state.priceHistory.length;

        const initialPrice = state.priceHistory[0] || 100;
        const initialData = [initialPrice];

        state.w.priceData = [...initialData];
        state.w2.priceData = [...initialData];
        state.w.currentPrice = initialPrice;
        state.w2.currentPrice = initialPrice;
        state.w.peak = initialPrice;
        state.w2.peak = initialPrice;
        state.w.balance = 10000;
        state.w.drawdown = 0;
        state.w.failed = false;
        state.w.blownCount = 0;
        state.w.reentryFeePaid = 0;
        state.w2.balance = 10000;
        state.w2.drawdown = 0;
        state.w2.drgActive = true;
        state.w2.earningsEarned = 0;
        state.totalFrames = 0;
        state.challengePassed = false;
        state.running = true;

        resizeCanvases();
        drawChart(ctxWithout, state.w.priceData, false, 0);
        drawChart(ctxWith, state.w2.priceData, state.w2.drgActive, state.w2.earningsEarned);
        updateMetrics();
        statusWithout.textContent = 'ACTIVE';
        statusWithout.className = 'status-tag';
        statusWith.textContent = 'PROTECTED';
        statusWith.className = 'status-tag pass';

        setTimeout(stepSimulation, 300);
    }

    // ─── Controls ──────────────────────────────────────────────
    function setupControls() {
        ddTriggerSlider.addEventListener('input', function() {
            state.params.ddTrigger = parseFloat(this.value);
            ddTriggerValue.textContent = this.value + '%';
        });
        drgStrengthSlider.addEventListener('input', function() {
            state.params.drgStrength = parseFloat(this.value);
            drgStrengthValue.textContent = Math.round(this.value * 100) + '%';
        });
        resetBtn.addEventListener('click', function() {
            if (state.loopTimeout) clearTimeout(state.loopTimeout);
            state.running = false;
            setTimeout(resetAndRestart, 100);
        });
    }

    // ─── Init ──────────────────────────────────────────────────
    function init() {
        setupControls();
        resizeCanvases();
        resetAndRestart();

        window.addEventListener('resize', function() {
            resizeCanvases();
            drawChart(ctxWithout, state.w.priceData, false, 0);
            drawChart(ctxWith, state.w2.priceData, state.w2.drgActive, state.w2.earningsEarned);
        });
    }

    init();
});