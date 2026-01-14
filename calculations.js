// calculations.js - Cálculos de saúde e métricas

// ==================== IMC (Índice de Massa Corporal) ====================

function calculateBMI(weight, heightCm) {
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade I';
    if (bmi < 40) return 'Obesidade II';
    return 'Obesidade III';
}

// ==================== PERCENTUAL DE GORDURA CORPORAL ====================

function calculateBodyFat(weight, heightCm, waist, gender) {
    if (!waist || waist <= 0) return null;
    
    // Fórmula Navy Method (mais precisa com cintura)
    const heightInch = heightCm / 2.54;
    const waistInch = waist / 2.54;
    
    let bodyFat;
    
    if (gender === 'male') {
        // Homens
        bodyFat = 86.010 * Math.log10(waistInch) - 70.041 * Math.log10(heightInch) + 36.76;
    } else {
        // Mulheres (simplificado - idealmente precisaria de mais medidas)
        bodyFat = 163.205 * Math.log10(waistInch) - 97.684 * Math.log10(heightInch) - 78.387;
    }
    
    return Math.max(0, Math.min(100, bodyFat));
}

function getBodyFatCategory(bodyFat, gender) {
    if (!bodyFat) return null;
    
    if (gender === 'male') {
        if (bodyFat < 6) return 'Essencial';
        if (bodyFat < 14) return 'Atleta';
        if (bodyFat < 18) return 'Fitness';
        if (bodyFat < 25) return 'Aceitável';
        return 'Obesidade';
    } else {
        if (bodyFat < 14) return 'Essencial';
        if (bodyFat < 21) return 'Atleta';
        if (bodyFat < 25) return 'Fitness';
        if (bodyFat < 32) return 'Aceitável';
        return 'Obesidade';
    }
}

// ==================== RISCO CARDIOVASCULAR ====================

function calculateCardiovascularRisk(waist, gender, bmi) {
    if (!waist || waist <= 0) return 'Desconhecido';
    
    // Baseado na circunferência da cintura
    let riskLevel = 'Baixo';
    
    if (gender === 'male') {
        if (waist >= 102) riskLevel = 'Alto';
        else if (waist >= 94) riskLevel = 'Médio';
    } else {
        if (waist >= 88) riskLevel = 'Alto';
        else if (waist >= 80) riskLevel = 'Médio';
    }
    
    // Ajuste baseado no IMC
    if (bmi >= 30 && riskLevel === 'Médio') {
        riskLevel = 'Alto';
    }
    
    return riskLevel;
}

function getRiskColor(risk) {
    switch (risk) {
        case 'Baixo':
            return 'status-ok';
        case 'Médio':
            return 'status-warn';
        case 'Alto':
            return 'status-danger';
        default:
            return 'gray-400';
    }
}

// ==================== PESO IDEAL ====================

function calculateIdealWeightRange(heightCm) {
    const heightM = heightCm / 100;
    const minWeight = 18.5 * heightM * heightM;
    const maxWeight = 24.9 * heightM * heightM;
    
    return {
        min: minWeight,
        max: maxWeight
    };
}

// ==================== CALORIAS E METABOLISMO ====================

function calculateBMR(weight, heightCm, age, gender) {
    // Fórmula de Harris-Benedict revisada
    if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * heightCm) - (5.677 * age);
    } else {
        return 447.593 + (9.247 * weight) + (3.098 * heightCm) - (4.330 * age);
    }
}

function calculateTDEE(bmr, activityLevel = 1.2) {
    // Activity levels:
    // 1.2 = sedentário
    // 1.375 = levemente ativo
    // 1.55 = moderadamente ativo
    // 1.725 = muito ativo
    // 1.9 = extremamente ativo
    return bmr * activityLevel;
}

// ==================== FUNÇÃO PRINCIPAL DE CÁLCULO ====================

function calculateHealthMetrics(weight, waist, heightCm, gender, age = null) {
    const bmi = calculateBMI(weight, heightCm);
    const bodyFat = calculateBodyFat(weight, heightCm, waist, gender);
    const risk = calculateCardiovascularRisk(waist, gender, bmi);
    
    const metrics = {
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory: getBMICategory(bmi),
        bodyFat: bodyFat ? parseFloat(bodyFat.toFixed(1)) : null,
        bodyFatCategory: bodyFat ? getBodyFatCategory(bodyFat, gender) : null,
        risk: risk,
        riskColor: getRiskColor(risk)
    };
    
    if (age) {
        metrics.bmr = Math.round(calculateBMR(weight, heightCm, age, gender));
        metrics.tdee = Math.round(calculateTDEE(metrics.bmr));
    }
    
    return metrics;
}

// ==================== PROGRESSÃO E TENDÊNCIAS ====================

function calculateWeightTrend(entries, days = 7) {
    if (entries.length < 2) return null;
    
    const recentEntries = entries
        .filter(e => {
            const entryDate = new Date(e.date);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return entryDate >= cutoffDate;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (recentEntries.length < 2) return null;
    
    const weights = recentEntries.map(e => e.weight);
    const n = weights.length;
    
    // Cálculo de regressão linear simples
    const xMean = (n - 1) / 2;
    const yMean = weights.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (weights[i] - yMean);
        denominator += (i - xMean) * (i - xMean);
    }
    
    const slope = numerator / denominator;
    
    return {
        trend: slope,
        direction: slope < -0.1 ? 'descending' : (slope > 0.1 ? 'ascending' : 'stable'),
        averageChange: slope,
        projectedWeekly: slope * 7
    };
}

function estimateDaysToGoal(currentWeight, targetWeight, trend) {
    if (!trend || Math.abs(trend.averageChange) < 0.01) return null;
    
    const difference = currentWeight - targetWeight;
    
    // Se a tendência está indo na direção errada, retornar null
    if ((difference > 0 && trend.averageChange > 0) || (difference < 0 && trend.averageChange < 0)) {
        return null;
    }
    
    const daysToGoal = Math.abs(difference / trend.averageChange);
    
    return Math.round(daysToGoal);
}

// ==================== FORMATAÇÃO ====================

function formatWeight(weight) {
    return weight.toFixed(1).replace('.', ',');
}

function formatBodyFat(bodyFat) {
    return bodyFat ? bodyFat.toFixed(1).replace('.', ',') : '-';
}

function formatBMI(bmi) {
    return bmi.toFixed(1).replace('.', ',');
}
