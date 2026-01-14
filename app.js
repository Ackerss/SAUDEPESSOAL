// ==============================================
// HEALTH TRACKER - APP JAVASCRIPT
// ==============================================

// Estrutura de dados da aplicação
let appData = {
    profile: {
        name: '',
        age: null,
        height: null,
        gender: 'female',
        currentWeight: null,
        currentWaist: null,
        targetWeight: null
    },
    measurements: []
};

// ==============================================
// INICIALIZAÇÃO
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setTodayDate();
    updateThemeIcon();
    
    // Aplicar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Erro no Service Worker:', err));
    }
});

// ==============================================
// NAVEGAÇÃO
// ==============================================

function startApp() {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    showScreen('home-screen');
}

function showScreen(screenId) {
    // Esconder todas as telas
    const screens = ['home-screen', 'profile-screen', 'data-screen'];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('hidden');
    });
    
    // Mostrar tela selecionada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('fade-in');
    }
    
    // Atualizar navegação ativa
    updateNavigation(screenId);
    
    // Atualizar dados específicos da tela
    if (screenId === 'profile-screen') {
        loadProfileData();
    } else if (screenId === 'home-screen') {
        updateHomeScreen();
    }
}

function updateNavigation(screenId) {
    // Remover classe ativa de todos
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('nav-item-active');
        const icon = btn.querySelector('.material-symbols-outlined');
        const text = btn.querySelector('span:last-child');
        if (icon) {
            icon.classList.remove('text-primary');
            icon.classList.add('text-gray-400');
        }
        if (text) {
            text.classList.remove('text-primary');
            text.classList.add('text-gray-400');
        }
    });
    
    // Adicionar classe ativa ao correto
    let navId = '';
    if (screenId === 'home-screen') navId = 'nav-home';
    else if (screenId === 'data-screen') navId = 'nav-data';
    else if (screenId === 'profile-screen') navId = 'nav-profile';
    
    if (navId) {
        const activeNav = document.getElementById(navId);
        if (activeNav) {
            activeNav.classList.add('nav-item-active');
            const icon = activeNav.querySelector('.material-symbols-outlined');
            const text = activeNav.querySelector('span:last-child');
            if (icon) {
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-primary');
            }
            if (text) {
                text.classList.remove('text-gray-400');
                text.classList.add('text-primary');
            }
        }
    }
}

// ==============================================
// TEMA ESCURO
// ==============================================

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const icons = ['theme-icon', 'theme-icon-profile'];
    icons.forEach(id => {
        const icon = document.getElementById(id);
        if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
}

// ==============================================
// MODAL ADICIONAR MEDIDA
// ==============================================

function openAddModal() {
    document.getElementById('add-modal').classList.remove('hidden');
    setTodayDate();
    // Limpar campos
    document.getElementById('modal-weight').value = '';
    document.getElementById('modal-waist').value = '';
    // Focar no campo de peso
    setTimeout(() => {
        document.getElementById('modal-weight').focus();
    }, 100);
}

function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('modal-date');
    if (dateInput) dateInput.value = today;
}

function repeatLastWaist() {
    if (appData.measurements.length > 0) {
        const lastMeasurement = appData.measurements[appData.measurements.length - 1];
        if (lastMeasurement.waist) {
            document.getElementById('modal-waist').value = lastMeasurement.waist;
        }
    }
}

function saveMeasurement() {
    const weight = parseFloat(document.getElementById('modal-weight').value);
    const waist = parseFloat(document.getElementById('modal-waist').value) || null;
    const date = document.getElementById('modal-date').value;
    
    if (!weight || !date) {
        alert('Por favor, preencha pelo menos o peso e a data.');
        return;
    }
    
    // Criar nova medida
    const measurement = {
        id: Date.now(),
        weight: weight,
        waist: waist,
        date: date,
        timestamp: new Date(date).getTime()
    };
    
    // Adicionar à lista
    appData.measurements.push(measurement);
    
    // Ordenar por data (mais recente primeiro)
    appData.measurements.sort((a, b) => b.timestamp - a.timestamp);
    
    // Atualizar peso e cintura atuais no perfil
    appData.profile.currentWeight = weight;
    if (waist) appData.profile.currentWaist = waist;
    
    // Salvar dados
    saveData();
    
    // Fechar modal e atualizar tela
    closeAddModal();
    updateHomeScreen();
}

// ==============================================
// TELA INICIAL / DASHBOARD
// ==============================================

function updateHomeScreen() {
    // Atualizar header
    const headerName = document.getElementById('header-name');
    const headerDate = document.getElementById('header-date');
    
    if (headerName) {
        headerName.textContent = appData.profile.name || 'Usuário';
    }
    
    if (headerDate) {
        const today = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        headerDate.textContent = today.toLocaleDateString('pt-BR', options);
    }
    
    // Verificar se há medidas
    if (appData.measurements.length === 0) {
        document.getElementById('last-measurement-section').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }
    
    document.getElementById('last-measurement-section').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    
    // Última medida
    const lastMeasurement = appData.measurements[0];
    
    // Data da última medida
    const measurementDate = new Date(lastMeasurement.date);
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    document.getElementById('last-measurement-date').textContent = 
        measurementDate.toLocaleDateString('pt-BR', dateOptions);
    
    // Peso
    document.getElementById('last-weight').textContent = lastMeasurement.weight.toFixed(1) + ' kg';
    
    // Cintura
    const waistElement = document.getElementById('last-waist');
    if (lastMeasurement.waist) {
        waistElement.textContent = lastMeasurement.waist + ' cm';
    } else {
        waistElement.textContent = '—';
    }
    
    // Calcular e mostrar indicadores
    updateIndicators(lastMeasurement);
}

function updateIndicators(measurement) {
    const container = document.getElementById('indicators-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const profile = appData.profile;
    
    // Verificar se temos dados suficientes
    if (!profile.height || !profile.age) {
        container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Complete seu perfil para ver os indicadores científicos</p>';
        return;
    }
    
    // Calcular IMC
    const heightM = profile.height / 100;
    const bmi = measurement.weight / (heightM * heightM);
    const bmiStatus = getBMIStatus(bmi);
    
    container.innerHTML += createIndicatorCard('IMC', bmi.toFixed(1), bmiStatus, 'favorite');
    
    // Calcular RFM (Relative Fat Mass) - se temos cintura
    if (measurement.waist && profile.gender) {
        const rfm = calculateRFM(profile.height, measurement.waist, profile.gender);
        const rfmStatus = getRFMStatus(rfm, profile.gender);
        container.innerHTML += createIndicatorCard('RFM (% Gordura)', rfm.toFixed(1) + '%', rfmStatus, 'monitor_weight', 'Cedars-Sinai');
    }
    
    // Calcular RCE (Relação Cintura-Estatura)
    if (measurement.waist) {
        const whr = measurement.waist / profile.height;
        const whrStatus = getWHRStatus(whr);
        container.innerHTML += createIndicatorCard('RCE (Cintura/Est.)', whr.toFixed(2), whrStatus, 'straighten', 'Meta: < 0.50');
    }
    
    // Saúde Cardiovascular
    if (measurement.waist) {
        const cvRisk = getCardiovascularRisk(measurement.waist, profile.gender);
        container.innerHTML += createIndicatorCard('Saúde Cardiovascular', cvRisk.text, cvRisk.status, 'favorite', cvRisk.description);
    }
    
    // Mostrar evolução se houver mais de uma medida
    if (appData.measurements.length > 1) {
        showProgress();
    }
}

function createIndicatorCard(label, value, status, icon, subtitle = null) {
    const statusColors = {
        'Excelente': 'text-green-600 dark:text-green-400',
        'Ótimo': 'text-green-600 dark:text-green-400',
        'Normal': 'text-green-600 dark:text-green-400',
        'Peso Saudável': 'text-green-600 dark:text-green-400',
        'Baixo Risco': 'text-green-600 dark:text-green-400',
        'Sobrepeso': 'text-yellow-600 dark:text-yellow-400',
        'Atenção': 'text-yellow-600 dark:text-yellow-400',
        'Risco Aumentado': 'text-orange-600 dark:text-orange-400',
        'Alto Risco': 'text-red-600 dark:text-red-400',
        'Obesidade': 'text-red-600 dark:text-red-400'
    };
    
    const statusColor = statusColors[status] || 'text-gray-600 dark:text-gray-400';
    
    return `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">${icon}</span>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${label}</p>
                    ${subtitle ? `<p class="text-[10px] text-gray-400 dark:text-gray-500">${subtitle}</p>` : ''}
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold text-lg">${value}</p>
                <p class="text-xs ${statusColor} font-medium">${status}</p>
            </div>
        </div>
    `;
}

function showProgress() {
    const container = document.getElementById('indicators-container');
    const first = appData.measurements[appData.measurements.length - 1];
    const last = appData.measurements[0];
    
    const weightChange = last.weight - first.weight;
    const waistChange = (last.waist && first.waist) ? last.waist - first.waist : null;
    
    let progressHTML = '<div class="pt-4 border-t border-gray-100 dark:border-gray-800">';
    progressHTML += '<p class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">📉 Sua Evolução</p>';
    
    const weightColor = weightChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400';
    progressHTML += `<p class="text-sm">• Peso: <span class="font-bold ${weightColor}">${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg</span></p>`;
    
    if (waistChange !== null) {
        const waistColor = waistChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400';
        progressHTML += `<p class="text-sm">• Cintura: <span class="font-bold ${waistColor}">${waistChange > 0 ? '+' : ''}${waistChange.toFixed(1)} cm</span></p>`;
    }
    
    progressHTML += '</div>';
    container.innerHTML += progressHTML;
}

// ==============================================
// CÁLCULOS CIENTÍFICOS
// ==============================================

function calculateRFM(height, waist, gender) {
    // RFM (Relative Fat Mass) - Cedars-Sinai Medical Center
    const heightM = height / 100;
    if (gender === 'male') {
        return 64 - (20 * heightM / waist) + (12 * 1); // 1 para homens
    } else {
        return 76 - (20 * heightM / waist); // Mulheres
    }
}

function getBMIStatus(bmi) {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso Saudável';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidade';
}

function getRFMStatus(rfm, gender) {
    // Faixas de gordura corporal saudável
    if (gender === 'male') {
        if (rfm < 15) return 'Muito Baixo';
        if (rfm < 20) return 'Ótimo';
        if (rfm < 25) return 'Normal';
        if (rfm < 30) return 'Elevado';
        return 'Alto';
    } else {
        if (rfm < 25) return 'Muito Baixo';
        if (rfm < 30) return 'Ótimo';
        if (rfm < 35) return 'Normal';
        if (rfm < 40) return 'Elevado';
        return 'Alto';
    }
}

function getWHRStatus(whr) {
    if (whr < 0.5) return 'Excelente';
    if (whr < 0.53) return 'Normal';
    if (whr < 0.58) return 'Atenção';
    return 'Alto Risco';
}

function getCardiovascularRisk(waist, gender) {
    // Baseado em diretrizes internacionais
    if (gender === 'male') {
        if (waist < 94) return { text: 'Baixo Risco', status: 'Normal', description: 'Cintura saudável' };
        if (waist < 102) return { text: 'Risco Aumentado', status: 'Atenção', description: 'Atenção recomendada' };
        return { text: 'Alto Risco', status: 'Alto Risco', description: 'Consulte um médico' };
    } else {
        if (waist < 80) return { text: 'Baixo Risco', status: 'Normal', description: 'Cintura saudável' };
        if (waist < 88) return { text: 'Risco Aumentado', status: 'Atenção', description: 'Atenção recomendada' };
        return { text: 'Alto Risco', status: 'Alto Risco', description: 'Consulte um médico' };
    }
}

// ==============================================
// PERFIL
// ==============================================

function loadProfileData() {
    const profile = appData.profile;
    
    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-age').value = profile.age || '';
    document.getElementById('profile-height').value = profile.height || '';
    document.getElementById('profile-weight').value = profile.currentWeight || '';
    document.getElementById('profile-waist').value = profile.currentWaist || '';
    document.getElementById('profile-target').value = profile.targetWeight || '';
    
    // Sexo
    if (profile.gender === 'male') {
        document.getElementById('gender-male').checked = true;
    } else {
        document.getElementById('gender-female').checked = true;
    }
    
    // Calcular peso ideal se temos altura
    if (profile.height) {
        calculateIdealWeight();
    }
}

function calculateIdealWeight() {
    const height = parseFloat(document.getElementById('profile-height').value);
    if (!height) return;
    
    const heightM = height / 100;
    const minWeight = (18.5 * heightM * heightM).toFixed(0);
    const maxWeight = (24.9 * heightM * heightM).toFixed(0);
    
    const card = document.getElementById('ideal-weight-card');
    const range = document.getElementById('ideal-weight-range');
    
    if (card && range) {
        card.classList.remove('hidden');
        range.textContent = `${minWeight} - ${maxWeight} kg`;
    }
}

// Atualizar peso ideal quando altura mudar
document.addEventListener('DOMContentLoaded', function() {
    const heightInput = document.getElementById('profile-height');
    if (heightInput) {
        heightInput.addEventListener('input', calculateIdealWeight);
    }
});

function saveProfile() {
    const profile = appData.profile;
    
    profile.name = document.getElementById('profile-name').value;
    profile.age = parseInt(document.getElementById('profile-age').value) || null;
    profile.height = parseFloat(document.getElementById('profile-height').value) || null;
    profile.currentWeight = parseFloat(document.getElementById('profile-weight').value) || null;
    profile.currentWaist = parseFloat(document.getElementById('profile-waist').value) || null;
    profile.targetWeight = parseFloat(document.getElementById('profile-target').value) || null;
    
    // Sexo
    profile.gender = document.getElementById('gender-male').checked ? 'male' : 'female';
    
    saveData();
    
    // Mostrar confirmação
    alert('Perfil salvo com sucesso!');
    
    // Voltar para home
    showScreen('home-screen');
}

// ==============================================
// BACKUP E EXPORTAÇÃO
// ==============================================

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function shareWhatsApp() {
    const lastMeasurement = appData.measurements[0];
    if (!lastMeasurement) {
        alert('Nenhuma medida para compartilhar');
        return;
    }
    
    const profile = appData.profile;
    const date = new Date(lastMeasurement.date).toLocaleDateString('pt-BR');
    
    let message = `*Relatório de Saúde: ${profile.name || 'Usuário'}*\n\n`;
    message += `📅 *Data:* ${date}\n`;
    message += `⚖️ *Peso:* ${lastMeasurement.weight.toFixed(1)} kg\n`;
    if (lastMeasurement.waist) {
        message += `📏 *Cintura:* ${lastMeasurement.waist} cm\n`;
    }
    if (profile.age) {
        message += `🎂 *Idade:* ${profile.age} anos\n`;
    }
    
    message += `\n📊 *Indicadores Científicos:*\n`;
    
    // IMC
    if (profile.height) {
        const heightM = profile.height / 100;
        const bmi = lastMeasurement.weight / (heightM * heightM);
        const bmiStatus = getBMIStatus(bmi);
        message += `• *IMC:* ${bmi.toFixed(1)} (${bmiStatus})\n`;
        
        // RFM
        if (lastMeasurement.waist) {
            const rfm = calculateRFM(profile.height, lastMeasurement.waist, profile.gender);
            message += `• *RFM (% Gordura):* ${rfm.toFixed(1)}% _(Cedars-Sinai)_\n`;
            
            // RCE
            const whr = lastMeasurement.waist / profile.height;
            message += `• *RCE (Cintura/Est.):* ${whr.toFixed(2)} (Meta: < 0.50)\n`;
            
            // Cardiovascular
            const cvRisk = getCardiovascularRisk(lastMeasurement.waist, profile.gender);
            message += `❤️ *Saúde Cardiovascular:* ${cvRisk.text}\n`;
        }
    }
    
    // Evolução
    if (appData.measurements.length > 1) {
        const first = appData.measurements[appData.measurements.length - 1];
        const weightChange = lastMeasurement.weight - first.weight;
        message += `\n📉 *Sua Evolução:*\n`;
        message += `• Peso: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg\n`;
        
        if (lastMeasurement.waist && first.waist) {
            const waistChange = lastMeasurement.waist - first.waist;
            message += `• Cintura: ${waistChange > 0 ? '+' : ''}${waistChange.toFixed(1)} cm\n`;
        }
    }
    
    message += `\n_Gerado pelo meu App de Saúde Metabólica_`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('file-name').textContent = file.name;
    }
}

function importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecione um arquivo para importar');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estrutura básica
            if (!importedData.profile || !importedData.measurements) {
                throw new Error('Formato de arquivo inválido');
            }
            
            // Confirmar importação
            if (confirm('Isso irá substituir todos os seus dados atuais. Deseja continuar?')) {
                appData = importedData;
                saveData();
                alert('Dados importados com sucesso!');
                showScreen('home-screen');
            }
        } catch (error) {
            alert('Erro ao importar arquivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ==============================================
// PERSISTÊNCIA DE DADOS
// ==============================================

function saveData() {
    localStorage.setItem('healthTrackerData', JSON.stringify(appData));
}

function loadData() {
    const savedData = localStorage.getItem('healthTrackerData');
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
    }
}
