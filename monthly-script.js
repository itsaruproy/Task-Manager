document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentMonthDisplay = document.getElementById('current-month-display');
    const monthRangeDisplay = document.getElementById('month-range-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const thisMonthBtn = document.getElementById('this-month-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const tabBtns = document.querySelectorAll('.tab-btn');

    const countCompleted = document.getElementById('count-completed');
    const countInProgress = document.getElementById('count-in-progress');
    const countNotStarted = document.getElementById('count-not-started');

    // State
    let currentViewDate = new Date();
    let unsubscribe = null;
    let monthlyTasks = [];
    let activeTab = 'Completed';

    // Initialize
    init();

    function init() {
        currentViewDate.setDate(1);

        updateDateDisplay();
        subscribeToMonthTasks();

        // Event Listeners
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        thisMonthBtn.addEventListener('click', () => jumpToThisMonth());

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
    function getMonthRange(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        return { start, end };
    }

    function getFormattedDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isSameMonth(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    }

    function updateDateDisplay() {
        const options = { month: 'long', year: 'numeric' };

        if (isSameMonth(currentViewDate, new Date())) {
            currentMonthDisplay.textContent = 'This Month';
            thisMonthBtn.classList.add('hidden');
        } else {
            currentMonthDisplay.textContent = 'Monthly View';
            thisMonthBtn.classList.remove('hidden');
        }

        monthRangeDisplay.textContent = currentViewDate.toLocaleDateString('en-US', options);
    }

    function changeMonth(offset) {
        currentViewDate.setMonth(currentViewDate.getMonth() + offset);
        updateDateDisplay();
        subscribeToMonthTasks();
    }

    function jumpToThisMonth() {
        currentViewDate = new Date();
        currentViewDate.setDate(1);
        updateDateDisplay();
        subscribeToMonthTasks();
    }

    // Data Integration via DataManager
    function subscribeToMonthTasks() {
        if (unsubscribe) {
            unsubscribe();
        }

        const { start, end } = getMonthRange(currentViewDate);
        const startStr = getFormattedDateString(start);
        const endStr = getFormattedDateString(end);

        unsubscribe = window.dataManager.subscribeToRange(startStr, endStr, (fetchedTasks) => {
            monthlyTasks = fetchedTasks;

            // Sort by date then created time
            monthlyTasks.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
            });

            updateStats();
            renderTasks();
        });
    }

    // UI Rendering
    function updateStats() {
        const completed = monthlyTasks.filter(t => t.status === 'Completed').length;
        const inProgress = monthlyTasks.filter(t => t.status === 'In Progress').length;
        const notStarted = monthlyTasks.filter(t => t.status === 'Not Started').length;

        countCompleted.textContent = completed;
        countInProgress.textContent = inProgress;
        countNotStarted.textContent = notStarted;
    }

    function renderTasks() {
        taskList.innerHTML = '';

        const filteredTasks = monthlyTasks.filter(t => t.status === activeTab);

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
