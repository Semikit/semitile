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
 * Event listener callback function type
 */
export type EventListener<T = any> = (data: T) => void;

/**
 * EventEmitter base class for observable Models
 *
 * Provides a simple observer pattern implementation for Models to
 * notify Views when state changes.
 *
 * Usage:
 * ```typescript
 * class MyModel extends EventEmitter {
 *   private value: number = 0;
 *
 *   setValue(newValue: number) {
 *     this.value = newValue;
 *     this.emit('valueChanged', { value: newValue });
 *   }
 * }
 *
 * const model = new MyModel();
 * model.on('valueChanged', (data) => {
 *   console.log('Value changed to:', data.value);
 * });
 * ```
 */
export class EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Register an event listener
   *
   * @param event - Event name to listen for
   * @param callback - Function to call when event is emitted
   */
  on<T = any>(event: string, callback: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventListener);
  }

  /**
   * Unregister an event listener
   *
   * @param event - Event name to stop listening for
   * @param callback - Function to remove
   */
  off<T = any>(event: string, callback: EventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventListener);

      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Register a one-time event listener
   *
   * The listener will be automatically removed after being called once.
   *
   * @param event - Event name to listen for
   * @param callback - Function to call when event is emitted
   */
  once<T = any>(event: string, callback: EventListener<T>): void {
    const onceCallback: EventListener<T> = (data: T) => {
      this.off(event, onceCallback);
      callback(data);
    };
    this.on(event, onceCallback);
  }

  /**
   * Emit an event to all registered listeners
   *
   * @param event - Event name to emit
   * @param data - Optional data to pass to listeners
   */
  protected emit<T = any>(event: string, data?: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy of the set to avoid issues if listeners modify the set during iteration
      const listenersCopy = Array.from(eventListeners);
      listenersCopy.forEach((callback) => callback(data));
    }
  }

  /**
   * Remove all listeners for a specific event, or all listeners if no event specified
   *
   * @param event - Optional event name to clear listeners for
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for a specific event
   *
   * @param event - Event name to count listeners for
   * @returns Number of registered listeners
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names that have listeners
   *
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
