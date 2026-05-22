// Modal management functions

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function populateDropdown(id, options, selectedValue = '') {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = select.multiple ? '' : '<option value="">Выберите опцию</option>';
  const selectedSet = Array.isArray(selectedValue) ? selectedValue.map(String) : null;

  if (Array.isArray(options)) {
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.id || opt;
      option.textContent = opt.name || opt;
      if (selectedSet && selectedSet.includes(String(option.value))) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  if (!select.multiple && selectedValue) {
    select.value = selectedValue;
  }
}

// Setup modal close handlers
document.addEventListener('DOMContentLoaded', () => {
  // Close button for modals
  document.querySelectorAll('[id$="Modal"] .modal-footer .btn-secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
});
