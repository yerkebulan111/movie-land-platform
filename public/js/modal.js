
function showModal(title, message, buttons = [{ text: 'OK', action: null }]) {
    
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    
    const buttonsHTML = buttons.map(btn => 
        `<button class="btn ${btn.class || 'btn-primary'}" onclick="handleModalButton(${btn.action ? `'${btn.action}'` : 'null'}, ${btn.callback ? btn.callback : 'null'})">${btn.text}</button>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-buttons">
                ${buttonsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    
    modal.buttonCallbacks = {};
    buttons.forEach((btn, index) => {
        if (btn.callback) {
            modal.buttonCallbacks[`callback_${index}`] = btn.callback;
        }
    });
    
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function handleModalButton(action, callbackKey) {
    const modal = document.querySelector('.modal');
    
    if (action && modal.buttonCallbacks && modal.buttonCallbacks[action]) {
        modal.buttonCallbacks[action]();
    }
    
    closeModal();
}


function showSuccess(message, redirectUrl = null) {
    showModal('Success!', message, [
        { 
            text: 'OK', 
            class: 'btn-primary',
            callback: redirectUrl ? () => window.location.href = redirectUrl : null
        }
    ]);
}


function showError(message) {
    showModal('Error', message, [
        { text: 'Close', class: 'btn-secondary' }
    ]);
}


function showConfirm(message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    const modal = showModal('Confirm', message, [
        { text: cancelText, class: 'btn-secondary' },
        { text: confirmText, class: 'btn-danger' }
    ]);
    
    
    modal.buttonCallbacks['confirm'] = onConfirm;
    
    
    const buttons = modal.querySelectorAll('.modal-buttons button');
    if (buttons[1]) {
        buttons[1].onclick = () => {
            onConfirm();
            closeModal();
        };
    }
    if (buttons[0]) {
        buttons[0].onclick = closeModal;
    }
}


document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});