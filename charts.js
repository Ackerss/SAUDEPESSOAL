// charts.js - Desenho de gráficos com Canvas

// ==================== GRÁFICO DE PESO ====================

function drawWeightChart(data, labels) {
    const canvas = document.getElementById('weight-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Ajustar resolução para displays de alta densidade
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) {
        drawEmptyState(ctx, width, height, 'Sem dados');
        return;
    }
    
    // Configurações
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Encontrar min e max
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;
    
    // Adicionar margem de 10% acima e abaixo
    const margin = range * 0.2;
    const adjustedMin = minValue - margin;
    const adjustedMax = maxValue + margin;
    const adjustedRange = adjustedMax - adjustedMin;
    
    // Calcular pontos
    const points = data.map((value, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - ((value - adjustedMin) / adjustedRange) * chartHeight;
        return { x, y };
    });
    
    // Desenhar linha suave
    ctx.strokeStyle = '#ff7857';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    if (points.length === 1) {
        // Se só tem um ponto, desenhar círculo
        ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff7857';
        ctx.fill();
    } else {
        // Desenhar curva suave (Catmull-Rom)
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];
            
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        
        ctx.stroke();
        
        // Desenhar pontos
        points.forEach((point, i) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff7857';
            ctx.fill();
            
            // Destacar último ponto
            if (i === points.length - 1) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#ff7857';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }
}

// ==================== GRÁFICO DE CINTURA ====================

function drawWaistChart(data, labels) {
    const canvas = document.getElementById('waist-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Ajustar resolução para displays de alta densidade
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) {
        drawEmptyState(ctx, width, height, 'Sem medidas de cintura');
        return;
    }
    
    // Configurações
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Encontrar min e max
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;
    
    // Adicionar margem de 10% acima e abaixo
    const margin = range * 0.2;
    const adjustedMin = minValue - margin;
    const adjustedMax = maxValue + margin;
    const adjustedRange = adjustedMax - adjustedMin;
    
    // Calcular pontos
    const points = data.map((value, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - ((value - adjustedMin) / adjustedRange) * chartHeight;
        return { x, y };
    });
    
    // Desenhar linha suave
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    if (points.length === 1) {
        // Se só tem um ponto, desenhar círculo
        ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
    } else {
        // Desenhar curva suave (Catmull-Rom)
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];
            
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        
        ctx.stroke();
        
        // Desenhar pontos
        points.forEach((point, i) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#06b6d4';
            ctx.fill();
            
            // Destacar último ponto
            if (i === points.length - 1) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }
}

// ==================== ESTADO VAZIO ====================

function drawEmptyState(ctx, width, height, message) {
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px Lexend, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, width / 2, height / 2);
}

// ==================== REDIMENSIONAMENTO ====================

window.addEventListener('resize', () => {
    if (typeof loadWeightChart !== 'undefined') {
        loadWeightChart();
    }
    if (typeof loadWaistChart !== 'undefined') {
        loadWaistChart();
    }
});
