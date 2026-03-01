// storage.js - Gerenciamento de dados no localStorage

const STORAGE_KEYS = {
    PROFILE: 'weightTracker_profile',
    ENTRIES: 'weightTracker_entries',
    SETTINGS: 'weightTracker_settings'
};

// ==================== PERFIL ====================

function getProfile() {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
}

function saveProfileData(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

function deleteProfile() {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
}

// ==================== ENTRADAS ====================

function getEntries() {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
}

function addEntry(entry) {
    const entries = getEntries();
    entries.push(entry);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

function updateEntry(id, updatedEntry) {
    const entries = getEntries();
    const index = entries.findIndex(e => e.id === id);

    if (index !== -1) {
        entries[index] = { ...entries[index], ...updatedEntry };
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
        return true;
    }
    return false;
}

function deleteEntry(id) {
    const entries = getEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));
}

function getEntriesSorted(descending = true) {
    const entries = getEntries();
    return entries.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return descending ? dateB - dateA : dateA - dateB;
    });
}

function getEntriesFiltered(days = null) {
    const entries = getEntriesSorted();

    if (!days) return entries;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return entries.filter(entry => new Date(entry.date) >= cutoffDate);
}

function getLatestEntry() {
    const entries = getEntriesSorted();
    return entries.length > 0 ? entries[0] : null;
}

// ==================== ESTATÍSTICAS ====================

function getStreak() {
    const entries = getEntriesSorted();
    if (entries.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(entries[0].date);

    for (let i = 1; i < entries.length; i++) {
        const entryDate = new Date(entries[i].date);
        const dayDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            streak++;
            currentDate = entryDate;
        } else if (dayDiff > 1) {
            break;
        }
    }

    return streak;
}

function getWeightProgress() {
    const entries = getEntriesSorted(false); // Mais antigo primeiro
    if (entries.length < 2) return null;

    const first = entries[0];
    const last = entries[entries.length - 1];

    return {
        initial: first.weight,
        current: last.weight,
        change: last.weight - first.weight,
        changePercent: ((last.weight - first.weight) / first.weight * 100).toFixed(1)
    };
}

// ==================== CONFIGURAÇÕES ====================

function getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
        theme: 'light',
        notifications: false
    };
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// ==================== BACKUP E EXPORTAÇÃO ====================

function exportData() {
    const data = {
        profile: getProfile(),
        entries: getEntries(),
        settings: getSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `weight-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);

        if (data.profile) {
            saveProfileData(data.profile);
        }

        if (data.entries) {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(data.entries));
        }

        if (data.settings) {
            saveSettings(data.settings);
        }

        return true;
    } catch (error) {
        console.error('Erro ao importar dados:', error);
        return false;
    }
}

function exportCSV() {
    const entries = getEntriesSorted(false);
    if (entries.length === 0) {
        Swal.fire('Vazio', 'Não há dados para exportar.', 'info');
        return;
    }

    let csvContent = 'Data,Peso (kg),Cintura (cm),IMC,Gordura (%),Risco,Nota\n';

    entries.forEach(e => {
        const date = e.date || '';
        const weight = e.weight || '';
        const waist = e.waist || '';
        const bmi = e.bmi ? parseFloat(e.bmi).toFixed(1) : '';
        const fat = e.bodyFat ? parseFloat(e.bodyFat).toFixed(1) : '';
        const risk = e.risk || '';
        const note = (e.note || '').replace(/,/g, ' '); // remove vírgulas para não quebrar csv

        csvContent += `${date},${weight},${waist},${bmi},${fat},${risk},${note}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-peso-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
}

function showBackupMenu() {
    Swal.fire({
        title: 'Gerenciar Dados',
        text: 'O que você deseja fazer com seus dados?',
        icon: 'cog',
        showCloseButton: true,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Backup JSON',
        denyButtonText: 'Restaurar',
        cancelButtonText: 'Exportar CSV',
        confirmButtonColor: '#4CAF50',
        denyButtonColor: '#2196F3',
        cancelButtonColor: '#10b981',
    }).then((result) => {
        if (result.isConfirmed) {
            exportData();
            Swal.fire('Sucesso!', 'Seu backup JSON foi baixado.', 'success');
        } else if (result.isDenied) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = importData(event.target.result);
                    if (success) {
                        Swal.fire('Restaurado', 'Dados restaurados com sucesso!', 'success').then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire('Erro', 'Arquivo de backup inválido.', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            exportCSV();
            Swal.fire('Sucesso!', 'Planilha CSV gerada com sucesso.', 'success');
        }
    });
}

function clearAllData() {
    Swal.fire({
        title: 'Apagar tudo?',
        text: "Essa ação não pode ser desfeita!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#F44336',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sim, apagar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem(STORAGE_KEYS.PROFILE);
            localStorage.removeItem(STORAGE_KEYS.ENTRIES);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            Swal.fire('Apagado!', 'Todos os dados foram removidos.', 'success').then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

// ==================== UTILITÁRIOS ====================

function generateWhatsAppMessage() {
    const profile = getProfile();
    const latest = getLatestEntry();
    const progress = getWeightProgress();
    const streak = getStreak();

    if (!latest) {
        return 'Ainda não tenho registros no meu app de controle de peso!';
    }

    let message = `📊 *Meu Progresso de Peso*\n\n`;
    message += `⚖️ Peso atual: *${latest.weight} kg*\n`;

    if (latest.waist) {
        message += `📏 Cintura: *${latest.waist} cm*\n`;
    }

    if (progress && progress.change !== 0) {
        const emoji = progress.change < 0 ? '📉' : '📈';
        const text = progress.change < 0 ? 'Perdi' : 'Ganhei';
        message += `${emoji} ${text}: *${Math.abs(progress.change).toFixed(1)} kg* (${Math.abs(progress.changePercent)}%)\n`;
    }

    if (streak > 1) {
        message += `🔥 Sequência: *${streak} dias* seguidos!\n`;
    }

    if (profile && profile.targetWeight) {
        const remaining = latest.weight - profile.targetWeight;
        if (remaining > 0) {
            message += `🎯 Faltam: *${remaining.toFixed(1)} kg* para a meta\n`;
        } else if (remaining < 0) {
            message += `🎉 Meta atingida! *${Math.abs(remaining).toFixed(1)} kg* abaixo!\n`;
        } else {
            message += `🎯 Meta atingida!\n`;
        }
    }

    message += `\n📅 Última atualização: ${formatDate(latest.date)}`;

    return encodeURIComponent(message);
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options).replace('.', '');
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}
