# Real-Time Snake Game Controller Application with Node.js, Express, and Socket.IO

This repository contains the source code for a real-time game controller application built with Node.js, Express, and Socket.IO. It demonstrates real-time communication between a server and clients, utilizing device orientation for control inputs and providing a visual feedback mechanism via a web interface.

User is able to control the snake in the game using either gyroscope controls or button controls. The game state and score are updated in real-time across all connected clients.

## Features

- Real-time control method selection (Gyroscope or Button controls).
- Dynamic visual feedback for gyroscope controls using device orientation data.
- Real-time score updates and game state management across clients.
- Responsive design for both desktop and mobile devices.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (version 12.x or later recommended)
- [npm](https://www.npmjs.com/) (normally comes with Node.js)

### Installation

1. Clone the repository to your local machine:

```bash
git clone https://github.com/your-github-username/your-repository-name.git
```

2. Navigate to the project root directory:

```bash
cd your-repository-name
```

3. Install the project dependencies:

```bash
npm install
```

### Running the Application

To run the application, execute the following command:

```bash
npm start
```

The application will be accessible at `https://localhost:443` by default.

