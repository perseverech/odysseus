from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from database import get_db
from models import City


app = FastAPI()


@app.get("/")
def root():
    return {"message": "Odysseus API is working"}


@app.get("/cities")
def get_cities(db: Session = Depends(get_db)):
    cities = db.query(City).all()

    return cities