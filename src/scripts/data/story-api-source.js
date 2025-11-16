const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryApiSource {
  static getAuthToken() {
    return sessionStorage.getItem('authToken');
  }

  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (result.error) {
        throw new Error(result.message);
      }
      return result.loginResult;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (result.error) {
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  static async getStories() {
    const token = this.getAuthToken();
    if (!token) {
      console.warn("No auth token found. Redirecting to login.");
      window.location.hash = '#/login';
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        window.location.hash = '#/login';
        return [];
      }

      const data = await response.json();
      if (data.error) throw new Error(data.message);
      return data.listStory;
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      return [];
    }
  }

  static async postStory(formData) {
    const token = this.getAuthToken();
    if (!token) {
      console.warn("No auth token found. Redirecting to login.");
      window.location.hash = '#/login';
      throw new Error("You must be logged in to post a story.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      console.error("Error posting story:", error);
      throw error;
    }
    }
  }

export default StoryApiSource;