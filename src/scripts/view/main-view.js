import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  createDashboardTemplate,
  createStoryCardTemplate,
  createLoginPageTemplate,
  createRegisterPageTemplate,
  createAddStoryPageTemplate,
} from './template-creator.js';

// Konfigurasi ikon Leaflet
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

class MainView {
  constructor() {
    this._appContent = document.getElementById('app-content');
    this._mapInstance = null;
  }

  // Menampilkan halaman Dashboard
  renderDashboard(stories, userName) {
    this._appContent.innerHTML = createDashboardTemplate(userName);
    const storyListEl = document.getElementById('story-list');
    
    if (stories.length === 0) {
      storyListEl.innerHTML = `<p>No stories found.</p>`;
    } else {
      storyListEl.innerHTML = '';
      stories.forEach(story => {
        storyListEl.innerHTML += createStoryCardTemplate(story);
      });
    }
    
    this._initDashboardMap(stories);
  }

  // Menampilkan halaman Login
  renderLoginPage(loginHandler) {
    this._appContent.innerHTML = createLoginPageTemplate();
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = document.getElementById('login-error');
      try {
        const email = form.email.value;
        const password = form.password.value;
        await loginHandler(email, password);
      } catch (error) {
        errorEl.textContent = error.message;
      }
    });
  }

  // Menampilkan halaman Register
  renderRegisterPage(registerHandler) {
    this._appContent.innerHTML = createRegisterPageTemplate();
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = document.getElementById('register-error');
      errorEl.textContent = ''; 

      try {
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        
        // Memanggil handler untuk registrasi (yang diberikan oleh Presenter)
        await registerHandler(name, email, password);

      } catch (error) {
        errorEl.textContent = error.message;
      }
    });
  }

  // Menampilkan halaman Tambah Cerita
  renderAddStoryPage(addStoryHandler) {
    this._appContent.innerHTML = createAddStoryPageTemplate();
    this._initAddStoryForm(addStoryHandler);
  }

  // Inisialisasi Peta Dashboard
  _initDashboardMap(stories) {
    this._mapInstance = L.map('map-container').setView([-2.548926, 118.0148634], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this._mapInstance);
    
    stories.forEach(story => {
      if (story.lat && story.lon) {
        L.marker([story.lat, story.lon])
         .addTo(this._mapInstance)
         .bindPopup(`<b>${story.name}</b>`);
      }
    });
  }

  _initAddStoryForm(addStoryHandler) {
    const form = document.getElementById('add-story-form');
    const errorMessage = document.getElementById('error-message');

    // --- Logika untuk Peta ---
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    const mapPicker = L.map('map-picker').setView([-2.548926, 118.0148634], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapPicker);
    let locationMarker;

    mapPicker.on('click', (e) => {
      const { lat, lng } = e.latlng;
      latInput.value = lat;
      lonInput.value = lng;

      if (locationMarker) {
        locationMarker.setLatLng(e.latlng);
      } else {
        locationMarker = L.marker(e.latlng).addTo(mapPicker);
      }
      mapPicker.panTo(e.latlng);
    });

    // === BAGIAN YANG HILANG: LOGIKA KAMERA DIMASUKKAN KEMBALI DI SINI ===
    const videoEl = document.getElementById('camera-preview');
    const openCameraBtn = document.getElementById('open-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const photoInput = document.getElementById('photo');
    let stream;

    openCameraBtn.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        videoEl.style.display = 'block';
        captureBtn.style.display = 'inline-block';
        openCameraBtn.style.display = 'none';
      } catch (err) {
        errorMessage.textContent = 'Akses kamera ditolak atau tidak tersedia.';
        console.error("Camera access error: ", err);
      }
    });

    captureBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d').drawImage(videoEl, 0, 0);

      canvas.toBlob(blob => {
        const file = new File([blob], "camera-shot.jpg", { type: "image/jpeg" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
      }, 'image/jpeg');

      // Penting: matikan stream kamera setelah selesai
      stream.getTracks().forEach(track => track.stop());
      videoEl.style.display = 'none';
      captureBtn.style.display = 'none';
      openCameraBtn.style.display = 'inline-block';
    });
    // === AKHIR BAGIAN YANG HILANG ===

    // --- Logika untuk Submit Form ---
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      // ... (sisa logika submit form tidak perlu diubah) ...
      const photo = form.photo.files[0];
      if (photo && photo.size > 1000000) {
        errorMessage.textContent = 'Ukuran foto tidak boleh lebih dari 1 MB.';
        return;
      }
      if (!form.checkValidity()) {
        errorMessage.textContent = 'Please fill all required fields correctly.';
        return;
      }
      
      const formData = new FormData(form);
      const submitBtn = document.getElementById('submit-btn');
      submitBtn.textContent = 'Posting...';
      submitBtn.disabled = true;

      try {
        await addStoryHandler(formData);
        alert('Story posted successfully!');
        window.location.hash = '#/';
      } catch (error) {
        errorMessage.textContent = error.message;
      } finally {
        submitBtn.textContent = 'Post to the Verse';
        submitBtn.disabled = false;
      }
    });
  }

  // Saved Stori
renderSavedPage(stories) {
  this._appContent.innerHTML = `
    <h2>Saved Stories</h2>
    <div class="story-list">
      ${stories.length === 0 ? `
        <p style="text-align:center;">Belum ada story yang disimpan.</p>
      ` : stories.map(story => `
        <div class="story-card">
          <img src="${story.photoUrl || story.image || ''}" alt="${story.description}">
          <h3>${story.name || story.author || "Anonim"}</h3>
          <p>${story.description}</p>
          <button class="delete-btn" data-id="${story.id}">Delete</button>
        </div>
      `).join('')}
    </div>
  `;
}
}

export default MainView;