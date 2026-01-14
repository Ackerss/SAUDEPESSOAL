// ==============================================
// HEALTH TRACKER - LOGIC (Revisado para novo design)
// ==============================================

// Estrutura de dados
let appData = {
    profile: {
        name: '',
        age: null,
        height: null,
        gender: 'female',
        currentWeight: null,
        currentWaist: null
    },
    measurements: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Verificar se tem dados
    if (!appData.profile.name && appData.measurements.length === 0) {
        document.getElementById('welcome-screen').classList.remove('hidden');
    } else {
        startApp();
    }

    // Configuração inicial
    setTodayDate();
    updateThemeIcon();
    
    // Registrar SW
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registrado'))
            .catch(err => console.error('Erro SW:', err));
    }
});

// ==============================================
// NAVEGAÇÃO E UI
// ==============================================

function startApp() {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    updateHomeScreen();
    showScreen('home-screen');
}

function showScreen(screenId) {
    // Telas
    ['home-screen', 'profile-screen', 'data-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');

    // Navegação Botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-primary', 'active');
        btn.classList.add('text-gray-400');
        const icon = btn.querySelector('.material-symbols-outlined');
        if(icon) icon.classList.remove('filled-icon');
    });

    const activeBtnId = screenId.replace('-screen', '') === 'home' ? 'nav-home' : 'nav-' + screenId.replace('-screen', '');
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
        activeBtn.classList.add('text-primary', 'active');
        activeBtn.classList.remove('text-gray-400');
        const icon = activeBtn.querySelector('.material-symbols-outlined');
        if(icon) icon.classList.add('filled-icon');
    }

    if (screenId === 'profile-screen') loadProfileForm();
    if (screenId === 'data-screen') updateHistoryList();
    if (screenId === 'home-screen') updateHomeScreen();
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}

// ==============================================
// MODAL DE REGISTRO
// ==============================================

function openAddModal() {
    document.getElementById('add-modal').classList.remove('hidden');
    setTodayDate();
    // Tentar preencher cintura anterior
    if (appData.measurements.length > 0) {
        const last = appData.measurements[0];
        if (last.waist) document.getElementById('modal-waist').value = last.waist;
    }
}

function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('modal-date');
    if (dateInput) dateInput.value = today;
}

function saveMeasurement() {
    const weight = parseFloat(document.getElementById('modal-weight').value);
    const waist = parseFloat(document.getElementById('modal-waist').value) || null;
    const date = document.getElementById('modal-date').value;

    if (!weight || !date) {
        alert('Informe pelo menos o Peso e a Data.');
        return;
    }

    const newMeasure = {
        id: Date.now(),
        weight,
        waist,
        date,
        timestamp: new Date(date).getTime()
    };

    appData.measurements.push(newMeasure);
    appData.measurements.sort((a, b) => b.timestamp - a.timestamp); // Mais recente primeiro

    // Atualiza perfil com dados atuais
    appData.profile.currentWeight = weight;
    if (waist) appData.profile.currentWaist = waist;

    saveData();
    closeAddModal();
    
    // Limpar campos
    document.getElementById('modal-weight').value = '';
    
    updateHomeScreen();
    alert('Registro salvo!');
}

// ==============================================
// DASHBOARD & CÁLCULOS
// ==============================================

function updateHomeScreen() {
    // 1. Atualizar Header
    const nameEl = document.getElementById('header-name');
    if (nameEl) nameEl.textContent = appData.profile.name || 'Visitante';

    // 2. Verificar se há dados
    if (appData.measurements.length === 0) return;

    const current = appData.measurements[0];
    const previous = appData.measurements.length > 1 ? appData.measurements[1] : null;

    // 3. Atualizar Peso
    document.getElementById('dash-weight').textContent = current.weight.toFixed(1);
    
    const trendEl = document.getElementById('dash-weight-trend');
    if (previous) {
        const diff = current.weight - previous.weight;
        const icon = diff > 0 ? 'trending_up' : (diff < 0 ? 'trending_down' : 'remove');
        const colorClass = diff > 0 ? 'text-red-500' : (diff < 0 ? 'text-emerald-500' : 'text-gray-400');
        const text = diff === 0 ? 'Estável' : `${Math.abs(diff).toFixed(1)}kg`;
        
        trendEl.className = `mt-1 flex items-center gap-1 text-xs font-bold ${colorClass}`;
        trendEl.innerHTML = `<span class="material-symbols-outlined text-sm">${icon}</span><span>${text}</span>`;
    } else {
        trendEl.innerHTML = `<span class="text-gray-400">Primeiro registro</span>`;
    }

    // 4. Calcular IMC
    if (appData.profile.height) {
        const h = appData.profile.height / 100;
        const bmi = current.weight / (h * h);
        
        document.getElementById('dash-bmi').textContent = bmi.toFixed(1);
        
        const bmiBadge = document.getElementById('dash-bmi-badge');
        let bmiStatus = '';
        let bmiColor = '';
        let bmiBg = '';

        if (bmi < 18.5) { bmiStatus = 'BAIXO PESO'; bmiColor = 'text-blue-600'; bmiBg = 'bg-blue-100 dark:bg-blue-900/30'; }
        else if (bmi < 25) { bmiStatus = 'SAUDÁVEL'; bmiColor = 'text-emerald-600'; bmiBg = 'bg-emerald-100 dark:bg-emerald-900/30'; }
        else if (bmi < 30) { bmiStatus = 'SOBREPESO'; bmiColor = 'text-yellow-600'; bmiBg = 'bg-yellow-100 dark:bg-yellow-900/30'; }
        else { bmiStatus = 'OBESIDADE'; bmiColor = 'text-red-600'; bmiBg = 'bg-red-100 dark:bg-red-900/30'; }

        bmiBadge.className = `mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${bmiBg} ${bmiColor}`;
        bmiBadge.textContent = bmiStatus;
    }

    // 5. Saúde Metabólica (RCE e RFM)
    if (current.waist && appData.profile.height) {
        // RCE
        const rce = current.waist / appData.profile.height;
        document.getElementById('dash-rce').textContent = rce.toFixed(2);
        
        const rceBadge = document.getElementById('dash-rce-badge');
        let rceStatus = rce < 0.5 ? 'ÓTIMO' : (rce < 0.55 ? 'ALERTA' : 'RISCO');
        let rceColor = rce < 0.5 ? 'text-emerald-600 bg-emerald-100' : (rce < 0.55 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100');
        if (document.documentElement.classList.contains('dark')) {
             rceColor = rce < 0.5 ? 'text-emerald-400 bg-emerald-900/30' : (rce < 0.55 ? 'text-yellow-400 bg-yellow-900/30' : 'text-red-400 bg-red-900/30');
        }

        rceBadge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${rceColor}`;
        rceBadge.textContent = rceStatus;

        // Barra RCE (0.4 a 0.7 range visual)
        let rcePos = ((rce - 0.4) / (0.7 - 0.4)) * 100;
        rcePos = Math.max(0, Math.min(100, rcePos));
        document.getElementById('dash-rce-marker').style.left = `${rcePos}%`;

        // RFM
        const hM = appData.profile.height / 100;
        const isMale = appData.profile.gender === 'male';
        let rfm = 0;
        if (isMale) rfm = 64 - (20 * hM / current.waist) + 12; // Aprox formula
        else rfm = 76 - (20 * hM / current.waist); // Aprox formula
        // Formula mais comum: 64 - (20 * (Altura/Cintura)) + (12 * Sexo(0 ou 1)) -> Essa varia muito.
        // Vamos usar a Relative Fat Mass (RFM) = 64 - (20 x (height / waist circumference)) + (12 x sex) where sex = 0 for men and 1 for women.
        // Correção formula Cedars-Sinai: 
        // Homens: 64 - (20 * height / waist)
        // Mulheres: 76 - (20 * height / waist)
        
        // Vamos usar a formula correta implementada antes:
        if (isMale) rfm = 64 - (20 * appData.profile.height / current.waist);
        else rfm = 76 - (20 * appData.profile.height / current.waist);

        document.getElementById('dash-rfm').textContent = rfm.toFixed(1);
        document.getElementById('dash-rfm-badge').textContent = isMale ? (rfm < 20 ? 'FIT' : 'NORMAL') : (rfm < 30 ? 'FIT' : 'NORMAL');
        
        // Barra RFM (Range 10% a 50%)
        let rfmPos = ((rfm - 10) / (50 - 10)) * 100;
        rfmPos = Math.max(0, Math.min(100, rfmPos));
        document.getElementById('dash-rfm-marker').style.left = `${rfmPos}%`;
    }

    // 6. Atualizar Gráfico (SVG Path)
    updateChart();
}

function updateChart() {
    if (appData.measurements.length < 2) return;
    
    // Pegar últimos 7 registros e inverter para cronológico (antigo -> novo)
    const data = appData.measurements.slice(0, 7).reverse(); 
    
    // Configurações do SVG
    const svgHeight = 100;
    const svgWidth = 100;
    
    const minWeight = Math.min(...data.map(d => d.weight)) - 1;
    const maxWeight = Math.max(...data.map(d => d.weight)) + 1;
    const range = maxWeight - minWeight;

    // Gerar pontos
    const points = data.map((d, index) => {
        const x = (index / (data.length - 1)) * svgWidth;
        const y = svgHeight - ((d.weight - minWeight) / range) * svgHeight;
        return `${x},${y}`;
    });

    // Criar Path Smooth (Curva Bézier simples ou linha reta)
    // Para simplificar e garantir visual clean: Linha reta ou curva suave
    // Vamos usar comando 'L' para linha simples e limpa por enquanto, ou 'Q' para curva
    const pathD = `M ${points.join(' L ')}`;
    
    document.getElementById('weight-chart-path').setAttribute('d', pathD);

    // Labels (Dia da semana)
    const labelsContainer = document.getElementById('chart-labels');
    labelsContainer.innerHTML = '';
    
    data.forEach(d => {
        const date = new Date(d.date + 'T12:00:00'); // Fix timezone issue
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
        
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center gap-1 flex-1';
        el.innerHTML = `<span class="text-[9px] font-bold bg-gray-50 dark:bg-gray-700/50 px-1 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase tracking-tighter w-full text-center">${dayName}</span>`;
        labelsContainer.appendChild(el);
    });
}

// ==============================================
// PERFIL
// ==============================================

function loadProfileForm() {
    const p = appData.profile;
    document.getElementById('profile-name').value = p.name || '';
    document.getElementById('profile-age').value = p.age || '';
    document.getElementById('profile-height').value = p.height || '';
    
    if (p.gender === 'male') document.getElementById('gender-male').checked = true;
    else document.getElementById('gender-female').checked = true;
}

function saveProfile() {
    appData.profile.name = document.getElementById('profile-name').value;
    appData.profile.age = parseInt(document.getElementById('profile-age').value);
    appData.profile.height = parseFloat(document.getElementById('profile-height').value);
    appData.profile.gender = document.getElementById('gender-male').checked ? 'male' : 'female';
    
    saveData();
    alert('Perfil salvo!');
    updateHomeScreen(); // Atualiza dashboard com novos dados de perfil
}

// ==============================================
// DADOS E BACKUP
// ==============================================

function updateHistoryList() {
    const container = document.getElementById('history-list');
    container.innerHTML = '';

    if (appData.measurements.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Nenhum registro.</p>';
        return;
    }

    appData.measurements.forEach((m, index) => {
        const date = new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR');
        const prev = appData.measurements[index + 1];
        let diffHtml = '';
        
        if (prev) {
            const diff = m.weight - prev.weight;
            const color = diff > 0 ? 'text-red-500' : 'text-emerald-500';
            const signal = diff > 0 ? '+' : '';
            diffHtml = `<span class="text-xs font-bold ${color}">${signal}${diff.toFixed(1)}</span>`;
        }

        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="size-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                    ${index + 1}
                </div>
                <div>
                    <p class="font-bold text-sm">${m.weight.toFixed(1)} kg</p>
                    <p class="text-[10px] text-gray-400 uppercase">${date}</p>
                </div>
            </div>
            <div class="text-right">
                ${diffHtml}
                ${m.waist ? `<p class="text-[10px] text-gray-500">Cintura: ${m.waist}cm</p>` : ''}
            </div>
            <button onclick="deleteMeasurement(${m.id})" class="ml-2 p-2 text-gray-300 hover:text-red-500">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        `;
        container.appendChild(div);
    });
}

function deleteMeasurement(id) {
    if(confirm('Apagar este registro?')) {
        appData.measurements = appData.measurements.filter(m => m.id !== id);
        saveData();
        updateHistoryList();
        updateHomeScreen();
    }
}

// Funções de arquivo (Export/Import) mantidas simples
function exportData() {
    const str = JSON.stringify(appData);
    const blob = new Blob([str], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_saude.json';
    a.click();
}

function importData(input) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            appData = JSON.parse(e.target.result);
            saveData();
            alert('Restaurado com sucesso!');
            location.reload();
        } catch(err) { alert('Erro no arquivo'); }
    };
    reader.readAsText(file);
}

function shareWhatsApp() {
    if(appData.measurements.length === 0) return alert('Sem dados para compartilhar');
    const m = appData.measurements[0];
    const text = `Meu progresso hoje: ${m.weight}kg. Foco na meta! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

// Persistência
function saveData() { localStorage.setItem('healthTrackerData', JSON.stringify(appData)); }
function loadData() {
    const d = localStorage.getItem('healthTrackerData');
    if (d) appData = JSON.parse(d);
}
