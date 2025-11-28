document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const currentDateDisplay = document.getElementById('current-date-display');
    const currentFullDate = document.getElementById('current-full-date');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const remainingCountEl = document.getElementById('remaining-count');
    const emptyState = document.getElementById('empty-state');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const todayBtn = document.getElementById('today-btn');

    // Settings Modal Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveConfigBtn = document.getElementById('save-config-btn');
    const clearConfigBtn = document.getElementById('clear-config-btn');
    const configInput = document.getElementById('config-input');
    const configError = document.getElementById('config-error');
    const currentModeSpan = document.getElementById('current-mode');

    // State
    let currentViewDate = new Date();
    let unsubscribe = null;
    let tasks = [];

    // Constants
    const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
    const STATUS_CLASSES = {
        'Not Started': 'status-not-started',
        'In Progress': 'status-in-progress',
        'Completed': 'status-completed'
    };

    // Initialize
    init();

    function init() {
        // DataManager is already initialized globally
        updateModeDisplay();
        updateDateDisplay();
        subscribeToTasks();

        // Event Listeners
        prevDayBtn.addEventListener('click', () => changeDate(-1));
        nextDayBtn.addEventListener('click', () => changeDate(1));
        todayBtn.addEventListener('click', () => jumpToToday());

        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask(taskInput.value);
            }
        });

        // Settings Modal Listeners
        settingsBtn.addEventListener('click', openSettings);

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeSettings();
            });
        }

        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', saveConfig);
        }

        if (clearConfigBtn) {
            clearConfigBtn.addEventListener('click', clearConfig);
        }

        // Prevent clicks inside modal content from closing modal
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Close modal on outside click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });
    }

    const collectionInput = document.getElementById('collection-input');

    // Settings Modal Functions
    function openSettings() {
        const existingConfig = localStorage.getItem('firebaseConfig');
        if (existingConfig) {
            configInput.value = JSON.stringify(JSON.parse(existingConfig), null, 2);
        } else {
            configInput.value = '';
        }

        // Load current collection name
        const currentCollection = window.dataManager.getCollectionName();
        if (collectionInput) {
            collectionInput.value = currentCollection;
        }

        updateModeDisplay();
        configError.classList.add('hidden');
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    function saveConfig() {
        const configStr = configInput.value.trim();
        const collectionName = collectionInput ? collectionInput.value.trim() : 'tasks';

        if (!configStr) {
            showError('Please enter a configuration or click "Clear & Use Local Storage"');
            return;
        }

        try {
            window.dataManager.saveConfig(configStr, collectionName || 'tasks');
            // Page will reload after save
        } catch (e) {
            showError(e.message);
        }
    }

    function clearConfig() {
        if (confirm('This will clear your Firebase configuration and use local storage. Continue?')) {
            window.dataManager.clearConfig();
            // Page will reload after clear
        }
    }

    function updateModeDisplay() {
        const mode = window.dataManager.getMode();
        currentModeSpan.textContent = mode;
        currentModeSpan.style.color = mode === 'FIREBASE' ? '#1c3829' : '#323031';
    }

    function showError(message) {
        configError.textContent = message;
        configError.classList.remove('hidden');
    }

    // Date Management
    function getFormattedDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        if (isToday(currentViewDate)) {
            currentDateDisplay.textContent = 'Today';
            todayBtn.classList.add('hidden');
        } else {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (currentViewDate.toDateString() === tomorrow.toDateString()) {
                currentDateDisplay.textContent = 'Tomorrow';
            } else if (currentViewDate.toDateString() === yesterday.toDateString()) {
                currentDateDisplay.textContent = 'Yesterday';
            } else {
                currentDateDisplay.textContent = currentViewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            todayBtn.classList.remove('hidden');
        }

        currentFullDate.textContent = currentViewDate.toLocaleDateString('en-US', options);
    }

    function changeDate(offset) {
        currentViewDate.setDate(currentViewDate.getDate() + offset);
        updateDateDisplay();
        subscribeToTasks();
    }

    function jumpToToday() {
        currentViewDate = new Date();
        updateDateDisplay();
        subscribeToTasks();
    }

    // Data Integration via DataManager
    function subscribeToTasks() {
        if (unsubscribe) {
            unsubscribe();
        }

        const dateString = getFormattedDateString(currentViewDate);

        unsubscribe = window.dataManager.subscribeToDate(dateString, (fetchedTasks) => {
            tasks = fetchedTasks;
            renderTasks();
            updateStats();
        });
    }

    function addTask(text) {
        if (!text.trim()) return;

        const dateString = getFormattedDateString(currentViewDate);

        window.dataManager.addTask({
            text: text,
            status: 'Not Started',
            date: dateString
        })
            .then(() => {
                taskInput.value = '';
            })
            .catch((error) => {
                console.error("Error adding task: ", error);
            });
    }

    function deleteTask(id) {
        window.dataManager.deleteTask(id)
            .catch((error) => {
                console.error("Error removing task: ", error);
            });
    }

    function cycleStatus(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const currentIndex = STATUS_OPTIONS.indexOf(task.status);
            const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
            const newStatus = STATUS_OPTIONS[nextIndex];

            window.dataManager.updateTask(id, { status: newStatus })
                .catch((error) => {
                    console.error("Error updating status: ", error);
                });
        }
    }

    // UI Rendering
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const remaining = total - completed;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
        remainingCountEl.textContent = remaining;

        if (total === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.status === 'Completed' ? 'completed' : ''}`;

            li.innerHTML = `
                <span class="task-name">${escapeHtml(task.text)}</span>
                <div class="task-status">
                    <span class="status-tag ${STATUS_CLASSES[task.status]}" onclick="window.cycleStatus('${task.id}')">
                        ${task.status}
                    </span>
                </div>
                <div class="task-actions">
                    <button class="delete-btn" onclick="window.deleteTask('${task.id}')">×</button>
                </div>
            `;

            taskList.appendChild(li);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose functions to window for onclick handlers
    window.deleteTask = deleteTask;
    window.cycleStatus = cycleStatus;
});
