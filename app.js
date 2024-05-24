document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('send-image-button').addEventListener('click', function() {
        document.getElementById('image-input').click();
    });

    document.getElementById('image-input').addEventListener('change', previewImage);

    document.querySelectorAll('.emoticon').forEach(emoticon => {
        emoticon.addEventListener('click', function() {
            document.getElementById('message-input').value += emoticon.textContent;
        });
    });

    window.addEventListener('storage', function(event) {
        if (event.key === 'messages') {
            loadMessages();
        }
    });

    loadMessages();
});

let imageFile = null;

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const imagePreview = document.getElementById('image-preview');

    if (message || imageFile) {
        const messageId = Date.now();  
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                addMessageToChat('Vous', `${message}<br><img src="${imageUrl}" alt="Image" class="chat-image">`, messageId, true);
                saveMessage('Vous', { text: message, image: imageUrl }, messageId, 'image');
                imageFile = null;  
                imagePreview.style.display = 'none';
                imagePreview.innerHTML = '';  
            };
            reader.readAsDataURL(imageFile);
        } else {
            addMessageToChat('Vous', message, messageId, false);
            saveMessage('Vous', message, messageId);
        }
        messageInput.value = '';
        sendNotification('Nouveau message', message || 'Vous avez envoyé une image', messageId);
    }
}

function previewImage(event) {
    imageFile = event.target.files[0];
    const messageInput = document.getElementById('message-input');
    const imagePreview = document.getElementById('image-preview');
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.style.display = 'block';
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Aperçu de l'image" style="max-width: 50px; max-height: 50px; vertical-align: middle;">`;
            messageInput.style.paddingLeft = '60px';  
        };
        reader.readAsDataURL(imageFile);
    } else {
        imagePreview.style.display = 'none';
        imagePreview.innerHTML = '';
        messageInput.style.paddingLeft = '10px';  
    }
}

function addMessageToChat(user, message, messageId, isImage) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.dataset.messageId = messageId;  
    messageElement.innerHTML = `${user}: ${message} 
        <button class="delete-button" onclick="deleteMessage(${messageId})">
            <img src="icons/delete-icon.png" alt="Supprimer">
        </button>`;
    
    if (isImage) {
        messageElement.innerHTML += `<button class="download-button" onclick="downloadImage(${messageId})">
            <img src="icons/download-icon.png" alt="Télécharger">
        </button>`;
    }
    
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function deleteMessage(messageId) {
    let messages = JSON.parse(localStorage.getItem('messages')) || [];
    messages = messages.filter(message => message.id !== messageId);
    localStorage.setItem('messages', JSON.stringify(messages));
    loadMessages();
}

function saveMessage(user, message, messageId, type = 'text') {
    let messages = JSON.parse(localStorage.getItem('messages')) || [];
    messages.push({ user, message, id: messageId, type });
    localStorage.setItem('messages', JSON.stringify(messages));
}

function loadMessages() {
    let messages = JSON.parse(localStorage.getItem('messages')) || [];
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';  
    messages.forEach(message => {
        if (message.type === 'text') {
            addMessageToChat(message.user, message.message, message.id, false);
        } else if (message.type === 'image') {
            addMessageToChat(message.user, `${message.message.text}<br><img src="${message.message.image}" alt="Image" class="chat-image">`, message.id, true);
        }
    });
}

function sendNotification(title, body, messageId) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(function(registration) {
            registration.showNotification(title, {
                body,
                data: { messageId },  
                tag: messageId,  
                renotify: true
            });
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                    registration.showNotification(title, {
                        body,
                        data: { messageId },
                        tag: messageId,
                        renotify: true
                    });
                });
            }
        });
    }
}

function downloadImage(messageId) {
    const messageElement = document.querySelector(`div[data-message-id="${messageId}"]`);
    const img = messageElement.querySelector('img.chat-image');
    const a = document.createElement('a');
    a.href = img.src;
    a.download = 'image.png';
    a.click();
}
