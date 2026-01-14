// dashboard.js - Lógica do Dashboard

let weightChartPeriod = 'week';
let waistChartPeriod = 'week';

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

function loadDashboard() {
    const profile = getProfile();
    const entries = getEntriesSorted();
    const latest = getLatestEntry();

    // Verificar se tem perfil configurado
    if (!profile || !profile.height || !profile.gender) {
        showConfigurationPrompt();
        return;
    }

    // Verificar se tem registros
    if (entries.length === 0) {
        showFirstEntryPrompt();
        return;
    }

    // Carregar dados
    loadUserInfo(profile);
    loadSummaryCards(latest, entries, profile);
    loadMetabolicHealth(latest, profile);
    loadWeightChart();
    loadWaistChart();
    loadAbdominalRisk(latest, profile);
}

// ==================== INFORMAÇÕES DO USUÁRIO ====================

function loadUserInfo(profile) {
    if (profile.name) {
        document.getElementById('user-name').textContent = profile.name;
    }
}

// ==================== CARDS DE RESUMO ====================

function loadSummaryCards(latest, entries, profile) {
    // Peso Atual
    const currentWeightEl = document.getElementById('current-weight');
    currentWeightEl.innerHTML = `${formatWeight(latest.weight)}<span class="text-lg ml-1 font-medium text-gray-400">kg</span>`;
    document.getElementById('summary-current-weight').innerHTML = `${formatWeight(latest.weight)}<span class="text-xs font-medium text-gray-400 ml-0.5">kg</span>`;

    // Mudança de Peso (comparar com registro anterior)
    const weightChangeEl = document.getElementById('weight-change');
    if (entries.length > 1) {
        const previousWeight = entries[1].weight;
        const change = latest.weight - previousWeight;
        
        if (change < 0) {
            weightChangeEl.innerHTML = `
                <span class="material-symbols-outlined text-sm text-emerald-500">trending_down</span>
                <span class="text-emerald-500">${formatWeight(Math.abs(change))}kg</span>
            `;
        } else if (change > 0) {
            weightChangeEl.innerHTML = `
                <span class="material-symbols-outlined text-sm text-red-500">trending_up</span>
                <span class="text-red-500">+${formatWeight(change)}kg</span>
            `;
        } else {
            weightChangeEl.innerHTML = `
                <span class="text-gray-400">Sem mudança</span>
            `;
        }
    }

    // IMC
    const currentBmiEl = document.getElementById('current-bmi');
    const bmiCategoryEl = document.getElementById('bmi-category');
    
    currentBmiEl.textContent = formatBMI(latest.bmi);
    
    const category = getBMICategory(latest.bmi);
    let categoryClass = '';
    
    if (latest.bmi < 18.5) {
        categoryClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    } else if (latest.bmi < 25) {
        categoryClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    } else if (latest.bmi < 30) {
        categoryClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    } else {
        categoryClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    }
    
    bmiCategoryEl.className = `inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit uppercase ${categoryClass}`;
    bmiCategoryEl.textContent = category;

    // Total Eliminado (peso)
    const progress = getWeightProgress();
    const totalLostEl = document.getElementById('total-weight-lost');
    
    if (progress && progress.change !== 0) {
        const sign = progress.change < 0 ? '' : '+';
        totalLostEl.innerHTML = `${sign}${formatWeight(progress.change)}<span class="text-xs font-medium text-gray-400 ml-0.5">kg</span>`;
    } else {
        totalLostEl.innerHTML = `0<span class="text-xs font-medium text-gray-400 ml-0.5">kg</span>`;
    }
}

// ==================== SAÚDE METABÓLICA ====================

function loadMetabolicHealth(latest, profile) {
    // RCE - Relação Cintura/Estatura
    if (latest.waist && profile.height) {
        const rce = latest.waist / profile.height;
        const rceEl = document.getElementById('rce-value');
        const rceStatusEl = document.getElementById('rce-status');
        const rceMarkerEl = document.getElementById('rce-marker');
        
        rceEl.textContent = rce.toFixed(2);
        
        // Posição do marcador (0.5 = 50%)
        const position = Math.min(100, (rce / 0.7) * 100);
        rceMarkerEl.style.left = `${position}%`;
        
        // Status
        if (rce < 0.5) {
            rceStatusEl.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 uppercase';
            rceStatusEl.textContent = 'IDEAL';
        } else if (rce < 0.6) {
            rceStatusEl.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 uppercase';
            rceStatusEl.textContent = 'MODERADO';
        } else {
            rceStatusEl.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 uppercase';
            rceStatusEl.textContent = 'ALTO';
        }
    } else {
        document.getElementById('rce-value').textContent = '-';
        document.getElementById('rce-status').textContent = '-';
    }

    // RFM - Relative Fat Mass
    if (latest.waist && profile.height && profile.gender) {
        const rfm = calculateRFM(latest.waist, profile.height, profile.gender);
        const rfmEl = document.getElementById('rfm-value');
        const rfmStatusEl = document.getElementById('rfm-status');
        const rfmMarkerEl = document.getElementById('rfm-marker');
        
        rfmEl.innerHTML = `${rfm.toFixed(1)}<span class="text-base">%</span>`;
        
        // Posição do marcador
        let position;
        if (profile.gender === 'male') {
            position = Math.min(100, (rfm / 35) * 100);
        } else {
            position = Math.min(100, (rfm / 40) * 100);
        }
        rfmMarkerEl.style.left = `${position}%`;
        
        // Status baseado no gênero
        let statusClass = '';
        let statusText = '';
        
        if (profile.gender === 'male') {
            if (rfm < 14) {
                statusClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
                statusText = 'ATLETA';
            } else if (rfm < 21) {
                statusClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
                statusText = 'FITNESS';
            } else if (rfm < 25) {
                statusClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
                statusText = 'MÉDIO';
            } else {
                statusClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                statusText = 'ELEVADO';
            }
        } else {
            if (rfm < 21) {
                statusClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
                statusText = 'ATLETA';
            } else if (rfm < 28) {
                statusClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
                statusText = 'FITNESS';
            } else if (rfm < 32) {
                statusClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
                statusText = 'MÉDIO';
            } else {
                statusClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                statusText = 'ELEVADO';
            }
        }
        
        rfmStatusEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass} uppercase`;
        rfmStatusEl.textContent = statusText;
    } else {
        document.getElementById('rfm-value').innerHTML = `-<span class="text-base">%</span>`;
        document.getElementById('rfm-status').textContent = '-';
    }
}

// Calcular RFM
function calculateRFM(waist, heightCm, gender) {
    const height = heightCm / 100; // converter para metros
    
    if (gender === 'male') {
        return 64 - (20 * height / waist) + (12 * 1); // 1 = idade fictícia normalizada
    } else {
        return 76 - (20 * height / waist) + (12 * 1);
    }
}

// ==================== RISCO ABDOMINAL ====================

function loadAbdominalRisk(latest, profile) {
    if (!latest.waist || !profile.gender) return;

    const waistRiskBadgeEl = document.getElementById('waist-risk-badge');
    const waistRiskMarkerEl = document.getElementById('waist-risk-marker');
    const waistRiskInfoEl = document.getElementById('waist-risk-info');
    
    let risk = '';
    let position = 0;
    let badgeClass = '';
    let infoText = '';
    
    if (profile.gender === 'male') {
        if (latest.waist < 94) {
            risk = 'BAIXO';
            position = (latest.waist / 94) * 50;
            badgeClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
            infoText = `Excelente! Sua cintura está abaixo de 94cm. Continue assim para manter o risco cardiovascular baixo.`;
        } else if (latest.waist < 102) {
            risk = 'MODERADO';
            position = 50 + ((latest.waist - 94) / 8) * 25;
            badgeClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
            infoText = `A gordura abdominal está em nível moderado. Alvo: reduzir para abaixo de 94cm para homens.`;
        } else {
            risk = 'ALTO';
            position = Math.min(100, 75 + ((latest.waist - 102) / 20) * 25);
            badgeClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
            infoText = `Atenção! Risco cardiovascular elevado. Busque reduzir a cintura para abaixo de 94cm.`;
        }
    } else {
        if (latest.waist < 80) {
            risk = 'BAIXO';
            position = (latest.waist / 80) * 50;
            badgeClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
            infoText = `Excelente! Sua cintura está abaixo de 80cm. Continue assim para manter o risco cardiovascular baixo.`;
        } else if (latest.waist < 88) {
            risk = 'MODERADO';
            position = 50 + ((latest.waist - 80) / 8) * 25;
            badgeClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
            infoText = `A gordura abdominal está em nível moderado. Alvo: reduzir para abaixo de 80cm para mulheres.`;
        } else {
            risk = 'ALTO';
            position = Math.min(100, 75 + ((latest.waist - 88) / 20) * 25);
            badgeClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
            infoText = `Atenção! Risco cardiovascular elevado. Busque reduzir a cintura para abaixo de 80cm.`;
        }
    }
    
    waistRiskBadgeEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass} uppercase`;
    waistRiskBadgeEl.textContent = risk;
    waistRiskMarkerEl.style.left = `${position}%`;
    waistRiskInfoEl.textContent = infoText;
    
    // Cintura Atual
    document.getElementById('summary-current-waist').innerHTML = `${latest.waist}<span class="text-xs font-medium text-gray-400 ml-0.5">cm</span>`;
    
    // Total Eliminado (cintura)
    const entries = getEntriesSorted(false);
    const entriesWithWaist = entries.filter(e => e.waist);
    
    if (entriesWithWaist.length > 1) {
        const firstWaist = entriesWithWaist[0].waist;
        const currentWaist = latest.waist;
        const change = currentWaist - firstWaist;
        
        const totalWaistLostEl = document.getElementById('total-waist-lost');
        const sign = change < 0 ? '' : '+';
        totalWaistLostEl.innerHTML = `${sign}${change.toFixed(1)}<span class="text-xs font-medium text-gray-400 ml-0.5">cm</span>`;
    }
}

// ==================== MUDANÇA DE PERÍODO ====================

function changeWeightPeriod(period) {
    weightChartPeriod = period;
    
    // Atualizar botões
    document.getElementById('weight-week').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    document.getElementById('weight-month').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    document.getElementById('weight-all').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    
    document.getElementById(`weight-${period}`).className = 'px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-600 shadow-sm text-primary';
    
    loadWeightChart();
}

function changeWaistPeriod(period) {
    waistChartPeriod = period;
    
    // Atualizar botões
    document.getElementById('waist-week').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    document.getElementById('waist-month').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    document.getElementById('waist-all').className = 'px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 uppercase';
    
    document.getElementById(`waist-${period}`).className = 'px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-600 shadow-sm text-accent-blue';
    
    loadWaistChart();
}

// ==================== CARREGAR GRÁFICOS ====================

function loadWeightChart() {
    const entries = getEntriesSorted(false); // Mais antigos primeiro
    let filteredEntries = [];
    
    if (weightChartPeriod === 'week') {
        filteredEntries = entries.slice(-7);
    } else if (weightChartPeriod === 'month') {
        filteredEntries = entries.slice(-30);
    } else {
        filteredEntries = entries;
    }
    
    const weights = filteredEntries.map(e => e.weight);
    const labels = filteredEntries.map(e => {
        const date = new Date(e.date + 'T00:00:00');
        const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
        return weekday;
    });
    
    drawWeightChart(weights, labels);
    updateWeightLabels(labels, filteredEntries);
}

function loadWaistChart() {
    const entries = getEntriesSorted(false).filter(e => e.waist); // Apenas com cintura
    let filteredEntries = [];
    
    if (waistChartPeriod === 'week') {
        filteredEntries = entries.slice(-7);
    } else if (waistChartPeriod === 'month') {
        filteredEntries = entries.slice(-30);
    } else {
        filteredEntries = entries;
    }
    
    const waists = filteredEntries.map(e => e.waist);
    const labels = filteredEntries.map(e => {
        const date = new Date(e.date + 'T00:00:00');
        const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
        return weekday;
    });
    
    drawWaistChart(waists, labels);
    updateWaistLabels(labels, filteredEntries);
}

function updateWeightLabels(labels, entries) {
    const container = document.getElementById('weight-labels');
    const today = new Date().getDay();
    
    container.innerHTML = labels.map((label, i) => {
        const isToday = i === entries.length - 1;
        const className = isToday 
            ? 'flex flex-col items-center gap-1 flex-1'
            : 'flex flex-col items-center gap-1 flex-1';
        const spanClass = isToday
            ? 'text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded text-primary uppercase'
            : 'text-[10px] font-bold bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase';
        
        return `<div class="${className}"><span class="${spanClass}">${label}</span></div>`;
    }).join('');
}

function updateWaistLabels(labels, entries) {
    const container = document.getElementById('waist-labels');
    
    container.innerHTML = labels.map((label, i) => {
        const isToday = i === entries.length - 1;
        const className = 'flex flex-col items-center gap-1 flex-1';
        const spanClass = isToday
            ? 'text-[10px] font-bold bg-accent-blue/10 px-1.5 py-0.5 rounded text-accent-blue uppercase'
            : 'text-[10px] font-bold bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase';
        
        return `<div class="${className}"><span class="${spanClass}">${label}</span></div>`;
    }).join('');
}

// ==================== PROMPTS ====================

function showConfigurationPrompt() {
    if (confirm('Configure seu perfil primeiro para ver o dashboard completo!')) {
        window.location.href = 'profile.html';
    }
}

function showFirstEntryPrompt() {
    if (confirm('Adicione seu primeiro registro de peso para começar!')) {
        window.location.href = 'add-entry.html';
    }
}
