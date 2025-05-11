# 🎮 Partygames

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

A modern web application that brings the fun of party games to your browser! Built with SvelteKit and powered by Cloudflare's infrastructure, this platform offers a seamless multiplayer gaming experience.

## 🎲 Available Games

| Game | Status | Description |
|------|--------|-------------|
| Paranoia | ✅ | A game of secrets and revelations |
| Murder | ✅ | Classic murder mystery party game |
| Odds on | ✅ | Test your luck and intuition |
| Ultimate cup | 🚧 | Coming soon |
| Money | 🚧 | Coming soon |
| Would you rather | 🚧 | Coming soon |

## 🏗️ Architecture

### Backend
- **Cloudflare Durable Objects**: Serve as WebSocket servers and manage game state
- **Real-time Communication**: Seamless player synchronization
- **Scalable Infrastructure**: Built on Cloudflare's edge network

### Frontend
- **SvelteKit**: Modern, fast, and reactive UI
- **Unique Game Sessions**: Each game gets a dedicated Durable Object instance
- **Responsive Design**: Play on any device

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) package manager
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/) (for local development)

### Environment Setup
Create a `.env` file in the frontend directory with:
```env
VITE_WS_URL_DEV=http://localhost:8787
```

### Development

#### Frontend
```bash
cd frontend
bun install
bun run dev
```

#### Backend
```bash
cd backend
# If using Nix
nix-shell
bun install
bun run dev
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


