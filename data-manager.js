// DataManager - Abstraction layer for Firebase and LocalStorage
class DataManager {
    constructor() {
        this.mode = null; // 'FIREBASE' or 'LOCAL'
        this.db = null;
        this.listeners = new Map(); // For local storage change listeners
        this.localTasks = [];
        this.collectionName = localStorage.getItem('firebaseCollectionName') || 'tasks';
        this.init();
    }

    init() {
        const configStr = localStorage.getItem('firebaseConfig');

        if (configStr) {
            try {
                const config = JSON.parse(configStr);
                this.initFirebase(config);
            } catch (e) {
                console.error('Invalid Firebase config in localStorage:', e);
                this.mode = 'LOCAL';
                this.loadLocalTasks();
            }
        } else {
            this.mode = 'LOCAL';
            this.loadLocalTasks();
        }
    }

    initFirebase(config) {
        if (!window.firebase) {
            console.error('Firebase SDK not loaded');
            this.mode = 'LOCAL';
            this.loadLocalTasks();
            return;
        }

        try {
            firebase.initializeApp(config);
            this.db = firebase.firestore();
            this.mode = 'FIREBASE';
            console.log('Firebase initialized successfully');
        } catch (e) {
            console.error('Firebase initialization error:', e);
            if (!this.db) {
                try {
                    this.db = firebase.firestore();
                    this.mode = 'FIREBASE';
                } catch (e2) {
                    this.mode = 'LOCAL';
                    this.loadLocalTasks();
                }
            }
        }
    }

    loadLocalTasks() {
        const tasksStr = localStorage.getItem('tasks');
        this.localTasks = tasksStr ? JSON.parse(tasksStr) : [];
    }

    saveLocalTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.localTasks));
        this.notifyLocalListeners();
    }

    notifyLocalListeners() {
        // Trigger all active listeners
        this.listeners.forEach((callback) => {
            callback();
        });
    }

    // Config Management
    saveConfig(configString, collectionName = 'tasks') {
        try {
            const config = JSON.parse(configString);
            localStorage.setItem('firebaseConfig', configString);
            localStorage.setItem('firebaseCollectionName', collectionName);
            window.location.reload();
        } catch (e) {
            throw new Error('Invalid JSON configuration');
        }
    }

    clearConfig() {
        localStorage.removeItem('firebaseConfig');
        localStorage.removeItem('firebaseCollectionName');
        window.location.reload();
    }

    getMode() {
        return this.mode;
    }

    getCollectionName() {
        return this.collectionName;
    }

    // Subscribe to tasks for a specific date
    subscribeToDate(dateStr, callback) {
        if (this.mode === 'FIREBASE') {
            return this.db.collection(this.collectionName)
                .where('date', '==', dateStr)
                .orderBy('createdAt', 'asc')
                .onSnapshot((snapshot) => {
                    const tasks = [];
                    snapshot.forEach((doc) => {
                        tasks.push({ id: doc.id, ...doc.data() });
                    });
                    callback(tasks);
                }, (error) => {
                    console.error("Error getting tasks: ", error);
                    callback([]);
                });
        } else {
            // Local mode
            const listenerId = `date_${dateStr}_${Date.now()}`;
            const localCallback = () => {
                const filtered = this.localTasks.filter(t => t.date === dateStr);
                callback(filtered);
            };

            this.listeners.set(listenerId, localCallback);
            localCallback(); // Initial call

            return () => {
                this.listeners.delete(listenerId);
            };
        }
    }

    // Subscribe to tasks for a date range
    subscribeToRange(startStr, endStr, callback) {
        if (this.mode === 'FIREBASE') {
            return this.db.collection(this.collectionName)
                .where('date', '>=', startStr)
                .where('date', '<=', endStr)
                .onSnapshot((snapshot) => {
                    const tasks = [];
                    snapshot.forEach((doc) => {
                        tasks.push({ id: doc.id, ...doc.data() });
                    });
                    callback(tasks);
                }, (error) => {
                    console.error("Error getting tasks: ", error);
                    callback([]);
                });
        } else {
            // Local mode
            const listenerId = `range_${startStr}_${endStr}_${Date.now()}`;
            const localCallback = () => {
                const filtered = this.localTasks.filter(t =>
                    t.date >= startStr && t.date <= endStr
                );
                callback(filtered);
            };

            this.listeners.set(listenerId, localCallback);
            localCallback(); // Initial call

            return () => {
                this.listeners.delete(listenerId);
            };
        }
    }

    // Add a new task
    async addTask(task) {
        if (this.mode === 'FIREBASE') {
            return this.db.collection(this.collectionName).add({
                ...task,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const newTask = {
                ...task,
                id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: { seconds: Date.now() / 1000 }
            };
            this.localTasks.push(newTask);
            this.saveLocalTasks();
            return Promise.resolve({ id: newTask.id });
        }
    }

    // Update a task
    async updateTask(id, updates) {
        if (this.mode === 'FIREBASE') {
            return this.db.collection(this.collectionName).doc(id).update(updates);
        } else {
            const index = this.localTasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.localTasks[index] = { ...this.localTasks[index], ...updates };
                this.saveLocalTasks();
            }
            return Promise.resolve();
        }
    }

    // Delete a task
    async deleteTask(id) {
        if (this.mode === 'FIREBASE') {
            return this.db.collection(this.collectionName).doc(id).delete();
        } else {
            this.localTasks = this.localTasks.filter(t => t.id !== id);
            this.saveLocalTasks();
            return Promise.resolve();
        }
    }
}

// Create global instance
window.dataManager = new DataManager();
