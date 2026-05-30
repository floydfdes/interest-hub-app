# InterestHub Frontend

Next.js frontend for InterestHub.

## Local Development

Requires Node.js `>=20.19.0`.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). By default the app sends API requests to `http://localhost:4300/api`. Set `NEXT_PUBLIC_API_URL` before starting or building to use another backend.

## Docker

The image uses a multi-stage production build and Next.js standalone output.

Build and run:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:4300/api -t interest-hub-frontend .
docker run --rm -p 3000:3000 interest-hub-frontend
```

Or use Compose:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4300/api docker compose up --build
```

`NEXT_PUBLIC_API_URL` is public browser configuration and is embedded during `docker build`. Use a URL accessible from the visitor's browser, not a Docker-only service hostname.

## Checks

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
```
