// app.js - Lógica principal da aplicação

let currentFilter = 'all';

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function () {
    // Verificar se está na página do histórico
    if (document.getElementById('entries-container')) {
        loadEntries();
        updateStreakInfo();
    }
});

// ==================== RENDERIZAÇÃO DE ENTRADAS ====================

function loadEntries() {
    const container = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');

    let entries;

    if (currentFilter === 'all') {
        entries = getEntriesSorted();
    } else {
        entries = getEntriesFiltered(currentFilter);
    }

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    entries.forEach((entry, index) => {
        const entryElement = createEntryElement(entry, index === 0);
        container.appendChild(entryElement);
    });

    // Adicionar listener para fechar outros detalhes quando um é aberto
    addDetailsListeners();
}

function createEntryElement(entry, isFirst) {
    const details = document.createElement('details');
    details.className = 'bg-white rounded-card soft-shadow border border-orange-50/50 group overflow-hidden';
    if (isFirst) details.setAttribute('open', '');

    const dateFormatted = formatDateShort(entry.date);
    const riskColor = getRiskColor(entry.risk || 'Baixo');

    details.innerHTML = `
        <summary class="cursor-pointer list-none">
            <div class="p-3 flex items-center gap-4 closed-view">
                <div class="flex flex-col items-center justify-center min-w-[65px] border-r border-orange-50 pr-3">
                    <span class="text-[11px] font-black text-text-dark-brown uppercase leading-none mb-1">${dateFormatted}</span>
                    <div class="flex items-baseline gap-0.5">
                        <span class="text-2xl font-bold text-text-main">${formatWeight(entry.weight)}</span>
                        <span class="text-[10px] font-medium text-text-main/60">kg</span>
                    </div>
                </div>
                <div class="flex-1 flex justify-between px-2">
                    <div class="flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined text-blue-400 text-lg">straighten</span>
                        <span class="text-[11px] font-bold text-text-main">${entry.waist || '-'}<span class="text-[9px] font-normal ml-0.5 text-text-main/60">${entry.waist ? 'cm' : ''}</span></span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined text-orange-400 text-lg">accessibility_new</span>
                        <span class="text-[11px] font-bold text-text-main">${entry.bodyFat ? formatBodyFat(entry.bodyFat) : '-'}<span class="text-[9px] font-normal ml-0.5 text-text-main/60">${entry.bodyFat ? '%' : ''}</span></span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined text-pink-400 text-lg">favorite</span>
                        <span class="text-[11px] font-bold text-text-main">${entry.risk || '-'}</span>
                    </div>
                </div>
                <div class="flex flex-col items-center justify-center pl-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-${riskColor} shadow-sm shadow-${riskColor}/30"></div>
                </div>
            </div>
            <div class="p-4 pb-0 flex items-center justify-between open-view">
                <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-${riskColor} shadow-sm"></div>
                    <span class="font-black text-text-dark-brown text-base uppercase">${dateFormatted}</span>
                </div>
                <div class="flex items-baseline gap-1">
                    <span class="text-xl font-bold text-text-main">${formatWeight(entry.weight)}</span>
                    <span class="text-sm font-medium text-text-main/60">kg</span>
                    <span class="material-symbols-outlined text-gray-300 text-sm ml-1 transform rotate-180">expand_more</span>
                </div>
            </div>
        </summary>
        <div class="px-6 py-6 flex justify-between items-start open-view">
            <div class="flex flex-col items-center gap-2 w-1/3">
                <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                    <span class="material-symbols-outlined text-blue-500 text-3xl">straighten</span>
                </div>
                <div class="text-center">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">CINTURA</p>
                    <p class="text-lg font-bold text-text-main">${entry.waist ? entry.waist + 'cm' : '-'}</p>
                </div>
            </div>
            <div class="flex flex-col items-center gap-2 w-1/3">
                <div class="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mb-1">
                    <span class="material-symbols-outlined text-orange-400 text-3xl">accessibility_new</span>
                </div>
                <div class="text-center">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">GORDURA</p>
                    <p class="text-lg font-bold text-text-main">${entry.bodyFat ? formatBodyFat(entry.bodyFat) + '%' : '-'}</p>
                </div>
            </div>
            <div class="flex flex-col items-center gap-2 w-1/3">
                <div class="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-1">
                    <span class="material-symbols-outlined text-pink-400 text-3xl">favorite</span>
                </div>
                <div class="text-center">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">RISCO</p>
                    <p class="text-lg font-bold text-text-main">${entry.risk || '-'}</p>
                </div>
            </div>
        </div>
        ${entry.note ? `
        <div class="px-6 pb-2 open-view">
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-600 block dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                <div class="flex gap-2 items-start">
                    <span class="material-symbols-outlined text-gray-400 text-[16px] mt-0.5">sticky_note_2</span>
                    <p class="italic">"${entry.note}"</p>
                </div>
            </div>
        </div>
        ` : ''}
        <div class="px-6 pb-6 flex justify-end gap-6 open-view">
            <button onclick="editEntry('${entry.id}')" class="flex items-center gap-1.5 text-gray-400 hover:text-gray-600">
                <span class="material-symbols-outlined text-lg">edit</span>
                <span class="text-xs font-bold">Editar</span>
            </button>
            <button onclick="confirmDeleteEntry('${entry.id}')" class="flex items-center gap-1.5 text-gray-400 hover:text-red-500">
                <span class="material-symbols-outlined text-lg">delete</span>
                <span class="text-xs font-bold">Apagar</span>
            </button>
        </div>
    `;

    return details;
}

function addDetailsListeners() {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((targetDetail) => {
        targetDetail.addEventListener("click", (e) => {
            // Só fecha outros se o clique for no summary
            if (e.target.closest('summary')) {
                detailsElements.forEach((detail) => {
                    if (detail !== targetDetail) {
                        detail.removeAttribute("open");
                    }
                });
            }
        });
    });
}

// ==================== FILTROS ====================

function filterEntries(filter) {
    currentFilter = filter;

    // Atualizar botões
    const buttons = {
        'all': document.getElementById('filter-all'),
        7: document.getElementById('filter-7'),
        30: document.getElementById('filter-30')
    };

    Object.values(buttons).forEach(btn => {
        btn.className = 'px-5 py-1.5 bg-white text-text-main/50 text-xs font-bold rounded-full whitespace-nowrap border border-orange-100';
    });

    buttons[filter].className = 'px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-full whitespace-nowrap shadow-sm';

    loadEntries();
}

// ==================== STREAK ====================

function updateStreakInfo() {
    const streakContainer = document.getElementById('streak-info');
    if (!streakContainer) return;

    const streak = getStreak();

    if (streak > 1) {
        streakContainer.innerHTML = `
            <p class="text-xs text-text-main/40 font-medium">
                🔥 Você registrou <strong>${streak} dias</strong> seguidos!
            </p>
        `;
    } else {
        const entries = getEntries();
        if (entries.length > 0) {
            streakContainer.innerHTML = `
                <p class="text-xs text-text-main/40 font-medium">
                    Você tem ${entries.length} ${entries.length === 1 ? 'registro' : 'registros'}
                </p>
            `;
        }
    }
}

// ==================== AÇÕES ====================

function editEntry(id) {
    window.location.href = `add-entry.html?edit=${id}`;
}

function confirmDeleteEntry(id) {
    Swal.fire({
        title: 'Apagar registro?',
        text: "Você não poderá reverter esta ação!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#F44336',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Sim, apagar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteEntry(id);
            loadEntries();
            updateStreakInfo();
            Swal.fire('Apagado!', 'O registro foi removido.', 'success');
        }
    });
}

function shareProgress() {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

// ==================== EXPORT/IMPORT ====================

function showImportModal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const success = importData(event.target.result);
            if (success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Importação Concluída',
                    text: 'Dados importados com sucesso!',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire('Erro', 'Arquivo de backup inválido ou corrompido.', 'error');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// ==================== VERIFICAÇÃO INICIAL ====================

function checkFirstTime() {
    const profile = getProfile();

    if (!profile || !profile.height || !profile.gender) {
        Swal.fire({
            title: 'Bem-vindo!',
            text: 'Para começar, vamos configurar seu perfil. Deseja continuar?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sim, vamos lá',
            cancelButtonText: 'Depois',
            confirmButtonColor: '#10b981'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'profile.html';
            }
        });
    }
}

// Verificar se é primeira vez ao carregar a página
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Na página de histórico, não precisamos verificar primeira vez
    // O dashboard vai fazer isso
}
