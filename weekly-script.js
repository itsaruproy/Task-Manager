document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentWeekDisplay = document.getElementById('current-week-display');
    const weekRangeDisplay = document.getElementById('week-range-display');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const thisWeekBtn = document.getElementById('this-week-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const tabBtns = document.querySelectorAll('.tab-btn');

    const countCompleted = document.getElementById('count-completed');
    const countInProgress = document.getElementById('count-in-progress');
    const countNotStarted = document.getElementById('count-not-started');

    // State
    let currentViewDate = new Date();
    let unsubscribe = null;
    let weeklyTasks = [];
    let activeTab = 'Completed';

    // Initialize
    init();

    function init() {
        updateDateDisplay();
        subscribeToWeekTasks();

        // Event Listeners
        prevWeekBtn.addEventListener('click', () => changeWeek(-7));
        nextWeekBtn.addEventListener('click', () => changeWeek(7));
        thisWeekBtn.addEventListener('click', () => jumpToThisWeek());

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeTab = btn.dataset.tab;
                renderTasks();
            });
        });
    }

    // Date Management
    function getWeekRange(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    function getFormattedDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isSameWeek(d1, d2) {
        const w1 = getWeekRange(d1);
        const w2 = getWeekRange(d2);
        return w1.start.toDateString() === w2.start.toDateString();
    }

    function updateDateDisplay() {
        const { start, end } = getWeekRange(currentViewDate);
        const options = { month: 'short', day: 'numeric' };

        if (isSameWeek(currentViewDate, new Date())) {
            currentWeekDisplay.textContent = 'This Week';
            thisWeekBtn.classList.add('hidden');
        } else {
            currentWeekDisplay.textContent = 'Weekly View';
            thisWeekBtn.classList.remove('hidden');
        }

        const startStr = start.toLocaleDateString('en-US', options);
        const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });
        weekRangeDisplay.textContent = `${startStr} - ${endStr}`;
    }

    function changeWeek(days) {
        currentViewDate.setDate(currentViewDate.getDate() + days);
        updateDateDisplay();
        subscribeToWeekTasks();
    }

    function jumpToThisWeek() {
        currentViewDate = new Date();
        updateDateDisplay();
        subscribeToWeekTasks();
    }

    // Data Integration via DataManager
    function subscribeToWeekTasks() {
        if (unsubscribe) {
            unsubscribe();
        }

        const { start, end } = getWeekRange(currentViewDate);
        const startStr = getFormattedDateString(start);
        const endStr = getFormattedDateString(end);

        unsubscribe = window.dataManager.subscribeToRange(startStr, endStr, (fetchedTasks) => {
            weeklyTasks = fetchedTasks;

            // Sort by date then created time
            weeklyTasks.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
            });

            updateStats();
            renderTasks();
        });
    }

    // UI Rendering
    function updateStats() {
        const completed = weeklyTasks.filter(t => t.status === 'Completed').length;
        const inProgress = weeklyTasks.filter(t => t.status === 'In Progress').length;
        const notStarted = weeklyTasks.filter(t => t.status === 'Not Started').length;

        countCompleted.textContent = completed;
        countInProgress.textContent = inProgress;
        countNotStarted.textContent = notStarted;
    }

    function renderTasks() {
        taskList.innerHTML = '';

        const filteredTasks = weeklyTasks.filter(t => t.status === activeTab);

        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.status === 'Completed' ? 'completed' : ''}`;

            const dateObj = new Date(task.date + 'T00:00:00');
            const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            li.innerHTML = `
                <span class="task-name">${escapeHtml(task.text)}</span>
                <span class="task-date">${dateDisplay}</span>
                <div class="task-status">
                    <span class="status-tag status-${task.status.toLowerCase().replace(' ', '-')}">
                        ${task.status}
                    </span>
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
});
