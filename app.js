// app.js - Wyld Deal Application Logic

// --- FIREBASE CONFIGURATION (Insert your keys here) ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

let isFirebaseEnabled = false;
let db, auth;

// Verify if user replaced configuration values
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseEnabled = true;
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Using Local/Mock Storage fallback. Set up Firebase API keys to connect a database.");
}

// Initial Default Forum Comments (Fallback & Seed)
const DEFAULT_COMMENTS = [
  {
    id: 1,
    author: "MetroKing96",
    avatar: "M",
    text: "Will this twin-scroll fit my 1996 Geo Metro? I have a blowtorch, a welder, and zip ties ready to make this happen. Let me know if I need a custom hood scoop.",
    time: "2 hours ago",
    likes: 42,
    liked: false
  },
  {
    id: 2,
    author: "10mm_Hunter",
    avatar: "H",
    text: "Bought the Instant Regret Kit last week. It contained a single 10mm socket, a rusted valve stem, a sticker that says 'BOOST IS MY CO-PILOT', and a broken zip tie. 11/10, absolutely peak disappointment. Buying another one today.",
    time: "4 hours ago",
    likes: 108,
    liked: false
  },
  {
    id: 3,
    author: "ShakyWrench",
    avatar: "S",
    text: "Does this GT35 turbocharger come with instructions? Or at least a prayer card? My garage floor is currently covered in motor oil, and I seem to have 3 leftover gaskets. Please advise.",
    time: "5 hours ago",
    likes: 27,
    liked: false
  },
  {
    id: 4,
    author: "CivicDrifter",
    avatar: "C",
    text: "Can confirm the 10mm socket in the IRK is the holy grail. I lost mine within 5 seconds of opening the cardboard box. It has entered the shadow dimension. $30 well spent.",
    time: "6 hours ago",
    likes: 83,
    liked: false
  }
];

// Initialize State
let state = {
  activeTab: 'deal',
  comments: [],
  stockPercent: 78,
  ordersCount: 412,
  usersOnline: 1482,
  currentUser: null
};

// On Page Load
document.addEventListener("DOMContentLoaded", () => {
  initTimer();
  initComments();
  initLiveStats();
  initStockSimulation();
  initUserSession();
  renderDiscussPreview();
});

// Tab Switcher Logic
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update Tab Contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  const activeTabEl = document.getElementById(`tab-${tabId}`);
  if (activeTabEl) {
    activeTabEl.classList.add('active-tab');
  }

  // Update Navigation Active Style
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.getElementById(`nav-${tabId}`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Smooth scroll to top of main content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Countdown Timer to Midnight
function initTimer() {
  const timerDisplay = document.getElementById('deal-timer');
  
  function updateTimer() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    
    const diff = midnight - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    if (timerDisplay) {
      timerDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
}

// Live Online Stats Fluctuation
function initLiveStats() {
  const usersEl = document.getElementById('users-count');
  
  setInterval(() => {
    // Slight fluctuation +/- 15 users
    const change = Math.floor(Math.random() * 31) - 15;
    state.usersOnline = Math.max(100, state.usersOnline + change);
    if (usersEl) {
      usersEl.textContent = state.usersOnline.toLocaleString();
    }
  }, 4000);
}

// Stock and Order simulation
function initStockSimulation() {
  // Load previous session stock if exists
  const storedStock = localStorage.getItem('wyld_stock');
  if (storedStock) {
    state.stockPercent = parseFloat(storedStock);
  }
  
  const storedOrders = localStorage.getItem('wyld_orders');
  if (storedOrders) {
    state.ordersCount = parseInt(storedOrders);
  }

  updateStockUI();

  // Simulation: stock drops slowly over time
  setInterval(() => {
    if (state.stockPercent > 4) {
      const drop = (Math.random() * 0.4).toFixed(2);
      state.stockPercent = parseFloat((state.stockPercent - drop).toFixed(2));
      state.ordersCount += Math.random() > 0.6 ? 1 : 0;
      
      localStorage.setItem('wyld_stock', state.stockPercent);
      localStorage.setItem('wyld_orders', state.ordersCount);
      
      updateStockUI();
    }
  }, 15000);
}

function updateStockUI() {
  const stockBar = document.getElementById('stock-bar-fill');
  const stockText = document.getElementById('stock-pct-value');
  const ordersEl = document.getElementById('stat-orders');

  if (stockBar) {
    stockBar.style.width = `${state.stockPercent}%`;
  }
  if (stockText) {
    stockText.textContent = `${state.stockPercent}% Sold`;
  }
  if (ordersEl) {
    ordersEl.textContent = state.ordersCount;
  }
}

// Coupons Side Drawer Toggle
function toggleCoupons() {
  const drawer = document.getElementById('coupons-drawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

// Copy Coupon Code Utility
function copyCoupon(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Coupon "${code}" copied to clipboard!`);
  }).catch(() => {
    showToast(`Failed to copy code. Use it manually: ${code}`);
  });
}

// Secure Checkout Modal
function openCheckout(productTitle, price, imageSrc) {
  const modal = document.getElementById('checkout-modal');
  const titleEl = document.getElementById('checkout-title');
  const priceEl = document.getElementById('checkout-price');
  const imgEl = document.getElementById('checkout-img');
  
  // Set details
  if (titleEl) titleEl.textContent = productTitle;
  if (priceEl) priceEl.textContent = `$${price}.00`;
  if (imgEl) {
    imgEl.src = imageSrc;
    imgEl.alt = productTitle;
  }

  // Reset screen states
  document.getElementById('checkout-form-content').style.display = 'block';
  document.getElementById('checkout-success-content').style.display = 'none';

  if (modal) {
    modal.classList.add('show');
  }
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function processPayment() {
  // Simulate network request
  const formContent = document.getElementById('checkout-form-content');
  const successContent = document.getElementById('checkout-success-content');
  const transIdEl = document.getElementById('trans-id');

  // Set random transaction code
  const randomTx = Math.floor(10000 + Math.random() * 90000);
  if (transIdEl) {
    transIdEl.textContent = `#WYLD-${randomTx}`;
  }

  // Simulate payment delay
  if (formContent) formContent.style.display = 'none';
  
  // Show confirmation
  if (successContent) {
    successContent.style.display = 'flex';
  }

  // Adjust stock on checkout
  const qty = parseInt(document.getElementById('checkout-qty').value) || 1;
  state.stockPercent = Math.max(0, parseFloat((state.stockPercent - (qty * 0.8)).toFixed(2)));
  state.ordersCount += qty;
  localStorage.setItem('wyld_stock', state.stockPercent);
  localStorage.setItem('wyld_orders', state.ordersCount);
  updateStockUI();
}

// Forums & Comments Section
function initComments() {
  if (isFirebaseEnabled) {
    // Listen to real-time comments updates in Cloud Firestore
    db.collection("comments").orderBy("timestamp", "desc").limit(30)
      .onSnapshot(snapshot => {
        const firebaseComments = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          firebaseComments.push({
            id: doc.id,
            author: data.author,
            avatar: data.author.charAt(0).toUpperCase(),
            text: data.text,
            time: data.timestamp ? formatTimeAgo(data.timestamp.toDate()) : "Just now",
            likes: data.likes || 0,
            liked: false
          });
        });
        
        // Seed Firestore if empty to keep forum populated
        if (firebaseComments.length === 0) {
          DEFAULT_COMMENTS.forEach((c, idx) => {
            db.collection("comments").add({
              author: c.author,
              text: c.text,
              likes: c.likes,
              timestamp: new Date(Date.now() - (idx * 1000 * 3600 * 3))
            });
          });
        } else {
          state.comments = firebaseComments;
          renderComments();
        }
      }, error => {
        console.error("Firestore loading failed. Falling back to local storage:", error);
        loadLocalComments();
      });
  } else {
    loadLocalComments();
  }
}

function loadLocalComments() {
  const stored = localStorage.getItem('wyld_comments');
  if (stored) {
    state.comments = JSON.parse(stored);
  } else {
    state.comments = [...DEFAULT_COMMENTS];
    localStorage.setItem('wyld_comments', JSON.stringify(state.comments));
  }
  renderComments();
}

function renderComments() {
  const container = document.getElementById('comments-feed-container');
  if (!container) return;

  container.innerHTML = '';
  
  state.comments.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'comment-card';
    
    // Check if ID is number or Firestore string to format function call correctly
    const passedId = typeof comment.id === 'string' ? `'${comment.id}'` : comment.id;
    
    card.innerHTML = `
      <div class="comment-meta">
        <div class="comment-author-badge">
          <div class="comment-avatar" style="background: ${getAvatarColor(comment.author)}">${comment.avatar}</div>
          <span class="comment-author">${comment.author}</span>
        </div>
        <span class="comment-time">${comment.time}</span>
      </div>
      <div class="comment-body">${escapeHTML(comment.text)}</div>
      <div class="comment-actions">
        <button class="comment-action-btn ${comment.liked ? 'liked' : ''}" onclick="toggleLike(${passedId})">
          🔥 <span id="likes-count-${comment.id}">${comment.likes}</span> Likes
        </button>
        <button class="comment-action-btn" onclick="flagComment(${passedId})">
          ⚠️ Report
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Also update home page deal discussion preview
  renderDiscussPreview();
}

function togglePostForm() {
  const form = document.getElementById('post-form');
  if (form) {
    form.classList.toggle('show');
  }
}

function submitComment() {
  const usernameInput = document.getElementById('comment-username');
  const textInput = document.getElementById('comment-text');

  const author = usernameInput.value.trim() || (state.currentUser ? state.currentUser.username : "AnonymousWrench");
  const text = textInput.value.trim();

  if (!text) {
    showToast("Please enter a comment before posting!");
    return;
  }

  if (isFirebaseEnabled) {
    db.collection("comments").add({
      author: author,
      text: text,
      likes: 0,
      timestamp: new Date()
    })
    .then(() => {
      textInput.value = '';
      togglePostForm();
      showToast("Your comment has been posted to the forum!");
    })
    .catch(error => {
      console.error("Firestore post error:", error);
      showToast("Failed to post comment.");
    });
  } else {
    const newComment = {
      id: Date.now(),
      author: author,
      avatar: author.charAt(0).toUpperCase(),
      text: text,
      time: "Just now",
      likes: 0,
      liked: false
    };

    state.comments.unshift(newComment); // Add to top
    localStorage.setItem('wyld_comments', JSON.stringify(state.comments));
    
    // Reset fields
    textInput.value = '';
    togglePostForm();
    
    renderComments();
    showToast("Your comment has been posted to the forum!");
  }
}

function toggleLike(commentId) {
  if (isFirebaseEnabled) {
    const commentIndex = state.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    const comment = state.comments[commentIndex];
    
    let increment = 1;
    if (comment.liked) {
      increment = -1;
      comment.liked = false;
    } else {
      comment.liked = true;
    }
    
    // Update count in Firestore doc
    db.collection("comments").doc(commentId).update({
      likes: firebase.firestore.FieldValue.increment(increment)
    })
    .then(() => {
      // Toggle client state liked flag locally
      state.comments[commentIndex].liked = !state.comments[commentIndex].liked;
      state.comments[commentIndex].likes += increment;
      renderComments();
    })
    .catch(err => {
      console.error("Failed to update Firestore comment like:", err);
    });
  } else {
    state.comments = state.comments.map(c => {
      if (c.id === commentId) {
        if (c.liked) {
          c.likes--;
          c.liked = false;
        } else {
          c.likes++;
          c.liked = true;
        }
      }
      return c;
    });
    localStorage.setItem('wyld_comments', JSON.stringify(state.comments));
    renderComments();
  }
}

function flagComment(commentId) {
  showToast("Thank you. Our pitcrew moderators will review this comment.");
}

// Helpers
function getAvatarColor(username) {
  const colors = ['#ff5e00', '#00f0ff', '#ffbe1a', '#a55eea', '#26de81', '#ff5252'];
  let sum = 0;
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " years ago";
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " months ago";
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " days ago";
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hours ago";
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minutes ago";
  
  return "just now";
}

// General Custom Toast/Alert
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  toast.style.background = 'rgba(18, 20, 24, 0.95)';
  toast.style.border = '1px solid var(--accent-orange)';
  toast.style.boxShadow = '0 0 20px rgba(255, 94, 0, 0.3)';
  toast.style.color = '#fff';
  toast.style.padding = '0.75rem 1.5rem';
  toast.style.borderRadius = '30px';
  toast.style.zIndex = '2000';
  toast.style.fontFamily = 'var(--font-sans)';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '600';
  toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  toast.style.opacity = '0';
  toast.textContent = message;

  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }, 50);

  // Remove toast
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Membership Action
function joinMembership(tierName) {
  showToast(`Thank you! You successfully joined the ${tierName} plan.`);
}

// Newsletter Action
function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletter-email');
  if (emailInput && emailInput.value.trim()) {
    showToast(`Subscribed! Check ${emailInput.value.trim()} for deal notifications.`);
    emailInput.value = '';
  } else {
    showToast(`Please enter a valid email address.`);
  }
}

// User Session and Login Modal Controls
function initUserSession() {
  if (isFirebaseEnabled) {
    // Firebase auth listener
    auth.onAuthStateChanged(user => {
      if (user) {
        const username = user.displayName || user.email.split('@')[0];
        state.currentUser = {
          username: username,
          email: user.email,
          avatar: username.charAt(0).toUpperCase()
        };
      } else {
        state.currentUser = null;
      }
      updateHeaderUserMenu();
    });
  } else {
    const storedUser = localStorage.getItem('wyld_user');
    if (storedUser) {
      state.currentUser = JSON.parse(storedUser);
    }
    updateHeaderUserMenu();
  }
}

function updateHeaderUserMenu() {
  const menuContainer = document.getElementById('header-user-menu');
  if (!menuContainer) return;
  
  if (state.currentUser) {
    menuContainer.innerHTML = `
      <button class="btn-login dropdown-toggle" onclick="toggleAccountDropdown(event)">
        <span class="user-welcome-avatar" style="background: ${getAvatarColor(state.currentUser.username)}">
          ${state.currentUser.avatar}
        </span> Account ▾
      </button>
      <div class="dropdown-menu" id="account-dropdown-menu">
        <a href="#" onclick="switchTab('membership'); closeAccountDropdown(event);">My Membership</a>
        <div class="dropdown-divider"></div>
        <a href="#" onclick="handleLogout(event)">Logout</a>
      </div>
    `;
    // If logged in, hide signup form container on home page
    const homeSignup = document.getElementById('home-signup-container');
    if (homeSignup) {
      homeSignup.style.display = 'none';
    }
  } else {
    menuContainer.innerHTML = `
      <button class="btn-login dropdown-toggle" onclick="toggleAccountDropdown(event)">Account ▾</button>
      <div class="dropdown-menu" id="account-dropdown-menu">
        <a href="#" onclick="openLoginModalTab('login', event)">Login</a>
        <a href="#" onclick="openLoginModalTab('signup', event)">Sign Up</a>
      </div>
    `;
    const homeSignup = document.getElementById('home-signup-container');
    if (homeSignup) {
      homeSignup.style.display = 'block';
    }
  }
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('show');
    switchModalTab('login');
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function switchModalTab(tab) {
  const tabLoginBtn = document.getElementById('modal-tab-login');
  const tabSignupBtn = document.getElementById('modal-tab-signup');
  const formLogin = document.getElementById('modal-login-form');
  const formSignup = document.getElementById('modal-signup-form');
  
  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    formLogin.style.display = 'block';
    formSignup.style.display = 'none';
  } else {
    tabSignupBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    formLogin.style.display = 'none';
    formSignup.style.display = 'block';
  }
}

function handleModalLogin() {
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const nameOrEmail = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!nameOrEmail || !pass) {
    showToast("Please enter email and password.");
    return;
  }

  const email = nameOrEmail.includes('@') ? nameOrEmail : `${nameOrEmail.toLowerCase()}@garage.com`;

  if (isFirebaseEnabled) {
    auth.signInWithEmailAndPassword(email, pass)
      .then(userCredential => {
        closeLoginModal();
        showToast("Logged in successfully!");
      })
      .catch(error => {
        console.error("Firebase Login Error:", error);
        showToast(`Login failed: ${error.message}`);
      });
  } else {
    const userObj = {
      username: nameOrEmail.split('@')[0],
      email: email,
      avatar: nameOrEmail.charAt(0).toUpperCase()
    };
    state.currentUser = userObj;
    localStorage.setItem('wyld_user', JSON.stringify(userObj));
    updateHeaderUserMenu();
    closeLoginModal();
    showToast(`Welcome back, ${state.currentUser.username}!`);
  }
}

function handleModalSignup() {
  const usernameInput = document.getElementById('signup-username');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  
  const name = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!name || !email || !pass) {
    showToast("All fields are required to sign up!");
    return;
  }

  if (isFirebaseEnabled) {
    auth.createUserWithEmailAndPassword(email, pass)
      .then(userCredential => {
        const user = userCredential.user;
        return user.updateProfile({ displayName: name });
      })
      .then(() => {
        closeLoginModal();
        showToast(`Account created! Welcome, ${name}.`);
      })
      .catch(error => {
        console.error("Firebase Signup Error:", error);
        showToast(`Signup failed: ${error.message}`);
      });
  } else {
    const userObj = {
      username: name,
      email: email,
      avatar: name.charAt(0).toUpperCase()
    };
    state.currentUser = userObj;
    localStorage.setItem('wyld_user', JSON.stringify(userObj));
    updateHeaderUserMenu();
    closeLoginModal();
    showToast(`Account created! Welcome, ${name}.`);
  }
}

function handleHomeSignup() {
  const usernameInput = document.getElementById('signup-home-username');
  const emailInput = document.getElementById('signup-home-email');
  const passwordInput = document.getElementById('signup-home-password');
  
  const name = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!name || !email || !pass) {
    showToast("Please fill out all fields to sign up!");
    return;
  }

  if (isFirebaseEnabled) {
    auth.createUserWithEmailAndPassword(email, pass)
      .then(userCredential => {
        const user = userCredential.user;
        return user.updateProfile({ displayName: name });
      })
      .then(() => {
        const homeSignup = document.getElementById('home-signup-container');
        if (homeSignup) {
          homeSignup.innerHTML = `
            <div style="text-align: center; padding: 2rem 0; width: 100%;">
              <div class="success-icon" style="margin: 0 auto 1.5rem;">✓</div>
              <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem;">Welcome to the Wyld Club, ${name}!</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem;">You are now signed in. Use coupon code <strong>WYLDCLUB10</strong> for 10% off your purchase.</p>
            </div>
          `;
        }
        showToast("Account created successfully!");
      })
      .catch(error => {
        console.error("Firebase Home Signup Error:", error);
        showToast(`Signup failed: ${error.message}`);
      });
  } else {
    const userObj = {
      username: name,
      email: email,
      avatar: name.charAt(0).toUpperCase()
    };
    state.currentUser = userObj;
    localStorage.setItem('wyld_user', JSON.stringify(userObj));
    updateHeaderUserMenu();
    
    const homeSignup = document.getElementById('home-signup-container');
    if (homeSignup) {
      homeSignup.innerHTML = `
        <div style="text-align: center; padding: 2rem 0; width: 100%;">
          <div class="success-icon" style="margin: 0 auto 1.5rem;">✓</div>
          <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem;">Welcome to the Wyld Club, ${name}!</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">You are now signed in. Use coupon code <strong>WYLDCLUB10</strong> for 10% off your purchase.</p>
        </div>
      `;
    }
    showToast("Account created successfully!");
  }
}

function handleLogout(event) {
  if (event) {
    event.preventDefault();
  }
  if (isFirebaseEnabled) {
    auth.signOut()
      .then(() => {
        showToast("Logged out successfully.");
      })
      .catch(error => {
        console.error("Firebase Logout Error:", error);
        showToast("Logout failed.");
      });
  } else {
    state.currentUser = null;
    localStorage.removeItem('wyld_user');
    updateHeaderUserMenu();
    showToast("Logged out successfully.");
  }
}

// Dropdown Menu Helpers
function toggleAccountDropdown(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const menu = document.getElementById('account-dropdown-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function closeAccountDropdown(event) {
  if (event) {
    event.preventDefault();
  }
  const menu = document.getElementById('account-dropdown-menu');
  if (menu) {
    menu.classList.remove('show');
  }
}

function openLoginModalTab(tab, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  closeAccountDropdown();
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('show');
    switchModalTab(tab);
  }
}

// Global click handler to close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const menu = document.getElementById('account-dropdown-menu');
  if (menu && menu.classList.contains('show')) {
    if (!e.target.matches('.dropdown-toggle') && !e.target.closest('.dropdown')) {
      menu.classList.remove('show');
    }
  }
});

// Discuss Today's Deal Preview on Home Page
function renderDiscussPreview() {
  const container = document.getElementById('discuss-preview-list');
  if (!container) return;
  
  container.innerHTML = '';
  // Take first 2 discussions/comments
  const previews = state.comments.slice(0, 2);
  previews.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'discuss-preview-card';
    card.onclick = () => switchTab('forum');
    card.innerHTML = `
      <div class="discuss-preview-meta">
        <span class="discuss-preview-author">${comment.author}</span>
        <span>${comment.time}</span>
      </div>
      <div class="discuss-preview-text">"${escapeHTML(comment.text)}"</div>
    `;
    container.appendChild(card);
  });
}

