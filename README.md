# Rentz - Multiplayer Card Game

A real-time multiplayer web implementation of Rentz, a Romanian trick-taking card game.

## Features
- Room-based matchmaking with join codes
- Supports 5-6 players
- All four contracts: Rentz, Red Pope, Diamonds, Totals
- Blind contract multipliers
- Real-time gameplay with Socket.io

## Tech Stack
- **Backend:** Node.js, Express, Socket.io
- **Frontend:** HTML, CSS, Vanilla JavaScript

## How to Run
1. Clone the repo
2. Run `npm install`
3. Run `node server.js`
4. Open `http://localhost:3000` in your browser

## Game Rules
- Each player chooses one of four contracts per round
- Contracts can be chosen blindly for double points/penalties
- Game ends after all players have chosen all four contracts