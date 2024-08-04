const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const usernameInput = document.getElementById('username');
const msgInput = document.getElementById('msg');
const socket = io();

fetch('/chat-history')
  .then(response => response.json())
  .then(messages => {
    messages.forEach(msg => outputMessage(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const username = usernameInput.value;
  const msg = msgInput.value;

  socket.emit('chat message', { username, message: msg });

  msgInput.value = '';
  msgInput.focus();
});

socket.on('chat message', (msg) => {
  outputMessage(msg);

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function outputMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  if (msg.username === usernameInput.value) {
    div.classList.add('sent');
  } else {
    div.classList.add('received');
  }

  div.innerHTML = `
    <p class="meta">${msg.username} <span>${new Date(msg.timestamp).toLocaleString()}</span></p>
    <p class="text">${msg.message}</p>
  `;
  chatMessages.appendChild(div);

  setTimeout(() => div.classList.add('show'), 100);
}

usernameInput.addEventListener('focus', () => {
  usernameInput.style.transform = 'translateY(-5px)';
});

usernameInput.addEventListener('blur', () => {
  usernameInput.style.transform = 'translateY(0)';
});
