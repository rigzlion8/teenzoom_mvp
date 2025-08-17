const API = ''; // same origin

let token = '';
let username = '';
let socket;
let currentRoom = 'general';

const authBox = document.getElementById('auth');
const appBox = document.getElementById('app');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMsg = document.getElementById('authMsg');

const usernameInput = document.getElementById('username');
const displayInput = document.getElementById('displayName');
const passwordInput = document.getElementById('password');

const messagesList = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const typingDiv = document.getElementById('typing');
const picker = document.getElementById('picker');
const coinsSpan = document.getElementById('coins');
const xpSpan = document.getElementById('xp');
const meBox = document.getElementById('meBox');

const vipBtn = document.getElementById('vipBtn');
const shop = document.getElementById('shop');
const buyMonthly = document.getElementById('buyMonthly');
const buyLifetimeCoins = document.getElementById('buyLifetimeCoins');
const buyLifetimeCard = document.getElementById('buyLifetimeCard');
const closeShop = document.getElementById('closeShop');

const roomsList = document.getElementById('roomsList');
const videoUrl = document.getElementById('videoUrl');
const addVideoBtn = document.getElementById('addVideoBtn');
const videoListDiv = document.getElementById('videoList');

const lbXpBtn = document.getElementById('lbXpBtn');
const lbLikesBtn = document.getElementById('lbLikesBtn');
const leaderboardEl = document.getElementById('leaderboard');

function setAuthState(tok, user) {
  token = tok;
  username = user;
  localStorage.setItem('tz_token', token);
  localStorage.setItem('tz_user', username);
}

function showAuthError(msg) { authMsg.textContent = msg; setTimeout(()=>authMsg.textContent='',4000); }

signupBtn.addEventListener('click', async () => {
  const usernameV = usernameInput.value.trim();
  const passwordV = passwordInput.value;
  const displayV = displayInput.value.trim();
  if (!usernameV || !passwordV) return showAuthError('Missing fields');
  try {
    const res = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: usernameV, password: passwordV, displayName: displayV }) });
    const data = await res.json();
    if (data.token) {
      setAuthState(data.token, data.username);
      startApp();
    } else { showAuthError(data.message || 'Signup failed'); }
  } catch (e) { showAuthError('Signup failed'); }
});

loginBtn.addEventListener('click', async () => {
  const usernameV = usernameInput.value.trim();
  const passwordV = passwordInput.value;
  if (!usernameV || !passwordV) return showAuthError('Missing fields');
  try {
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: usernameV, password: passwordV }) });
    const data = await res.json();
    if (data.token) {
      setAuthState(data.token, data.username);
      startApp();
    } else { showAuthError(data.message || 'Login failed'); }
  } catch (e) { showAuthError('Login failed'); }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('tz_token'); localStorage.removeItem('tz_user');
  token=''; username=''; socket?.disconnect();
  appBox.style.display='none'; authBox.style.display='block';
});

function appendMessage(payload) {
  const li = document.createElement('li');
  li.innerHTML = `<strong>${payload.username}</strong> ${payload.text ? payload.text : ''} ${payload.createdAt ? '<small class="muted"> '+(new Date(payload.createdAt)).toLocaleTimeString()+'</small>' : ''}`;
  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function connectSocket() {
  socket = io('/', { auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('socket connect err', err.message);
    alert('Socket error: ' + err.message);
  });
  socket.on('message', (m) => appendMessage(m));
  socket.on('private_message', (m) => {
    const li = document.createElement('li'); li.innerHTML = `<em>Private</em> <strong>${m.from}</strong>: ${m.text}`; messagesList.appendChild(li);
  });
  socket.on('system', (s) => { const li=document.createElement('li'); li.className='muted'; li.textContent=s.message; messagesList.appendChild(li); });
  socket.on('typing', (d) => typingDiv.textContent = d.user + ' typing…');
  socket.on('stop_typing', () => typingDiv.textContent = '');
  socket.on('coins:update', (d) => { coinsSpan.textContent = 'Coins: ' + d.coins; if (d.xp!==undefined) xpSpan.textContent = 'XP: ' + d.xp; });
}

async function loadMe() {
  const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + token }});
  const me = await res.json();
  coinsSpan.textContent = 'Coins: ' + (me.coins || 0);
  xpSpan.textContent = 'XP: ' + (me.xp || 0);
  meBox.innerHTML = `<img src="${me.avatarUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed='+encodeURIComponent(me.username)}"/><div><div>@${me.username}${me.isVip ? ' <span title="VIP">👑</span>':''}</div><small>${me.status||''}</small></div>`;
}

async function loadInitial() {
  await loadMe();
  try {
    const r = await fetch('/api/rooms', { headers: { Authorization: 'Bearer ' + token } });
    const rooms = await r.json();
    roomsList.innerHTML = '';
    if (!rooms || rooms.length===0) {
      roomsList.innerHTML = '<li>general</li>';
    } else {
      rooms.forEach(rm => { const li = document.createElement('li'); li.textContent = rm.name || rm.roomId; li.style.cursor='pointer'; li.onclick = ()=> joinRoom(rm.roomId); roomsList.appendChild(li); });
    }
    loadMessages(currentRoom);
    loadVideos(currentRoom);
  } catch (e) { console.warn('loadInitial', e); }
}

async function loadMessages(room) {
  try {
    const res = await fetch('/api/messages/' + room, { headers: { Authorization: 'Bearer ' + token }});
    const msgs = await res.json();
    messagesList.innerHTML = '';
    msgs.forEach(m => appendMessage(m));
  } catch (e) { console.warn('load messages', e); }
}

async function loadVideos(room) {
  try {
    const res = await fetch('/api/videos/' + room, { headers: { Authorization: 'Bearer ' + token }});
    const vids = await res.json();
    videoListDiv.innerHTML = '';
    vids.forEach(v => {
      const div = document.createElement('div');
      div.innerHTML = `<div>${v.title || v.videoId}</div><a href="https://youtu.be/${v.videoId}" target="_blank">Open</a>`;
      videoListDiv.appendChild(div);
    });
  } catch (e) { console.warn('load videos', e); }
}

function startApp() {
  authBox.style.display='none';
  appBox.style.display='block';
  connectSocket();
  loadInitial();
}

sendBtn.addEventListener('click', async () => {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('message', { roomId: currentRoom, text });
  msgInput.value = '';
  socket.emit('stop_typing');
});

msgInput.addEventListener('keydown', () => socket?.emit('typing'));
picker.addEventListener('emoji-click', (ev) => { msgInput.value += ev.detail.unicode; msgInput.focus(); });

addVideoBtn.addEventListener('click', async () => {
  const url = videoUrl.value.trim();
  if (!url) return alert('Enter a YouTube URL');
  const vid = parseYouTubeId(url);
  if (!vid) return alert('Invalid YouTube URL');
  try {
    const res = await fetch('/api/videos', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ roomId: currentRoom, videoId: vid, title: url, thumbnail: '' }) });
    if (res.ok) {
      loadVideos(currentRoom);
      socket.emit('message', { roomId: currentRoom, text: `Shared video: https://youtu.be/${vid}` });
      videoUrl.value='';
    } else {
      const err = await res.json(); alert(err.message || 'Error');
    }
  } catch(e){alert('Error adding video')}
});

function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch(e){}
  return null;
}

vipBtn.addEventListener('click', ()=> shop.style.display='flex');
closeShop.addEventListener('click', ()=> shop.style.display='none');

buyMonthly.addEventListener('click', async ()=> {
  try {
    const res = await fetch('/api/vip/purchase', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token }, body: JSON.stringify({ type: 'monthly' }) });
    const j = await res.json(); alert(j.message || 'Done'); shop.style.display='none'; loadMe();
  } catch(e){alert('Error')}
});

buyLifetimeCoins.addEventListener('click', async ()=> {
  try {
    const res = await fetch('/api/vip/purchase', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token }, body: JSON.stringify({ type: 'lifetime_coins' }) });
    const j = await res.json(); alert(j.message || 'Done'); shop.style.display='none'; loadMe();
  } catch(e){alert('Error')}
});

buyLifetimeCard.addEventListener('click', async ()=> {
  try {
    const res = await fetch('/api/payments/checkout/lifetime', { method:'POST', headers:{ 'Authorization':'Bearer '+token }});
    const j = await res.json();
    if (j.url) { window.location.href = j.url; } else { alert('Stripe not configured'); }
  } catch(e){alert('Error')}
});

lbXpBtn.addEventListener('click', async () => { loadLeaderboard('/api/leaderboard/top-xp'); });
lbLikesBtn.addEventListener('click', async () => { loadLeaderboard('/api/leaderboard/most-liked'); });

async function loadLeaderboard(path) {
  const res = await fetch(path, { headers: { Authorization: 'Bearer ' + token }});
  const list = await res.json();
  leaderboardEl.innerHTML = '';
  list.forEach((u, i) => {
    const li = document.createElement('li');
    li.innerHTML = `#${i+1} @${u.username} — XP ${u.xp||0} • ❤️ ${u.likesCount||0}`;
    leaderboardEl.appendChild(li);
  });
}

// auto-login if token present
window.addEventListener('load', () => {
  const t = localStorage.getItem('tz_token');
  const u = localStorage.getItem('tz_user');
  if (t && u) { token = t; username = u; startApp(); }
});

async function joinRoom(roomId) {
  currentRoom = roomId;
  document.getElementById('roomTitle').textContent = roomId;
  socket.emit('joinRoom', roomId);
  await loadMessages(roomId);
  await loadVideos(roomId);
}
