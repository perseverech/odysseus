from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Travel Planner API is working"}


@app.get("/cities")
def get_cities():
    return [
        {"id": 1, "name": "Riga", "country": "Latvia"},
        {"id": 2, "name": "Istanbul", "country": "Turkey"},
        {"id": 3, "name": "Barcelona", "country": "Spain"},
    ]
    