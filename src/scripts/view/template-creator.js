const createStoryCardTemplate = (story) => `
  <article class="card story-card">
    <img src="${story.photoUrl}" alt="${story.description.substring(0, 50)}...">
    <h3>${story.name}</h3>
    <p>${story.description}</p>
    <div class="story-meta">
      <small class="story-date">
          Dibuat pada: ${new Date(story.createdAt).toLocaleString('id-ID')}
      </small>
      
      ${story.lat && story.lon ? `
        <small class="story-location">
          Lokasi: ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
        </small>
      ` : ''}
      </div>
      <div class="story-actions">
        <button class="save-btn" data-id="${story.id}">💾 Save</button>
        <button class="delete-btn" data-id="${story.id}">🗑 Delete</button>
      </div>
  </article>
`;

const createDashboardTemplate = (userName) => `
  <div class="dashboard-grid">
    <section id="story-list-container" class="story-list" aria-labelledby="stories-heading">
      <h2 id="stories-heading" class="logo">Latest Stories for ${userName}</h2>
      <div id="story-list">
        <p>Loading stories from the Verse...</p>
      </div>
    </section>
    <aside class="map-container" id="map-container" aria-label="Stories Location Map"></aside>
  </div>
`;

const createLoginPageTemplate = () => `
  <div class="card" style="max-width: 500px; margin: 2rem auto;">
    <h2 class="logo">Login to Story Well</h2>
    <form id="login-form">
      <label for="email">Email</label>
      <input type="email" id="email" required>
      <label for="password">Password</label>
      <input type="password" id="password" required>
      <button type="submit" style="margin-top: 1.5rem;">Login</button>
      <p id="login-error" style="color: red;"></p>
      <p style="margin-top: 1rem; text-align: center;">
        Belum punya akun? <a href="#/register">Daftar di sini</a>
      </p>
    </form>
  </div>
`;

const createRegisterPageTemplate = () => `
  <div class="card" style="max-width: 500px; margin: 2rem auto;">
    <h2 class="logo">Create Account</h2>
    <form id="register-form">
      <label for="name">Name</label>
      <input type="text" id="name" required>
      <label for="email">Email</label>
      <input type="email" id="email" required>
      <label for="password">Password (min. 8 characters)</label>
      <input type="password" id="password" required minlength="8">
      <button type="submit" style="margin-top: 1.5rem;">Register</button>
      <p id="register-error" style="color: red;"></p>
    </form>
  </div>
`;

const createAddStoryPageTemplate = () => `
  <h2 class="logo">Post New Story</h2>
  <form id="add-story-form" class="card" novalidate>
    <div class="form-grid">
      <div>
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="5" required minlength="10"></textarea>
        <label for="photo">Upload Photo</label>
        <input type="file" id="photo" name="photo" accept="image/*" required>
        <div class="camera-container" style="margin-top: 1rem;">
          <video id="camera-preview" autoplay playsinline style="display:none;"></video>
          <button type="button" id="open-camera-btn">Use Camera</button>
          <button type="button" id="capture-btn" style="display:none;">Capture Photo</button>
        </div>
      </div>
      <div>
        <p>Click on the map to select story location</p>
        <div id="map-picker" class="map-container" style="height: 300px;"></div>
        <input type="hidden" id="lat" name="lat" required>
        <input type="hidden" id="lon" name="lon" required>
      </div>
    </div>
    <button type="submit" id="submit-btn" style="margin-top: 1rem; width: 100%;">Post to the Verse</button>
    <p id="error-message" style="color: red; margin-top: 1rem;"></p>
  </form>
`;





export {
  createStoryCardTemplate,
  createDashboardTemplate,
  createLoginPageTemplate,
  createRegisterPageTemplate,
  createAddStoryPageTemplate,
};