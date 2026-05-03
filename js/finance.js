// ======================== FINANCE CALCULATIONS ========================
let financeParams = {
    baseSalary: 4000,
    baseReels: 80,
    otherExpenses: 0
};

function updateFinanceParams() {
    financeParams.baseSalary = parseInt(document.getElementById('baseSalary').value) || 4000;
    financeParams.baseReels = parseInt(document.getElementById('baseReels').value) || 80;
    financeParams.otherExpenses = parseInt(document.getElementById('otherExpenses').value) || 0;

    const pricePerReel = (financeParams.baseSalary / financeParams.baseReels).toFixed(0);
    document.getElementById('pricePerReel').textContent = pricePerReel + '₽';

    renderFinanceReport();
    renderFinanceAnalytics();
}

function getProjectIncome(project) {
    const pricePerReel = financeParams.baseSalary / financeParams.baseReels;

    if (project.stage.includes('Готово') && project.stage.includes('Выплачено')) {
        return Math.round(project.planReels * pricePerReel);
    } else if (project.stage.includes('Отказ')) {
        return Math.round(project.doneReels * pricePerReel);
    }
    return 0;
}

function getTotalIncome() {
    return state.projects.reduce((sum, p) => sum + getProjectIncome(p), 0);
}

function getTotalExpenses() {
    const employeeCount = state.employees.length;
    const baseSalaryTotal = financeParams.baseSalary * employeeCount;
    return baseSalaryTotal + financeParams.otherExpenses;
}

function renderFinanceReport() {
    const tbody = document.getElementById('financeProjectsTable');
    tbody.innerHTML = '';

    const pricePerReel = (financeParams.baseSalary / financeParams.baseReels).toFixed(0);

    let totalIncomeCompleted = 0;
    let totalIncomeCancelled = 0;

    state.projects.forEach(p => {
        const income = getProjectIncome(p);
        if (p.stage.includes('Готово') && p.stage.includes('Выплачено')) {
            totalIncomeCompleted += income;
        } else if (p.stage.includes('Отказ')) {
            totalIncomeCancelled += income;
        }

        if (income > 0) {
            const reelsForCalc = p.stage.includes('Отказ') ? p.doneReels : p.planReels;
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.stage}</td>
                    <td>${p.planReels}</td>
                    <td>${p.doneReels}</td>
                    <td>${pricePerReel}₽</td>
                    <td style="color: var(--success); font-weight: 600;">${income.toLocaleString('ru-RU')}₽</td>
                </tr>
            `;
        }
    });

    document.getElementById('incomeCompleted').textContent = totalIncomeCompleted.toLocaleString('ru-RU') + '₽';
    document.getElementById('incomeCancelled').textContent = totalIncomeCancelled.toLocaleString('ru-RU') + '₽';
    document.getElementById('totalIncome').textContent = (totalIncomeCompleted + totalIncomeCancelled).toLocaleString('ru-RU') + '₽';
}

function renderFinanceAnalytics() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const profit = totalIncome - totalExpenses;

    document.getElementById('totalIncomeAll').textContent = totalIncome.toLocaleString('ru-RU') + '₽';
    document.getElementById('totalExpenses').textContent = totalExpenses.toLocaleString('ru-RU') + '₽';
    document.getElementById('totalProfit').textContent = (profit >= 0 ? '+' : '') + profit.toLocaleString('ru-RU') + '₽';

    const profitElement = document.getElementById('totalProfit');
    profitElement.style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';

    renderFinanceCharts(totalIncome, totalExpenses, profit);
}

function renderFinanceCharts(income, expenses, profit) {
    const chartIncomeCtx = document.getElementById('chartIncome');
    const chartMarginCtx = document.getElementById('chartProfitMargin');

    if (window.financeChartIncome) window.financeChartIncome.destroy();
    if (window.financeChartMargin) window.financeChartMargin.destroy();

    window.financeChartIncome = new Chart(chartIncomeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Доход', 'Расходы'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['var(--success)', 'var(--danger)'],
                borderColor: 'var(--white)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    window.financeChartMargin = new Chart(chartMarginCtx, {
        type: 'bar',
        data: {
            labels: ['Доход', 'Расходы', 'Прибыль'],
            datasets: [{
                label: 'Сумма (₽)',
                data: [income, expenses, profit],
                backgroundColor: [
                    'var(--success)',
                    'var(--danger)',
                    profit >= 0 ? 'var(--primary)' : 'var(--warning)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function setupFinanceTabs() {
    document.getElementById('financeSettingsTab').onclick = () => {
        document.getElementById('financeSettings').style.display = 'block';
        document.getElementById('financeReport').style.display = 'none';
        document.getElementById('financeAnalytics').style.display = 'none';

        document.getElementById('financeSettingsTab').style.background = 'var(--primary)';
        document.getElementById('financeSettingsTab').style.color = 'white';
        document.getElementById('financeReportTab').style.background = 'var(--light-gray)';
        document.getElementById('financeReportTab').style.color = 'var(--dark)';
        document.getElementById('financeAnalyticsTab').style.background = 'var(--light-gray)';
        document.getElementById('financeAnalyticsTab').style.color = 'var(--dark)';
    };

    document.getElementById('financeReportTab').onclick = () => {
        document.getElementById('financeSettings').style.display = 'none';
        document.getElementById('financeReport').style.display = 'block';
        document.getElementById('financeAnalytics').style.display = 'none';

        document.getElementById('financeSettingsTab').style.background = 'var(--light-gray)';
        document.getElementById('financeSettingsTab').style.color = 'var(--dark)';
        document.getElementById('financeReportTab').style.background = 'var(--primary)';
        document.getElementById('financeReportTab').style.color = 'white';
        document.getElementById('financeAnalyticsTab').style.background = 'var(--light-gray)';
        document.getElementById('financeAnalyticsTab').style.color = 'var(--dark)';

        renderFinanceReport();
    };

    document.getElementById('financeAnalyticsTab').onclick = () => {
        document.getElementById('financeSettings').style.display = 'none';
        document.getElementById('financeReport').style.display = 'none';
        document.getElementById('financeAnalytics').style.display = 'block';

        document.getElementById('financeSettingsTab').style.background = 'var(--light-gray)';
        document.getElementById('financeSettingsTab').style.color = 'var(--dark)';
        document.getElementById('financeReportTab').style.background = 'var(--light-gray)';
        document.getElementById('financeReportTab').style.color = 'var(--dark)';
        document.getElementById('financeAnalyticsTab').style.background = 'var(--primary)';
        document.getElementById('financeAnalyticsTab').style.color = 'white';

        renderFinanceAnalytics();
    };
}
