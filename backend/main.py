from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from models import City
from places_service import PlacesServiceError, search_locations, search_places


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Odysseus API is working"}


@app.get("/cities")
def get_cities(db: Session = Depends(get_db)):
    cities = db.query(City).all()

    return cities


@app.get("/places/search")
def get_places(
    city: str | None = Query(default=None, min_length=2, max_length=120),
    country: str | None = Query(default=None, min_length=2, max_length=120),
    q: str | None = Query(default=None, min_length=2, max_length=160),
    limit: int = Query(default=30, ge=1, le=50),
):
    try:
        places = search_places(city=city, country=country, search=q, limit=limit)
    except PlacesServiceError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        "places": places,
        "attribution": "© OpenStreetMap contributors · Wikimedia Commons",
    }


@app.get("/locations/search")
def get_locations(
    q: str = Query(min_length=2, max_length=180),
    limit: int = Query(default=8, ge=1, le=10),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lon: float | None = Query(default=None, ge=-180, le=180),
):
    try:
        locations = search_locations(q, limit, latitude=lat, longitude=lon)
    except PlacesServiceError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {
        "locations": locations,
        "attribution": "© OpenStreetMap contributors",
    }
