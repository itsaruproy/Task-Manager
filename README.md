# Task Manager

A modern, flexible task management application designed to help you organize your daily life. It features a clean interface with daily, weekly, and monthly views, and supports both local offline storage and real-time cloud synchronization via Firebase.

## Features

*   **Multiple Views**: Seamlessly switch between **Daily**, **Weekly**, and **Monthly** views to plan your schedule effectively.
*   **Task Management**: Easily add, update, and delete tasks.
*   **Progress Tracking**: Visual progress bars and counters keep you motivated by showing your completion rate for the day.
*   **Smart Navigation**: Jump to specific dates or quickly return to "Today".
*   **Hybrid Storage System**:
    *   **Local Mode**: Works out of the box using your browser's LocalStorage. No setup required.
    *   **Cloud Mode**: Syncs your tasks across multiple devices using Google Firebase.
*   **Custom Collections**: Organize tasks into different lists (e.g., "personal", "work") by specifying custom collection names in the settings.
*   **Responsive Design**: A clean, Notion-inspired interface that looks great on desktop and mobile.

## Getting Started

### Prerequisites

No special installation is required as this is a static web application. You just need a modern web browser.

### Installation

1.  Clone this repository or download the source code.
2.  Open the project folder.
3.  Double-click `index.html` to open the application in your browser.

## Configuration

The application comes with a built-in configuration manager that allows you to switch between Local and Cloud storage modes without touching the code.

### Setting up Cloud Sync (Firebase)

To enable real-time synchronization across devices:

1.  **Create a Firebase Project**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Create a new project.
    *   Enable **Cloud Firestore** in the "Build" section.
    *   Create a web app in the project settings.

2.  **Get Configuration**:
    *   In your Firebase Project Settings, scroll down to "Your apps".
    *   Select "Config" to see your configuration object. It looks like this:
        ```json
        {
          "apiKey": "AIzaSy...",
          "authDomain": "your-project.firebaseapp.com",
          "projectId": "your-project-id",
          "storageBucket": "your-project.firebasestorage.app",
          "messagingSenderId": "...",
          "appId": "..."
        }
        ```

3.  **Configure the App**:
    *   Open the Task Manager application in your browser.
    *   Click the **Settings (Gear)** icon in the top-left corner.
    *   Paste your Firebase configuration JSON into the text area.
    *   (Optional) Enter a **Collection Name** (default is `tasks`). You can use this to separate different lists (e.g., use `work_tasks` for work items).
    *   Click **Save Configuration**.

The app will reload and immediately start syncing with your Firebase database.

### Switching Back to Local Storage

To revert to offline mode:
1.  Open the **Settings** menu.
2.  Click **Clear & Use Local Storage**.
3.  The app will reload and use your browser's local storage again.

## Usage

*   **Adding Tasks**: Type your task in the input field and press Enter or click the `+` button.
*   **Completing Tasks**: Click the status dropdown or checkbox to mark a task as "Done".
*   **Navigation**: Use the arrows to move between days/weeks/months.
*   **Views**: Use the links in the header to switch between Daily, Weekly, and Monthly overviews.

## Tech Stack

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript
*   **Styling**: Custom CSS with CSS Variables for theming
*   **Database**: Google Firebase Firestore (Cloud) / LocalStorage (Offline)
*   **Fonts**: Inter (via Google Fonts)
