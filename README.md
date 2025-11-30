# 🧠 10XMind-Play

**10XMind-Play** is a comprehensive cognitive training platform designed to assess and strengthen memory, attention, processing speed, and cognitive flexibility through scientifically-grounded interactive tasks.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## ✨ Features

### 🎮 Cognitive Games
The platform features a suite of interactive psychological assessments:

-   **🌈 Stroop Task**: Measures selective attention and cognitive interference.
-   **↔️ Flanker Task**: Assesses ability to suppress irrelevant information.
-   **👈 Simon Task**: Tests spatial stimulus-response compatibility.
-   **🔢 Digit Span Task**: Measures verbal working memory capacity.
-   **🧊 Corsi Block Task**: Assesses visuospatial working memory.
-   **🗼 Tower of Hanoi**: Evaluates planning and problem-solving ability.
-   **🧠 N-Back Task**: Challenges working memory and updating.
-   **🛣️ Trail Making Test**: Tests visual attention and task switching.
-   **🎧 Dichotic Listening**: Assesses selective auditory attention.
-   **🔄 Mental Rotation**: Tests spatial visualization ability.
-   **🛑 SART**: Sustained Attention to Response Task.

### 👥 User Roles
-   **Students**: Access to all games, personal dashboard, and performance tracking.
-   **Admins**: Dedicated dashboard to monitor student progress, view analytics, and manage data.

### � Analytics & Dashboard
-   Real-time performance metrics (Accuracy, Reaction Time).
-   Visual charts and progress tracking.
-   Dark/Light mode support for comfortable viewing.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite.
-   **State Management**: React Context API.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   Node.js (v16 or higher)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Mothilal-hire10x/10XMind-Play.git
    cd 10XMind-Play
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

### Database Setup

Before running the server, initialize the database:

```bash
# Inside the server directory
npm run migrate
npm run seed
```

### Running the Application

1.  **Start the Backend Server**
    Open a terminal and run:
    ```bash
    cd server
    npm run dev
    ```

2.  **Start the Frontend Development Server**
    Open a new terminal and run:
    ```bash
    npm run dev
    ```
    *The application will be available at `http://localhost:3700`.*

### Docker Compose (development)

If you'd like to run frontend and backend in development mode using Docker, there are two compose files included:

- `docker-compose.backend.yml` — runs the backend dev server (ts-node-dev) and mounts `./server` and `./server/data`.
- `docker-compose.frontend.yml` — runs the frontend dev server (vite) and mounts the project root.

Examples:

Start backend in Docker:
```bash
docker compose -f docker-compose.backend.yml up --build
```

Start frontend in Docker:
```bash
docker compose -f docker-compose.frontend.yml up --build
```

You can also run both services together if you want them on the same network (two terminals):
```bash
docker compose -f docker-compose.backend.yml up --build
docker compose -f docker-compose.frontend.yml up --build
```

Notes:
- The backend will expose port `3701` and the frontend `3700`.
- We mount `/app/node_modules` as an anonymous volume to avoid overwriting dependencies installed inside the container.
- The backend uses a mounted `./server/data` directory so your SQLite database persists between runs.

## 📂 Project Structure

```
10XMind-Play/
├── src/
│   ├── components/      # React components (Games, UI, Dashboards)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, API clients, Contexts
│   ├── styles/          # Global styles
│   ├── App.tsx          # Main Application component
│   └── main.tsx         # Entry point
├── server/
│   ├── src/             # Backend source code
│   ├── database.sqlite  # SQLite database
│   └── package.json     # Backend dependencies
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

