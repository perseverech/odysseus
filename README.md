# Odysseus

## Live place and map search

The FastAPI backend exposes `GET /places/search` for attractions and
`GET /locations/search` for countries, cities, addresses, and named points of
interest. Both use live OpenStreetMap coordinates. Attraction details are
enriched from Overpass and Wikidata/Wikimedia Commons. Source opening hours and
admission fields are passed through only when present. Visit duration is a
category-based estimate and is labelled as such in the app.

Start the API:

```bash
cd backend
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload
```

Configure and start the Expo app:

```bash
cd mobile
cp .env.example .env.local
npm install
npm start
```

`EXPO_PUBLIC_API_URL` defaults to `http://127.0.0.1:8000`. When testing on a
physical phone, set it to the computer's LAN address, for example
`http://192.168.1.20:8000`.

`EXPO_PUBLIC_MAP_STYLE_URL` selects the MapLibre base map used when a city,
address, or POI is opened. The included demo style is for development; replace
it with a production MapLibre-compatible style before release.

For production, point `NOMINATIM_URL` and `OVERPASS_URLS` at managed or
self-hosted instances and set `ODYSSEUS_USER_AGENT` to an identifying value.
The public defaults are suitable for low-volume development and the backend
enforces caching plus Nominatim's one-request-per-second limit.
