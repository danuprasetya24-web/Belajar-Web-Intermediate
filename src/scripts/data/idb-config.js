// src/scripts/data/idb-config.js
import { openDB } from 'idb';

const DB_NAME = 'story-well-db';
const DB_VERSION = 1;
const STORY_STORE = 'stories';
const OFFLINE_STORE = 'offline-stories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORY_STORE)) {
      db.createObjectStore(STORY_STORE, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
      db.createObjectStore(OFFLINE_STORE, { keyPath: 'tempId', autoIncrement: true });
    }
  },
});

const StoryDB = {
  // simpan semua story dari API
  async putStories(stories = []) {
    const db = await dbPromise;
    const tx = db.transaction(STORY_STORE, 'readwrite');
    await tx.store.clear();
    stories.forEach((story) => {
      tx.store.put(story);
    });
    await tx.done;
  },

  async getAllStories() {
    const db = await dbPromise;
    return db.getAll(STORY_STORE);
  },

  // ===== Offline Queue =====
  async addOfflineStory(storyPayload) {
    const db = await dbPromise;
    return db.add(OFFLINE_STORE, storyPayload);
  },

  async getAllOfflineStories() {
    const db = await dbPromise;
    return db.getAll(OFFLINE_STORE);
  },

  async deleteOfflineStory(tempId) {
    const db = await dbPromise;
    return db.delete(OFFLINE_STORE, tempId);
  },
}

// Saved Stories
const SAVED_DB = 'saved-story-db';
const SAVED_STORE = 'saved-stories';

const savedDBPromise = openDB(SAVED_DB, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(SAVED_STORE)) {
      db.createObjectStore(SAVED_STORE, { keyPath: 'id' });
    }
  },
});

export const SavedDB = {
  async addStory(story) {
    return (await savedDBPromise).put(SAVED_STORE, story);
  },
  async deleteStory(id) {
    return (await savedDBPromise).delete(SAVED_STORE, id);
  },
  async getAllStories() {
    return (await savedDBPromise).getAll(SAVED_STORE);
  },
  async getStoryById(id) {
    return (await savedDBPromise).get(SAVED_STORE, id);
  }
};

export default StoryDB;
export { STORY_STORE, OFFLINE_STORE };
