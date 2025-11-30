/*
 * Copyright (C) 2025 Connor Nolan connor@cnolandev.com
 *
 * This file is part of the Semikit project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Project data structure for storage
 */
export interface ProjectData {
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tiles: string[]; // Array of Base64 encoded planar data (32 bytes each)
  activeTileIndex?: number; // Index of the active tile (optional, defaults to 0)
  palette: {
    binary: string; // Base64 encoded RGB555 data
  };
}

/**
 * Storage - IndexedDB wrapper for project persistence
 *
 * Provides simple async API for saving and loading project data.
 */
export class Storage {
  private static readonly DB_NAME = "SemitileDB";
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = "projects";

  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(Storage.DB_NAME, Storage.DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(Storage.STORE_NAME)) {
          const objectStore = db.createObjectStore(Storage.STORE_NAME, {
            keyPath: "name",
          });
          objectStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
    });
  }

  /**
   * Save a project
   */
  async saveProject(data: ProjectData): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [Storage.STORE_NAME],
        "readwrite"
      );
      const store = transaction.objectStore(Storage.STORE_NAME);

      // Update timestamp
      data.updatedAt = new Date().toISOString();

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error("Failed to save project"));
    });
  }

  /**
   * Load a project by name
   */
  async loadProject(name: string): Promise<ProjectData | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([Storage.STORE_NAME], "readonly");
      const store = transaction.objectStore(Storage.STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () =>
        reject(new Error("Failed to load project"));
    });
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectData[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([Storage.STORE_NAME], "readonly");
      const store = transaction.objectStore(Storage.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by updatedAt descending (most recent first)
        const projects = request.result || [];
        projects.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(projects);
      };

      request.onerror = () =>
        reject(new Error("Failed to list projects"));
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(name: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [Storage.STORE_NAME],
        "readwrite"
      );
      const store = transaction.objectStore(Storage.STORE_NAME);
      const request = store.delete(name);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error("Failed to delete project"));
    });
  }

  /**
   * Check if a project exists
   */
  async projectExists(name: string): Promise<boolean> {
    const project = await this.loadProject(name);
    return project !== null;
  }
}

/**
 * Global storage instance
 */
let storageInstance: Storage | null = null;

/**
 * Get the global storage instance
 */
export async function getStorage(): Promise<Storage> {
  if (!storageInstance) {
    storageInstance = new Storage();
    await storageInstance.init();
  }
  return storageInstance;
}
