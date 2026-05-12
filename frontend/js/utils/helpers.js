// Utility functions

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;

  const bgColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';

  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 14px;
    font-weight: 500;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function filterTable(input, tableId) {
  const filter = input.value.toLowerCase();
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

function exportCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  let csv = [];
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    const rowData = Array.from(cells).map(cell => {
      let text = cell.textContent.trim();
      text = text.replace(/"/g, '""');
      return `"${text}"`;
    });
    csv.push(rowData.join(','));
  });

  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function togglePassword(idx) {
  const input = document.getElementById('accessPassword' + idx);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

function previewScreenshot(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('screenshotPreview');
      preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; border-radius: 6px;">`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function copyPrompt(text) {
  if (text && text.startsWith('#')) {
    const el = document.getElementById(text.slice(1));
    if (el) text = el.innerText;
  }
  navigator.clipboard.writeText(text);
  showToast('Скопировано в буфер обмена', 'success');
}

function getScreenshotAsBase64(fileInput) {
  return new Promise((resolve) => {
    if (!fileInput.files || !fileInput.files[0]) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(fileInput.files[0]);
  });
}
