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

import { EventEmitter } from "./EventEmitter.js";

/**
 * Command interface - all commands must implement execute() and undo()
 */
export interface Command {
  execute(): void;
  undo(): void;
  getDescription(): string;
}

/**
 * CommandHistory - Manages undo/redo stacks using the Command pattern
 *
 * This class maintains two stacks:
 * - undoStack: Commands that can be undone
 * - redoStack: Commands that can be redone
 *
 * When a new command is executed, the redo stack is cleared.
 *
 * Usage:
 * ```typescript
 * const history = new CommandHistory();
 *
 * // Execute a command
 * history.executeCommand(new SetPixelCommand(...));
 *
 * // Undo
 * history.undo();
 *
 * // Redo
 * history.redo();
 * ```
 */
export class CommandHistory extends EventEmitter {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize: number = 100;

  /**
   * Execute a command and add it to the undo stack
   */
  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);

    // Clear redo stack when new command is executed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.emit("historyChanged", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    console.log(`[CommandHistory] Executed: ${command.getDescription()}`);
  }

  /**
   * Undo the last command
   */
  undo(): void {
    if (!this.canUndo()) {
      console.warn("[CommandHistory] Cannot undo - no commands in undo stack");
      return;
    }

    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);

    this.emit("historyChanged", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    console.log(`[CommandHistory] Undid: ${command.getDescription()}`);
  }

  /**
   * Redo the last undone command
   */
  redo(): void {
    if (!this.canRedo()) {
      console.warn("[CommandHistory] Cannot redo - no commands in redo stack");
      return;
    }

    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);

    this.emit("historyChanged", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    console.log(`[CommandHistory] Redid: ${command.getDescription()}`);
  }

  /**
   * Check if there are commands to undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if there are commands to redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];

    this.emit("historyChanged", {
      canUndo: false,
      canRedo: false,
    });

    console.log("[CommandHistory] History cleared");
  }

  /**
   * Get the size of the undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Set the maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);

    // Trim undo stack if needed
    while (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }
}
