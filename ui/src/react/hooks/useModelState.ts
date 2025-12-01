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

import { useEffect, useState } from "react";
import type { EventEmitter } from "../../models/EventEmitter.js";

/**
 * Custom React hook that synchronizes Model state with React component state
 *
 * This hook listens to Model events and triggers re-renders when the Model changes.
 * It automatically subscribes and unsubscribes from Model events based on component lifecycle.
 *
 * @param model - The Model instance to observe (must extend EventEmitter)
 * @param events - Array of event names to listen to
 * @returns A counter that increments on each Model change (to trigger re-renders)
 *
 * @example
 * ```tsx
 * const MyComponent = ({ tileModel }) => {
 *   // Re-render whenever tileModel emits 'pixelChanged' or 'tileCleared'
 *   useModelState(tileModel, ['pixelChanged', 'tileCleared']);
 *
 *   // Now we can safely read from the model - React will re-render on changes
 *   const pixel = tileModel.getPixel(0, 0);
 *
 *   return <div>Pixel value: {pixel}</div>;
 * };
 * ```
 */
export function useModelState(model: EventEmitter | null, events: string[]): number {
  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    if (!model) return;

    // Handler that triggers re-render by updating counter
    const handleModelChange = () => {
      setUpdateCounter((prev) => prev + 1);
    };

    // Subscribe to all specified events
    events.forEach((event) => {
      model.on(event, handleModelChange);
    });

    // Cleanup: unsubscribe from all events
    return () => {
      events.forEach((event) => {
        model.off(event, handleModelChange);
      });
    };
  }, [model, events]);

  return updateCounter;
}
