const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const usernameInput = document.getElementById('username');
const msgInput = document.getElementById('msg');
const usersList = document.getElementById('users-list');
const typingDiv = document.getElementById('typing');
const emojiBtn = document.getElementById('emoji-btn');
const notificationSound = document.getElementById('notification-sound');

const socket = io();

let username = '';
let typingTimeout;

// Load chat history
fetch('/chat-history')
  .then(response => response.json())
  .then(messages => {
    messages.forEach(msg => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  username = usernameInput.value;
  const msg = msgInput.value;

  // Emit message to server
  socket.emit('chat message', { username, message: msg });

  // Clear input
  msgInput.value = '';
  msgInput.focus();
});

// Message from server
socket.on('chat message', (msg) => {
  outputMessage(msg);
  
  // Play notification sound if the message is not from the current user
  if (msg.username !== username) {
    notificationSound.play();
  }

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Output message to DOM
function outputMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  if (msg.username === username) {
    div.classList.add('sent');
  } else {
    div.classList.add('received');
  }

  div.innerHTML = `
    <p class="meta">${msg.username} <span>${new Date(msg.timestamp).toLocaleString()}</span></p>
    <p class="text">${msg.message}</p>
    <span class="delete-btn" data-id="${msg.id}">🗑️</span>
  `;
  chatMessages.appendChild(div);

  // Add animation class
  setTimeout(() => div.classList.add('show'), 100);

  // Add delete functionality
  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    socket.emit('delete message', msg.id);
  });
}

// Delete message
socket.on('message deleted', (messageId) => {
  const messageToDelete = document.querySelector(`[data-id="${messageId}"]`).parentElement;
  messageToDelete.remove();
});

// Typing event
msgInput.addEventListener('input', () => {
  socket.emit('typing', username);
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop typing', username);
  }, 1000);
});

socket.on('typing', (user) => {
  typingDiv.textContent = `${user} is typing...`;
});

socket.on('stop typing', () => {
  typingDiv.textContent = '';
});

// Online users
socket.on('update users', (users) => {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    usersList.appendChild(li);
  });
});

// Emoji picker
const picker = new EmojiMart.Picker({ onEmojiSelect: emoji => {
  msgInput.value += emoji.native;
}});

emojiBtn.addEventListener('click', () => {
  picker.togglePicker(emojiBtn);
});

// Username input animation
usernameInput.addEventListener('focus', () => {
  usernameInput.style.transform = 'translateY(-5px)';
});

usernameInput.addEventListener('blur', () => {
  usernameInput.style.transform = 'translateY(0)';
});
