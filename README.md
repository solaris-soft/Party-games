# Partygames

An app that utilises Cloudflare Durable Objects and Sveltekit running on Cloudflare Pages to provide party games. 

The games:
- [x] Paranoia
- [x] Murder
- [ ] Odds on
- [ ] Truth or drink
- [ ] Money 
- [ ] Would you rather

# Websockets
The Durable Objects act as websocket servers. 

# Getting up and running

## Environment variables
VITE_WS_URL_DEV for the development websocket server url (localhost:8787)
VITE_WS_URL_PROD for the production server url 

## Frontend

cd into frontend folder

bun i

bun run dev

## Backend

another terminal, cd into backend folder

If on nix, run nix-shell.

bun i

bun run dev


