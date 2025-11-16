// =================== IMPORTS ===================
import StoryApiSource from './data/story-api-source.js';
import MainView from './view/main-view.js';
import '../styles/style.css';

import StoryDB , { SavedDB } from './data/idb-config.js';
import { subscribeUser, unsubscribeUser } from './push-subscribe';

// =================== VIEW INIT ===================
const view = new MainView();

// =================== APPLICATION HANDLERS ===================
const App = {
  async login(email, password) {
    const loginResult = await StoryApiSource.login(email, password);
    sessionStorage.setItem('authToken', loginResult.token);
    sessionStorage.setItem('userName', loginResult.name);
    window.location.hash = '#/';
  },

  async register(name, email, password) {
    await StoryApiSource.register(name, email, password);
    alert('Registrasi berhasil! Silakan login.');
    window.location.hash = '#/login';
  },

  async addStory(formData) {
    const offlinePayload = {
      description: formData.get('description'),
      lat: formData.get('lat'),
      lon: formData.get('lon'),
      image: formData.get('photo'),
      createdAt: new Date().toISOString(),
    };

    try {
      // Coba kirim dulu ke API
      const result = await StoryApiSource.postStory(formData);

      // Kalau API mengembalikan error, paksa masuk ke catch
      if (!result || result.error) {
        throw new Error(result?.message || 'API error');
      }

      alert('Story posted successfully!');
    } catch (err) {
      console.error('[Offline Save] Gagal kirim ke API, simpan offline:', err);
      await StoryDB.addOfflineStory(offlinePayload);
      alert('Koneksi bermasalah / offline — story disimpan offline dan akan di-sync otomatis ketika online.');
    }
  },
};


// =================== OFFLINE SYNC QUEUE ===================
async function syncOfflineStories() {
  if (!navigator.onLine) return;

  const offlineStories = await StoryDB.getAllOfflineStories();
  if (!offlineStories.length) return;

  console.log(`[Sync] Mengirim ${offlineStories.length} story offline...`);

  for (const item of offlineStories) {
    const formData = new FormData();
    formData.append('description', item.description);
    if (item.lat) formData.append('lat', item.lat);
    if (item.lon) formData.append('lon', item.lon);
    if (item.image) formData.append('photo', item.image);

    try {
      await StoryApiSource.postStory(formData);
      await StoryDB.deleteOfflineStory(item.tempId);
      console.log('[Sync] Story offline terkirim & dihapus dari queue');
    } catch (err) {
      console.error('[Sync] Gagal sync — stop sync sementara:', err);
      break;
    }
  }
}

// =================== AUTH HELPERS ===================
function isUserLoggedIn() {
  return !!sessionStorage.getItem('authToken');
}

function updateNavLinksVisibility() {
  const isLoggedIn = isUserLoggedIn();
  const dashboardLink = document.getElementById('dashboard-link');
  const addStoryLink = document.getElementById('add-story-link');
  const logoutButton = document.getElementById('logout-button');

  if (!dashboardLink || !addStoryLink || !logoutButton) return;

  dashboardLink.style.display = isLoggedIn ? 'inline' : 'none';
  addStoryLink.style.display = isLoggedIn ? 'inline' : 'none';
  logoutButton.style.display = isLoggedIn ? 'inline-block' : 'none';
}

// =================== ROUTER ===================
const routes = {
  '/': async () => {
    let stories;
    const userName = sessionStorage.getItem('userName') || 'User';

    try {
      stories = await StoryApiSource.getStories();
      await StoryDB.putStories(stories);
      console.log('[IDB] Story update success from API');
    } catch (err) {
      console.error('[IDB] API gagal — ambil dari IndexedDB');
      stories = await StoryDB.getAllStories();
    }

    latestStories = stories;
    view.renderDashboard(stories, userName);
  },

  '/saved': async () => {
    const savedStories = await SavedDB.getAllStories();
    view.renderSavedPage(savedStories);
  },

  '/add': () => view.renderAddStoryPage(App.addStory),
  '/login': () => view.renderLoginPage(App.login),
  '/register': () => view.renderRegisterPage(App.register),
};

let latestStories = [];


function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const route = hash.substring(1);

  const protectedRoute = ['/', '/add'].includes(route);
  if (protectedRoute && !isUserLoggedIn()) return (window.location.hash = '#/login');

  if (route === '/login' && isUserLoggedIn()) return (window.location.hash = '#/');

  const authRoutes = ['/login', '/register'];
  document.body.classList.toggle('auth-page', authRoutes.includes(route));
  updateNavLinksVisibility();

  const pageRenderer = routes[route] || routes['/'];

  if (document.startViewTransition) {
    document.startViewTransition(() => pageRenderer());
  } else {
    pageRenderer();
  }
}

// =================== EVENT LISTENERS ===================
window.addEventListener('DOMContentLoaded', () => {
  handleRouteChange();
  syncOfflineStories();
});

window.addEventListener('hashchange', handleRouteChange);

window.addEventListener('online', () => {
  console.log('[Sync] Online kembali — menjalankan auto-sync...');
  syncOfflineStories();
});

// =================== SERVICE WORKER REGISTER ===================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered:', reg.scope))
      .catch(err => console.error('SW registration failed', err));
  });
}

// Push Notofikasi
const pushButton = document.getElementById('push-toggle-btn');
let isSubscribed = false;

navigator.serviceWorker.ready.then(async (reg) => {
  const subscription = await reg.pushManager.getSubscription();
  isSubscribed = subscription !== null;

  pushButton.textContent = isSubscribed
    ? 'Disable Notification'
    : 'Enable Notification';
});

pushButton.addEventListener('click', async () => {
  if (isSubscribed) {
    await unsubscribeUser();
    isSubscribed = false;
    pushButton.textContent = "Enable Notification";
  } else {
    await subscribeUser();
    isSubscribed = true;
    pushButton.textContent = "Disable Notification";
  }
});

// Handle tombol Save & Delete (delegation)
document.addEventListener('click', async (e) => {
  const saveBtn = e.target.closest('.save-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  // ---- SAVE STORY ----
  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const story = latestStories.find(item => String(item.id) === String(id));

    if (!story) {
      alert('Story tidak ditemukan di cache.');
      return;
    }

    await SavedDB.addStory(story);

    if (Notification.permission === 'granted') {
      new Notification('Story saved!', {
        body: `${story.name || story.author || 'Story'} berhasil disimpan`,
        icon: '/icons/icon-192.png',
      });
    }

    alert('Saved to favorites!');
    return;
  }

  // ---- DELETE STORY (di halaman /saved) ----
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;

    await SavedDB.deleteStory(id);

    if (Notification.permission === 'granted') {
      new Notification('Story removed', {
        body: 'Story sudah dihapus dari saved',
        icon: '/icons/icon-192.png',
      });
    }

    alert('Deleted from favorites!');

    // Refresh hanya kalau sedang di halaman saved
    if (window.location.hash === '#/saved') {
      handleRouteChange();
    }
  }
});

// =================== LOGOUT HANDLER (Delegation) ===================
document.addEventListener("click", (e) => {
  if (e.target.id === "logout-button") {
    sessionStorage.clear();
    window.location.hash = "#/login";
    handleRouteChange();  // Refresh UI dan update navbar
    console.log("User logged out");
  }
});






