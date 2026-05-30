/* ============================================
   VIBE SOCIAL — APP.JS
   ============================================ */

// ===== DATABASE (localStorage) =====
const DB = {
  get: k => JSON.parse(localStorage.getItem('vibe_' + k) || 'null'),
  set: (k, v) => localStorage.setItem('vibe_' + k, JSON.stringify(v)),
  def: (k, d) => { if (!localStorage.getItem('vibe_' + k)) DB.set(k, d); return DB.get(k); }
};

// ===== SEED DATA =====
const SEED_USERS = [
  { id: 'u1', name: 'Alex Rivera', username: 'alexrivera', bio: 'Designer & dreamer ✨ Building things that matter.', color: '#7c6aff', followers: ['u2','u3'], following: ['u2'] },
  { id: 'u2', name: 'Maya Chen', username: 'mayachen', bio: 'Photography | Travel | Coffee addict ☕', color: '#ff6aad', followers: ['u1'], following: ['u1','u3'] },
  { id: 'u3', name: 'Jordan Lee', username: 'jordanlee', bio: 'Dev by day 💻 Gamer by night 🎮', color: '#6affd4', followers: ['u2'], following: [] },
  { id: 'demo', name: 'Demo User', username: 'demo', bio: 'Just here exploring VIBE! 👋', color: '#ffd06a', followers: ['u1','u2'], following: ['u1','u2','u3'] },
];
const SEED_POSTS = [
  { id: 'p1', userId: 'u1', text: 'Just shipped a new design system for our team! Consistency is everything 🎨 The details really do make the difference when you scale up. Excited to see how the team uses it!', likes: ['u2','u3','demo'], time: Date.now() - 3600000 * 2, comments: ['c1','c2'] },
  { id: 'p2', userId: 'u2', text: 'Golden hour hits different when you\'re on a rooftop with your camera 📸✨ Caught this shot yesterday — the city was glowing. Some days just align perfectly.', likes: ['u1','demo'], time: Date.now() - 3600000 * 5, comments: ['c3'] },
  { id: 'p3', userId: 'u3', text: 'Hot take: dark mode is not just an aesthetic choice — it\'s a lifestyle 🌙 Been using it for 3 years, never going back. My eyes have never been happier.', likes: ['u1','u2','demo'], time: Date.now() - 3600000 * 8, comments: [] },
  { id: 'p4', userId: 'demo', text: 'Finally trying out VIBE and honestly? This platform slaps 🔥 The UI is clean, posts load fast, and the community seems genuinely nice. Who else is new here?', likes: ['u1','u2'], time: Date.now() - 3600000 * 1, comments: ['c4'] },
  { id: 'p5', userId: 'u2', text: 'Weekend trip to the mountains 🏔️ Reminder that disconnecting is sometimes the most productive thing you can do. No notifications for 48 hours = peak clarity.', likes: ['u1','u3'], time: Date.now() - 3600000 * 24, comments: [] },
  { id: 'p6', userId: 'u1', text: 'Reading "The Design of Everyday Things" for the 3rd time. New insights every read. If you\'re in product or design — this is required reading. No debate. 📚', likes: ['u2','demo'], time: Date.now() - 3600000 * 30, comments: [] },
];
const SEED_COMMENTS = [
  { id: 'c1', postId: 'p1', userId: 'u2', text: 'This looks incredible! Can\'t wait to try it out 😍', time: Date.now() - 3600000 * 1.5 },
  { id: 'c2', postId: 'p1', userId: 'demo', text: 'Great work! Consistency is so underrated.', time: Date.now() - 3600000 * 1 },
  { id: 'c3', postId: 'p2', userId: 'u1', text: 'Stunning shot! What camera are you using?', time: Date.now() - 3600000 * 4 },
  { id: 'c4', postId: 'p4', userId: 'u1', text: 'Welcome to VIBE! You\'re going to love it here 🙌', time: Date.now() - 3600000 * 0.5 },
];

// Seed password
const SEED_PASSWORDS = { u1: 'pass123', u2: 'pass123', u3: 'pass123', demo: 'demo123' };

function initDB() {
  DB.def('users', SEED_USERS);
  DB.def('posts', SEED_POSTS);
  DB.def('comments', SEED_COMMENTS);
  if (!DB.get('passwords')) DB.set('passwords', SEED_PASSWORDS);
}

// ===== STATE =====
let currentUser = null;
let currentProfileId = null;
let currentFeedTab = 'for-you';
let currentProfileTab = 'posts';
let viewingPostId = null;

// ===== HELPERS =====
const getUsers = () => DB.get('users') || [];
const getPosts = () => DB.get('posts') || [];
const getComments = () => DB.get('comments') || [];
const getPwds = () => DB.get('passwords') || {};
const saveUsers = u => DB.set('users', u);
const savePosts = p => DB.set('posts', p);
const saveComments = c => DB.set('comments', c);

function getUserById(id) { return getUsers().find(u => u.id === id); }
function getPostById(id) { return getPosts().find(p => p.id === id); }

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm';
  if (diff < 86400) return Math.floor(diff/3600) + 'h';
  return Math.floor(diff/86400) + 'd';
}

function avatarEl(user, cls='user-avatar-sm') {
  const div = document.createElement('div');
  div.className = cls;
  div.style.background = user.color || '#7c6aff';
  div.textContent = user.name[0].toUpperCase();
  return div;
}

function avatarHTML(user, cls='user-avatar-sm') {
  return `<div class="${cls}" style="background:${user.color || '#7c6aff'}">${user.name[0].toUpperCase()}</div>`;
}

// ===== AUTH =====
function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabRegister').classList.toggle('active', tab==='register');
  document.getElementById('formLogin').classList.toggle('hidden', tab!=='login');
  document.getElementById('formRegister').classList.toggle('hidden', tab!=='register');
}

function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) { showToast('Fill in all fields ⚠️'); return; }
  const user = getUsers().find(u => u.username === username);
  const pwds = getPwds();
  if (!user || pwds[user.id] !== password) { showToast('Invalid credentials ❌'); return; }
  loginUser(user);
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUsername').value.trim().toLowerCase();
  const bio = document.getElementById('regBio').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !username || !password) { showToast('Fill in all fields ⚠️'); return; }
  const users = getUsers();
  if (users.find(u => u.username === username)) { showToast('Username taken ❌'); return; }
  const newUser = {
    id: 'u' + Date.now(), name, username, bio: bio || '✨ New to VIBE!',
    color: ['#7c6aff','#ff6aad','#6affd4','#ffd06a','#ff5c6a','#4cde8a'][Math.floor(Math.random()*6)],
    followers: [], following: []
  };
  users.push(newUser);
  saveUsers(users);
  const pwds = getPwds();
  pwds[newUser.id] = password;
  DB.set('passwords', pwds);
  loginUser(newUser);
}

function loginUser(user) {
  currentUser = user;
  DB.set('session', user.id);
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initApp();
}

function logout(e) {
  e.stopPropagation();
  currentUser = null;
  DB.set('session', null);
  document.getElementById('app').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  showToast('Logged out. See you soon! 👋');
}

// ===== INIT APP =====
function initDB_and_start() {
  initDB();
  const sessionId = DB.get('session');
  if (sessionId) {
    const user = getUserById(sessionId);
    if (user) {
      loginUser(user);
      return;
    }
  }
}

function initApp() {
  // Update sidebar
  const u = currentUser;
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarHandle').textContent = '@' + u.username;
  const sa = document.getElementById('sidebarAvatar');
  sa.style.background = u.color; sa.textContent = u.name[0].toUpperCase();
  const ia = document.getElementById('inlineAvatar');
  ia.style.background = u.color; ia.textContent = u.name[0].toUpperCase();
  const ca = document.getElementById('composeAvatar');
  ca.style.background = u.color; ca.textContent = u.name[0].toUpperCase();

  showView('feed');
  renderRightPanel();
}

// ===== VIEWS =====
function showView(view) {
  ['feed','explore','notifications','profile'].forEach(v => {
    document.getElementById('view' + cap(v)).classList.add('hidden');
    document.getElementById('nav' + cap(v)).classList.remove('active');
  });
  document.getElementById('view' + cap(view)).classList.remove('hidden');
  document.getElementById('nav' + cap(view)).classList.add('active');

  if (view === 'feed') renderFeed();
  if (view === 'explore') renderExplore();
  if (view === 'notifications') renderNotifications();
  if (view === 'profile') renderProfile(currentUser.id);
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

// ===== FEED =====
function setFeedTab(tab, btn) {
  currentFeedTab = tab;
  document.querySelectorAll('.feed-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFeed();
}

function renderFeed() {
  let posts = getPosts().sort((a,b) => b.time - a.time);
  if (currentFeedTab === 'following') {
    const me = getUserById(currentUser.id);
    posts = posts.filter(p => me.following.includes(p.userId) || p.userId === currentUser.id);
  }
  const feed = document.getElementById('postsFeed');
  if (!posts.length) {
    feed.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No posts yet. Follow some people!</p></div>`;
    return;
  }
  feed.innerHTML = posts.map(p => renderPostCard(p)).join('');
}

function renderPostCard(post) {
  const user = getUserById(post.userId);
  if (!user) return '';
  const liked = post.likes.includes(currentUser.id);
  return `
    <div class="post-card" id="card-${post.id}">
      <div class="post-top">
        ${avatarHTML(user)}
        <div class="post-body">
          <div class="post-meta">
            <span class="post-name" onclick="viewProfile('${user.id}')">${user.name}</span>
            <span class="post-handle">@${user.username}</span>
            <span class="post-time">· ${timeAgo(post.time)}</span>
          </div>
          <div class="post-text" onclick="openPost('${post.id}')">${escHtml(post.text)}</div>
          <div class="post-actions">
            <button class="action-btn like ${liked?'liked':''}" onclick="toggleLike('${post.id}')">
              <span class="action-icon">${liked?'❤️':'🤍'}</span> ${post.likes.length}
            </button>
            <button class="action-btn comment" onclick="openPost('${post.id}')">
              <span class="action-icon">💬</span> ${post.comments.length}
            </button>
            <button class="action-btn share" onclick="sharePost('${post.id}')">
              <span class="action-icon">🔗</span> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ===== LIKES =====
function toggleLike(postId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const idx = post.likes.indexOf(currentUser.id);
  if (idx > -1) post.likes.splice(idx, 1);
  else post.likes.push(currentUser.id);
  savePosts(posts);

  // Re-render just this card if in feed
  const card = document.getElementById('card-' + postId);
  if (card) {
    const newCard = document.createElement('div');
    newCard.innerHTML = renderPostCard(post);
    const newEl = newCard.firstElementChild;
    newEl.id = 'card-' + postId;
    card.replaceWith(newEl);
  }
  // Update modal if open
  if (viewingPostId === postId) openPost(postId);
}

// ===== POST MODAL =====
function openPost(postId) {
  viewingPostId = postId;
  const post = getPostById(postId);
  const user = getUserById(post.userId);
  const comments = getComments().filter(c => c.postId === postId).sort((a,b) => a.time - b.time);
  const liked = post.likes.includes(currentUser.id);

  document.getElementById('postDetail').innerHTML = `
    <div class="post-card" style="border-bottom:1px solid var(--border)">
      <div class="post-top">
        ${avatarHTML(user)}
        <div class="post-body">
          <div class="post-meta">
            <span class="post-name">${user.name}</span>
            <span class="post-handle">@${user.username}</span>
          </div>
          <div class="post-text" style="cursor:default">${escHtml(post.text)}</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:14px">${new Date(post.time).toLocaleString()}</div>
          <div class="post-actions">
            <button class="action-btn like ${liked?'liked':''}" onclick="toggleLike('${post.id}')">
              <span class="action-icon">${liked?'❤️':'🤍'}</span> ${post.likes.length} Likes
            </button>
            <button class="action-btn comment">
              <span class="action-icon">💬</span> ${comments.length} Comments
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="comments-section">
      <div class="comment-compose">
        ${avatarHTML(currentUser)}
        <input class="comment-input" id="commentInput" placeholder="Write a comment..." />
        <button class="btn-comment" onclick="submitComment('${postId}')">Reply</button>
      </div>
      ${comments.length ? comments.map(c => {
        const cu = getUserById(c.userId);
        return `<div class="comment-item">
          ${avatarHTML(cu)}
          <div class="comment-body">
            <div class="comment-author">${cu.name} <span>@${cu.username} · ${timeAgo(c.time)}</span></div>
            <div class="comment-text">${escHtml(c.text)}</div>
          </div>
        </div>`;
      }).join('') : '<div class="no-comments">No comments yet. Be the first! 💬</div>'}
    </div>
  `;

  document.getElementById('postModal').classList.add('open');
  document.getElementById('postOverlay').classList.add('open');
}

function closePost() {
  document.getElementById('postModal').classList.remove('open');
  document.getElementById('postOverlay').classList.remove('open');
  viewingPostId = null;
}

function submitComment(postId) {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text) { showToast('Write something first ✏️'); return; }
  const comment = {
    id: 'c' + Date.now(), postId,
    userId: currentUser.id, text,
    time: Date.now()
  };
  const comments = getComments();
  comments.push(comment);
  saveComments(comments);

  // update post comment count
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) { post.comments.push(comment.id); savePosts(posts); }

  input.value = '';
  openPost(postId);
  showToast('Comment posted! 💬');
}

// ===== COMPOSE =====
function openCompose() {
  document.getElementById('composeModal').classList.add('open');
  document.getElementById('composeOverlay').classList.add('open');
  document.getElementById('postText').focus();
}
function closeCompose() {
  document.getElementById('composeModal').classList.remove('open');
  document.getElementById('composeOverlay').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('postText').addEventListener('input', function() {
    const rem = 280 - this.value.length;
    const el = document.getElementById('charCount');
    el.textContent = rem;
    el.classList.toggle('warn', rem < 50 && rem >= 20);
    el.classList.toggle('danger', rem < 20);
  });
});

function addEmoji(emoji) {
  const ta = document.getElementById('postText');
  ta.value += emoji;
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

function submitPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) { showToast('Write something! ✏️'); return; }
  if (text.length > 280) { showToast('Too long! Max 280 characters.'); return; }

  const post = {
    id: 'p' + Date.now(), userId: currentUser.id,
    text, likes: [], time: Date.now(), comments: []
  };
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
  document.getElementById('postText').value = '';
  document.getElementById('charCount').textContent = '280';
  closeCompose();
  showView('feed');
  showToast('Posted! 🚀');
}

// ===== EXPLORE =====
function renderExplore(query = '') {
  const users = getUsers().filter(u => u.id !== currentUser.id);
  const posts = getPosts().sort((a,b) => b.likes.length - a.likes.length);

  let filteredUsers = query ? users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase())
  ) : users;
  let filteredPosts = query ? posts.filter(p =>
    p.text.toLowerCase().includes(query.toLowerCase())
  ) : posts.slice(0, 6);

  const me = getUserById(currentUser.id);
  document.getElementById('exploreContent').innerHTML = `
    <div class="explore-section-title">👥 People</div>
    ${filteredUsers.map(u => `
      <div class="user-row" onclick="viewProfile('${u.id}')">
        ${avatarHTML(u)}
        <div class="user-row-info">
          <div class="user-row-name">${u.name}</div>
          <div class="user-row-handle">@${u.username} · ${u.followers.length} followers</div>
          <div class="user-row-bio">${u.bio}</div>
        </div>
        <button class="follow-btn ${me.following.includes(u.id)?'following':''}" onclick="toggleFollow(event,'${u.id}')">
          ${me.following.includes(u.id) ? 'Following' : 'Follow'}
        </button>
      </div>
    `).join('') || '<div style="padding:20px 24px;color:var(--muted)">No users found</div>'}
    <div class="explore-section-title" style="margin-top:8px">🔥 Trending Posts</div>
    ${filteredPosts.map(p => renderPostCard(p)).join('')}
  `;
}

function handleSearch() {
  renderExplore(document.getElementById('searchInput').value);
}

// ===== FOLLOW =====
function toggleFollow(e, targetId) {
  e.stopPropagation();
  const users = getUsers();
  const me = users.find(u => u.id === currentUser.id);
  const target = users.find(u => u.id === targetId);
  if (!me || !target) return;

  const idx = me.following.indexOf(targetId);
  if (idx > -1) {
    me.following.splice(idx, 1);
    const fi = target.followers.indexOf(currentUser.id);
    if (fi > -1) target.followers.splice(fi, 1);
    showToast(`Unfollowed @${target.username}`);
  } else {
    me.following.push(targetId);
    target.followers.push(currentUser.id);
    showToast(`Following @${target.username}! 🙌`);
  }
  saveUsers(users);
  currentUser = me;
  DB.set('session', me.id);
  renderExplore(document.getElementById('searchInput').value);
  renderRightPanel();
}

// ===== PROFILE =====
function viewProfile(userId) {
  currentProfileId = userId;
  currentProfileTab = 'posts';
  showView('profile');
}

function renderProfile(userId) {
  const user = getUserById(userId);
  const me = getUserById(currentUser.id);
  const isMe = userId === currentUser.id;
  const isFollowing = me.following.includes(userId);
  const userPosts = getPosts().filter(p => p.userId === userId).sort((a,b) => b.time - a.time);

  document.getElementById('profileHeader').innerHTML = `
    <div class="profile-cover"></div>
    <div class="profile-info-row">
      ${avatarHTML(user, 'user-avatar-lg')}
      <div>
        ${isMe
          ? `<button class="edit-profile-btn" onclick="editProfile()">Edit Profile</button>`
          : `<button class="follow-btn ${isFollowing?'following':''}" onclick="toggleFollow(event,'${userId}')" style="font-size:14px;padding:10px 22px">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>`
        }
      </div>
    </div>
    <div class="profile-details">
      <div class="profile-name">${user.name}</div>
      <div class="profile-handle">@${user.username}</div>
      <div class="profile-bio">${user.bio}</div>
      <div class="profile-stats">
        <div class="pstat"><span class="pstat-num">${userPosts.length}</span><span class="pstat-label">Posts</span></div>
        <div class="pstat"><span class="pstat-num">${user.followers.length}</span><span class="pstat-label">Followers</span></div>
        <div class="pstat"><span class="pstat-num">${user.following.length}</span><span class="pstat-label">Following</span></div>
      </div>
    </div>
  `;
  renderProfilePosts(userId);
  document.querySelectorAll('.profile-tab').forEach((b,i) => b.classList.toggle('active', i===0));
}

function renderProfilePosts(userId) {
  const posts = getPosts().sort((a,b) => b.time - a.time);
  let display;
  if (currentProfileTab === 'posts') {
    display = posts.filter(p => p.userId === userId);
  } else {
    display = posts.filter(p => p.likes.includes(userId));
  }
  const feed = document.getElementById('profilePosts');
  if (!display.length) {
    feed.innerHTML = `<div class="empty-state"><div class="empty-icon">${currentProfileTab==='posts'?'📝':'❤️'}</div><p>No ${currentProfileTab==='posts'?'posts':'liked posts'} yet</p></div>`;
    return;
  }
  feed.innerHTML = display.map(p => renderPostCard(p)).join('');
}

function setProfileTab(tab, btn) {
  currentProfileTab = tab;
  document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProfilePosts(currentProfileId || currentUser.id);
}

function editProfile() {
  const bio = prompt('Update your bio:', currentUser.bio);
  if (bio === null) return;
  const users = getUsers();
  const me = users.find(u => u.id === currentUser.id);
  me.bio = bio.trim() || me.bio;
  saveUsers(users);
  currentUser = me;
  renderProfile(currentUser.id);
  showToast('Profile updated! ✅');
}

// ===== NOTIFICATIONS =====
const NOTIFS = [
  { icon: '❤️', text: '<strong>Alex Rivera</strong> liked your post', time: '2m', unread: true },
  { icon: '💬', text: '<strong>Maya Chen</strong> commented: "This looks amazing!"', time: '15m', unread: true },
  { icon: '👤', text: '<strong>Jordan Lee</strong> started following you', time: '1h', unread: true },
  { icon: '🔁', text: '<strong>Alex Rivera</strong> shared your post', time: '3h', unread: false },
  { icon: '❤️', text: '<strong>Maya Chen</strong> liked your comment', time: '5h', unread: false },
];

function renderNotifications() {
  document.getElementById('notifsList').innerHTML = NOTIFS.map(n => `
    <div class="notif-item ${n.unread?'unread':''}">
      <span class="notif-icon">${n.icon}</span>
      <span class="notif-text">${n.text}</span>
      <span class="notif-time">${n.time}</span>
    </div>
  `).join('');
  document.getElementById('notifBadge').classList.add('hidden');
}

// ===== RIGHT PANEL =====
function renderRightPanel() {
  const me = getUserById(currentUser.id);
  const suggestions = getUsers()
    .filter(u => u.id !== currentUser.id && !me.following.includes(u.id))
    .slice(0, 4);

  document.getElementById('suggestedUsers').innerHTML = suggestions.map(u => `
    <div class="suggested-user">
      ${avatarHTML(u)}
      <div class="suggested-user-info">
        <div class="suggested-user-name">${u.name}</div>
        <div class="suggested-user-handle">@${u.username}</div>
      </div>
      <button class="follow-btn" onclick="toggleFollow(event,'${u.id}')">Follow</button>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:14px">You follow everyone! 🎉</p>';

  const tags = ['#design','#photography','#coding','#travel','#music','#tech','#art','#vibes'];
  const counts = ['12.4K','8.9K','7.2K','6.1K','5.8K','4.3K','3.9K','3.2K'];
  document.getElementById('trendingTags').innerHTML = tags.map((t,i) =>
    `<span class="tag-chip">${t}<span class="tag-count">${counts[i]}</span></span>`
  ).join('');
}

// ===== SHARE =====
function sharePost(postId) {
  showToast('Link copied to clipboard! 🔗');
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== START =====
document.addEventListener('DOMContentLoaded', initDB_and_start);