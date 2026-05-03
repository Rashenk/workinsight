    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    function previewScreenshot(input) {
        const preview = document.getElementById('screenshotPreview');
        preview.innerHTML = '';

        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                img.style.borderRadius = '6px';
                img.style.border = '1px solid var(--border)';
                preview.appendChild(img);

                // Store in state
                state.currentScreenshot = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function viewScreenshot(reportId) {
        const report = state.reports.find(r => r.id == reportId);
        if (!report || !report.screenshot) {
            alert('Скриншот не найден');
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80vw; max-height: 80vh; overflow: auto;">
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: var(--danger); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕ Закрыть</button>
                <img src="${report.screenshot}" style="max-width: 100%; max-height: 100%; border-radius: 4px; margin-top: 10px;">
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    function copyPrompt(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✓ Промпт скопирован в буфер обмена');
        }).catch(() => {
            alert('Ошибка при копировании');
        });
    }

    function togglePassword(idx) {
        const pwd = document.getElementById('pwd' + idx);
        if (pwd.textContent === '••••••') {
            pwd.textContent = state.access[idx].password;
        } else {
            pwd.textContent = '••••••';
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ======================== FILTER/SEARCH FUNCTION ========================
    function filterTable(input, tableId) {
        const query = (input.value || '').toLowerCase().trim();
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = Array.from(table.getElementsByTagName('tr'));
        let visibleCount = 0;

        rows.forEach(row => {
            // Skip empty rows
            if (row.classList.contains('empty-row')) {
                row.remove();
                return;
            }

            if (query === '') {
                row.style.display = '';
                visibleCount++;
            } else {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            }
        });

        // Show empty state if needed
        if (visibleCount === 0 && query !== '') {
            const emptyRow = document.createElement('tr');
            emptyRow.classList.add('empty-row');
            const colCount = table.querySelector('tr')?.children.length || 10;
            emptyRow.innerHTML = `<td colspan="${colCount}" style="text-align: center; padding: 30px; color: var(--gray);">Ничего не найдено</td>`;
            table.appendChild(emptyRow);
        }
    }

    // ======================== EXPORT CSV FUNCTION ========================
    function exportCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) return;

        let csv = [];
        const rows = table.querySelectorAll('tr');

        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const csvRow = [];
            cols.forEach(col => {
                csvRow.push('"' + col.innerText.replace(/"/g, '""') + '"');
            });
            csv.push(csvRow.join(','));
        });

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initialize
    window.addEventListener('DOMContentLoaded', initializeApp);

    // Set today's date for report and populate projects
    window.addEventListener('load', () => {
        const today = new Date().toISOString().split('T')[0];
        const reportDateInput = document.getElementById('reportDate');
        if (reportDateInput && !reportDateInput.value) {
            reportDateInput.value = today;
        }

        // Populate report projects
        const reportProjectSelect = document.getElementById('reportProject');
        if (reportProjectSelect) {
            const activeProjects = state.projects.filter(p => p.stage === 'В работе');
            activeProjects.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                option.textContent = p.name;
                reportProjectSelect.appendChild(option);
            });
        }
    });
</script>
