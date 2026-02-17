# children_services

Minimal children microservice for Soulconnect.

Quick start

1. Copy `.env.example` to `.env` and adjust values.
2. Install deps:

```bash
npm install
```

3. Run:

```bash
npm run start
# or for dev (requires nodemon):
npm run dev
```

Health check

```bash
curl http://localhost:3001/health
```
