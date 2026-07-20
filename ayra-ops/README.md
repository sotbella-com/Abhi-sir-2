# AYRA Ops — agent config + voice broker

These are the two **separate services** behind AYRA (the storefront's voice copilot lives in `src/ayra/`).
They are versioned here for reference; each deploys to its own Railway service.

## `agent/patch_sandbox_agent.py`
One-shot script that configures the ElevenLabs **sandbox** AYRA agent
(`agent_6301kxntaf7yebnv4fawgwx1a446`) — its 26 client tools + the hyper-sales chief-stylist persona
(social moments, Cosmic-read flow, personalized collection, real-time highlight, full concierge, never
astrological). Apply after editing:

```
ELK=<elevenlabs_api_key> python3 agent/patch_sandbox_agent.py
```

## `broker/`
The isolated Node/Express broker (Railway service `ayra-shopper-sandbox`). Mints ElevenLabs signed URLs
(`/session`), proxies the de-astrologised Satya "Cosmic intelligence" read (`/ayra/dna`), records journey
telemetry to Supabase (`/ayra/journey` → `ayra_journey_events`), and relays masked live co-view
(`/ayra/live`). Config via env (see `broker/.env.example`) — never commit real keys.

```
cd broker && npm install && node server.js
```

## Isolation
Sandbox only — no production Meta pixel/CAPI, test pixel gated, `VITE_AYRA_*` flags. See the storefront
`src/ayra/` for the client that talks to these.
