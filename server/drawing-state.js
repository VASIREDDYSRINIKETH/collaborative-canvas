// Keeps track of the canvas history
// Separation allows for easier unit testing
class DrawingState {
    constructor() {
        this.operations = [];
        this.undoStack = [];
    }

    addOperation(op) {
        this.operations.push(op);
        // Clean redo stack relative to this user to prevent inconsistencies
        // In a shared whiteboard, standard behavior is usually to clear 
        // the specific user's redo history if they diverge.
        this.undoStack = this.undoStack.filter(o => o.userId !== op.userId);
    }

    undo(userId) {
        // Reverse search to find the last non-deleted action by this specific user
        for (let i = this.operations.length - 1; i >= 0; i--) {
            const op = this.operations[i];
            if (op.userId === userId && !op.deleted) {
                op.deleted = true;
                this.undoStack.push(op);
                return true; // Signal that a change occurred
            }
        }
        return false;
    }

    redo(userId) {
        // Find last undone action by this user
        const index = this.undoStack.map(op => op.userId).lastIndexOf(userId);
        if (index !== -1) {
            const op = this.undoStack.splice(index, 1)[0];
            op.deleted = false;
            return true;
        }
        return false;
    }

    clearAll() {
        this.operations = [];
        this.undoStack = [];
    }

    getOperations() {
        return this.operations;
    }
}

module.exports = new DrawingState();