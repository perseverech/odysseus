from __future__ import annotations

import json
import math
import os
import re
import threading
import time
import unicodedata
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen


NOMINATIM_URL = os.getenv(
    "NOMINATIM_URL", "https://nominatim.openstreetmap.org/search"
)
OVERPASS_URLS = [
    url.strip()
    for url in os.getenv(
        "OVERPASS_URLS",
        "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter",
    ).split(",")
    if url.strip()
]
WIKIDATA_URL = os.getenv(
    "WIKIDATA_URL", "https://www.wikidata.org/w/api.php"
)
USER_AGENT = os.getenv(
    "ODYSSEUS_USER_AGENT",
    "Odysseus/1.0 (https://github.com/perseverech/odysseus)",
)

OSM_ATTRIBUTION = "© OpenStreetMap contributors"
WIKIMEDIA_ATTRIBUTION = "Wikimedia Commons"
CACHE_TTL_SECONDS = 6 * 60 * 60

_cache: dict[tuple[str, str, str, int], tuple[float, list[dict[str, Any]]]] = {}
_location_search_cache: dict[
    tuple[str, int, str], tuple[float, list[dict[str, Any]]]
] = {}
_cache_lock = threading.Lock()
_nominatim_lock = threading.Lock()
_last_nominatim_request = 0.0


class PlacesServiceError(RuntimeError):
    pass


def _request_json(
    url: str,
    *,
    query: dict[str, str] | None = None,
    form: dict[str, str] | None = None,
    timeout: int = 35,
) -> Any:
    if query:
        url = f"{url}?{urlencode(query)}"

    body = urlencode(form).encode("utf-8") if form else None
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en",
        "User-Agent": USER_AGENT,
    }
    if body:
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    try:
        with urlopen(Request(url, data=body, headers=headers), timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        host = urlparse(url).netloc
        raise PlacesServiceError(
            f"Places source {host} returned HTTP {error.code}."
        ) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise PlacesServiceError("Places source is temporarily unavailable.") from error


def _nominatim_search(
    query: str,
    limit: int,
    *,
    latitude: float | None = None,
    longitude: float | None = None,
) -> list[dict[str, Any]]:
    # The public Nominatim service asks clients to stay below one request per second.
    global _last_nominatim_request

    location_bias = (
        f"{latitude:.3f},{longitude:.3f}"
        if latitude is not None and longitude is not None
        else ""
    )
    cache_key = (_normalize(query), limit, location_bias)
    now = time.monotonic()
    with _cache_lock:
        cached = _location_search_cache.get(cache_key)
        if cached and cached[0] > now:
            return cached[1]

    with _nominatim_lock:
        delay = 1.05 - (time.monotonic() - _last_nominatim_request)
        if delay > 0:
            time.sleep(delay)

        parameters = {
            "q": query,
            "format": "jsonv2",
            "limit": str(limit),
            "addressdetails": "1",
            "accept-language": "en,ru",
        }
        if latitude is not None and longitude is not None:
            longitude_span = 1.8
            latitude_span = 1.2
            parameters.update(
                {
                    "viewbox": ",".join(
                        map(
                            str,
                            (
                                longitude - longitude_span,
                                latitude + latitude_span,
                                longitude + longitude_span,
                                latitude - latitude_span,
                            ),
                        )
                    ),
                    "bounded": "0",
                }
            )

        result = _request_json(
            NOMINATIM_URL,
            query=parameters,
            timeout=20,
        )
        _last_nominatim_request = time.monotonic()

    results = result if isinstance(result, list) else []
    with _cache_lock:
        _location_search_cache[cache_key] = (
            time.monotonic() + CACHE_TTL_SECONDS,
            results,
        )

    return results


def _geocode(query: str) -> dict[str, Any]:
    results = _nominatim_search(query, 1)

    if not results:
        raise PlacesServiceError(f'Could not find "{query}".')

    return results[0]


LOCATION_TYPE_PATTERNS: tuple[tuple[str, str], ...] = (
    (r"\b(?:трц|тц|торгово-развлекательный\s+центр|торговый\s+центр)\b", "mall"),
    (r"\b(?:кофейня|кафе)\b", "cafe"),
    (r"\bресторан\b", "restaurant"),
    (r"\bбар\b", "bar"),
    (r"\bмузей\b", "museum"),
    (r"\b(?:отель|гостиница)\b", "hotel"),
    (r"\bаптека\b", "pharmacy"),
    (r"\bсупермаркет\b", "supermarket"),
    (r"\bмагазин\b", "shop"),
    (r"\bпарк\b", "park"),
    (r"\bаэропорт\b", "airport"),
    (r"\bвокзал\b", "station"),
)

LOCATION_NAME_ALIASES = {
    "рига": "Riga",
    "риге": "Riga",
    "ригу": "Riga",
    "барселона": "Barcelona",
    "барселоне": "Barcelona",
    "барселону": "Barcelona",
    "стамбул": "Istanbul",
    "стамбуле": "Istanbul",
    "стамбулу": "Istanbul",
    "вена": "Vienna",
    "вене": "Vienna",
    "вену": "Vienna",
}


def _prepare_location_query(query: str) -> tuple[str, str | None]:
    prepared = " ".join(query.strip().split())
    intended_type: str | None = None

    for pattern, osm_type in LOCATION_TYPE_PATTERNS:
        if not re.search(pattern, prepared, flags=re.IGNORECASE):
            continue

        intended_type = intended_type or osm_type
        prepared = re.sub(pattern, " ", prepared, flags=re.IGNORECASE)

    words = []
    for word in prepared.split():
        normalized_word = _normalize(word.strip(".,;:()[]{}\"'"))
        if normalized_word in {"в", "во", "на", "in", "at"}:
            continue

        words.append(LOCATION_NAME_ALIASES.get(normalized_word, word))

    prepared = " ".join(words).strip()
    if intended_type:
        prepared = f"{intended_type} {prepared}".strip()

    return prepared or query.strip(), intended_type


def _haversine_km(
    first_latitude: float,
    first_longitude: float,
    second_latitude: float,
    second_longitude: float,
) -> float:
    radius_km = 6371.0
    to_radians = math.pi / 180
    latitude_delta = (second_latitude - first_latitude) * to_radians
    longitude_delta = (second_longitude - first_longitude) * to_radians
    first_latitude_radians = first_latitude * to_radians
    second_latitude_radians = second_latitude * to_radians
    value = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(first_latitude_radians)
        * math.cos(second_latitude_radians)
        * math.sin(longitude_delta / 2) ** 2
    )

    return radius_km * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _search_radius(geocode: dict[str, Any]) -> int:
    bounding_box = geocode.get("boundingbox")
    if not isinstance(bounding_box, list) or len(bounding_box) != 4:
        return 10_000

    try:
        south, north, west, east = map(float, bounding_box)
        latitude = float(geocode["lat"])
        longitude = float(geocode["lon"])
    except (KeyError, TypeError, ValueError):
        return 10_000

    radius_km = max(
        _haversine_km(latitude, longitude, north, longitude),
        _haversine_km(latitude, longitude, latitude, east),
        _haversine_km(latitude, longitude, south, west),
    )

    return round(min(18_000, max(6_000, radius_km * 1_000)))


def _overpass_query(latitude: float, longitude: float, radius: int) -> str:
    around = f"(around:{radius},{latitude},{longitude})"

    return "".join(
        [
            "[out:json][timeout:35];(",
            f'nwr["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|aquarium|theme_park)$"]["name"]{around};',
            f'nwr["historic"~"^(castle|fort|palace|archaeological_site|monument|ruins|city_gate)$"]["name"]{around};',
            f'nwr["amenity"~"^(place_of_worship|marketplace|arts_centre|theatre)$"]["name"]["wikidata"]{around};',
            f'nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]["wikidata"]{around};',
            ");out center tags;",
        ]
    )


def _fetch_osm_elements(latitude: float, longitude: float, radius: int) -> list[dict[str, Any]]:
    last_error: PlacesServiceError | None = None

    for endpoint in OVERPASS_URLS:
        try:
            response = _request_json(
                endpoint,
                form={"data": _overpass_query(latitude, longitude, radius)},
                timeout=45,
            )
            elements = response.get("elements") if isinstance(response, dict) else None

            return elements if isinstance(elements, list) else []
        except PlacesServiceError as error:
            last_error = error

    raise last_error or PlacesServiceError("No Overpass endpoint is configured.")


def _claim_string(entity: dict[str, Any], property_id: str) -> str | None:
    claims = entity.get("claims", {}).get(property_id, [])

    for claim in claims:
        value = (
            claim.get("mainsnak", {})
            .get("datavalue", {})
            .get("value")
        )
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def _fetch_wikidata_entities(ids: list[str]) -> dict[str, dict[str, Any]]:
    unique_ids = list(dict.fromkeys(item for item in ids if re.fullmatch(r"Q\d+", item)))
    if not unique_ids:
        return {}

    try:
        response = _request_json(
            WIKIDATA_URL,
            query={
                "action": "wbgetentities",
                "ids": "|".join(unique_ids[:50]),
                "props": "claims|descriptions",
                "languages": "en",
                "format": "json",
                "origin": "*",
            },
            timeout=25,
        )
    except PlacesServiceError:
        # Wikidata only enriches the core OSM result with an image, description,
        # or official site. A temporary enrichment failure must not break search.
        return {}
    entities = response.get("entities") if isinstance(response, dict) else None

    return entities if isinstance(entities, dict) else {}


def _element_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    center = element.get("center") if isinstance(element.get("center"), dict) else element

    try:
        return float(center["lat"]), float(center["lon"])
    except (KeyError, TypeError, ValueError):
        return None


def _localized_name(tags: dict[str, str]) -> str | None:
    for key in ("name:en", "name", "int_name"):
        value = tags.get(key, "").strip()
        if value:
            return value

    return None


def _category(tags: dict[str, str]) -> str:
    tourism = tags.get("tourism")
    historic = tags.get("historic")
    amenity = tags.get("amenity")
    leisure = tags.get("leisure")

    if tourism in {"museum", "gallery"} or amenity in {"arts_centre", "theatre"}:
        return "museums"
    if tourism == "viewpoint":
        return "views"
    if tourism in {"zoo", "aquarium"} or leisure in {
        "park",
        "garden",
        "nature_reserve",
    }:
        return "nature"
    if amenity == "place_of_worship":
        return "religious"
    if amenity == "marketplace":
        return "shopping"
    if historic:
        return "history"
    if tourism in {"theme_park", "attraction"}:
        return "architecture"

    return "hidden_gems"


VISIT_MINUTES = {
    "architecture": 75,
    "history": 90,
    "museums": 120,
    "nature": 120,
    "shopping": 90,
    "views": 45,
    "religious": 45,
    "hidden_gems": 60,
}


def _score(element: dict[str, Any], search: str | None = None) -> float:
    tags = element.get("tags", {})
    tourism = tags.get("tourism")
    historic = tags.get("historic")
    score = {
        "attraction": 10,
        "museum": 9,
        "zoo": 9,
        "aquarium": 9,
        "theme_park": 8,
        "gallery": 6,
        "viewpoint": 6,
    }.get(tourism, 0)
    score += {
        "castle": 9,
        "palace": 9,
        "archaeological_site": 8,
        "fort": 7,
        "city_gate": 7,
        "ruins": 6,
        "monument": 4,
    }.get(historic, 0)

    for key, points in (
        ("wikidata", 5),
        ("wikipedia", 4),
        ("image", 3),
        ("wikimedia_commons", 3),
        ("website", 2),
        ("contact:website", 2),
        ("opening_hours", 1),
        ("fee", 1),
    ):
        if tags.get(key):
            score += points

    if search:
        name = _localized_name(tags) or ""
        normalized_name = _normalize(name)
        tokens = [token for token in _normalize(search).split() if len(token) > 1]
        matching_tokens = sum(token in normalized_name for token in tokens)
        if tokens and matching_tokens == len(tokens):
            score += 30
        else:
            score += matching_tokens * 6

    return score


def _normalize(value: str) -> str:
    ascii_value = "".join(
        character
        for character in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(character)
    )

    return re.sub(r"[^\w]+", " ", ascii_value, flags=re.UNICODE).replace(
        "_", " "
    ).strip()


def _address(tags: dict[str, str]) -> str | None:
    if tags.get("addr:full"):
        return tags["addr:full"].strip()

    street = tags.get("addr:street", "").strip()
    number = tags.get("addr:housenumber", "").strip()
    postcode = tags.get("addr:postcode", "").strip()
    parts = [" ".join(part for part in (street, number) if part), postcode]
    value = ", ".join(part for part in parts if part)

    return value or None


WEEKDAY_INDEX = {
    "Mo": "monday",
    "Tu": "tuesday",
    "We": "wednesday",
    "Th": "thursday",
    "Fr": "friday",
    "Sa": "saturday",
    "Su": "sunday",
}
WEEKDAY_ORDER = list(WEEKDAY_INDEX)


def _expand_days(expression: str) -> list[str] | None:
    result: list[str] = []

    for part in expression.split(","):
        part = part.strip()
        if part in WEEKDAY_INDEX:
            result.append(WEEKDAY_INDEX[part])
            continue

        match = re.fullmatch(r"(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)", part)
        if not match:
            return None

        start = WEEKDAY_ORDER.index(match.group(1))
        end = WEEKDAY_ORDER.index(match.group(2))
        indices = list(range(start, end + 1)) if start <= end else [
            *range(start, len(WEEKDAY_ORDER)),
            *range(0, end + 1),
        ]
        result.extend(WEEKDAY_INDEX[WEEKDAY_ORDER[index]] for index in indices)

    return list(dict.fromkeys(result))


def parse_opening_hours(value: str | None) -> dict[str, list[dict[str, str]]] | None:
    """Parse the conservative subset of OSM opening_hours used by the planner.

    Unsupported expressions stay visible as a source summary but are not converted
    into schedule constraints, so the app never guesses a day or time.
    """

    if not value:
        return None
    if value.strip() == "24/7":
        return {
            weekday: [{"opensAt": "00:00", "closesAt": "24:00"}]
            for weekday in WEEKDAY_INDEX.values()
        }

    weekly: dict[str, list[dict[str, str]]] = {}
    for rule in value.split(";"):
        rule = rule.strip()
        match = re.fullmatch(
            r"((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)\s+(.+)",
            rule,
        )
        if not match:
            return None

        days = _expand_days(match.group(1))
        if not days:
            return None

        hours = match.group(2).strip().lower()
        if hours in {"off", "closed"}:
            periods: list[dict[str, str]] = []
        else:
            periods = []
            for time_range in hours.split(","):
                time_match = re.fullmatch(
                    r"([01]\d|2[0-3]):([0-5]\d)-(?:([01]\d|2[0-3]):([0-5]\d)|24:00)",
                    time_range.strip(),
                )
                if not time_match:
                    return None

                opens_at = f"{time_match.group(1)}:{time_match.group(2)}"
                closes_at = "24:00" if time_range.strip().endswith("24:00") else (
                    f"{time_match.group(3)}:{time_match.group(4)}"
                )
                periods.append({"opensAt": opens_at, "closesAt": closes_at})

        for day in days:
            weekly[day] = periods

    return weekly or None


def _parse_price(tags: dict[str, str]) -> tuple[float | None, str | None, str | None, bool | None]:
    fee = tags.get("fee", "").strip()
    normalized_fee = fee.casefold()
    if normalized_fee in {"no", "free", "0"}:
        return 0, "Free", None, True

    raw_amount = (
        tags.get("charge", "").strip()
        or tags.get("fee:amount", "").strip()
        or (fee if normalized_fee not in {"", "yes"} else "")
    )
    if not raw_amount:
        return None, None, None, False if normalized_fee == "yes" else None

    currency_match = re.search(r"\b(EUR|USD|GBP|TRY|LVL|RUB)\b", raw_amount, re.IGNORECASE)
    symbol_currency = next(
        (currency for symbol, currency in (("€", "EUR"), ("$", "USD"), ("£", "GBP"), ("₺", "TRY")) if symbol in raw_amount),
        None,
    )
    numbers = re.findall(r"(?<!\d)(\d+(?:[.,]\d+)?)(?!\d)", raw_amount)
    price = float(numbers[0].replace(",", ".")) if len(numbers) == 1 else None
    currency = currency_match.group(1).upper() if currency_match else symbol_currency

    return price, raw_amount, currency, False


def _first_url(tags: dict[str, str], keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = tags.get(key, "").strip()
        if value.startswith(("https://", "http://")):
            return value

    return None


def _commons_image_url(filename: str) -> str:
    clean_filename = re.sub(r"^(?:File|Image):", "", filename, flags=re.IGNORECASE).strip()

    return (
        "https://commons.wikimedia.org/wiki/Special:FilePath/"
        f"{quote(clean_filename.replace(' ', '_'), safe='')}?width=1200"
    )


def _image(tags: dict[str, str], entity: dict[str, Any]) -> tuple[str | None, str | None]:
    direct_image = tags.get("image", "").strip()
    if direct_image.startswith(("https://", "http://")):
        return direct_image, None
    if direct_image.lower().startswith(("file:", "image:")):
        return _commons_image_url(direct_image), WIKIMEDIA_ATTRIBUTION

    commons = tags.get("wikimedia_commons", "").strip()
    if commons.lower().startswith(("file:", "image:")):
        return _commons_image_url(commons), WIKIMEDIA_ATTRIBUTION

    wikidata_image = _claim_string(entity, "P18")
    if wikidata_image:
        return _commons_image_url(wikidata_image), WIKIMEDIA_ATTRIBUTION

    return None, None


def _place_from_element(
    element: dict[str, Any],
    *,
    city: str,
    country: str,
    wikidata_entities: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    coordinates = _element_coordinates(element)
    tags = element.get("tags")
    name = _localized_name(tags) if isinstance(tags, dict) else None
    if not coordinates or not isinstance(tags, dict) or not name:
        return None

    latitude, longitude = coordinates
    element_type = str(element.get("type", "node"))
    element_id = str(element.get("id", ""))
    category = _category(tags)
    wikidata_id = tags.get("wikidata", "")
    entity = wikidata_entities.get(wikidata_id, {})
    description_data = entity.get("descriptions", {}).get("en", {})
    description = (
        tags.get("description:en", "").strip()
        or tags.get("description", "").strip()
        or (description_data.get("value", "").strip() if isinstance(description_data, dict) else "")
        or None
    )
    image, image_attribution = _image(tags, entity)
    price, price_label, currency, is_free = _parse_price(tags)
    opening_hours_summary = tags.get("opening_hours", "").strip() or None
    opening_hours = None
    if opening_hours_summary:
        opening_hours = {"summary": opening_hours_summary}
        weekly = parse_opening_hours(opening_hours_summary)
        if weekly:
            opening_hours["weekly"] = weekly

    official_website = _first_url(tags, ("website", "contact:website")) or _claim_string(
        entity, "P856"
    )
    tickets_url = _first_url(
        tags,
        (
            "tickets",
            "ticket",
            "booking",
            "contact:booking",
            "website:booking",
            "url:booking",
        ),
    )
    maps_query = quote(f"{latitude},{longitude}", safe="")
    result: dict[str, Any] = {
        "id": f"osm-{element_type}-{element_id}",
        "name": name,
        "city": city,
        "country": country,
        "latitude": latitude,
        "longitude": longitude,
        "category": category,
        "estimatedVisitMinutes": VISIT_MINUTES[category],
        "durationSource": "estimate",
        "mapsUrl": f"https://www.google.com/maps/search/?api=1&query={maps_query}",
        "source": "live",
        "dataSource": {
            "name": "OpenStreetMap",
            "url": f"https://www.openstreetmap.org/{element_type}/{element_id}",
            "attribution": OSM_ATTRIBUTION,
            **({"imageAttribution": image_attribution} if image_attribution else {}),
        },
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    optional_values = {
        "address": _address(tags),
        "description": description,
        "price": price,
        "priceLabel": price_label,
        "currency": currency,
        "isFree": is_free,
        "openingHours": opening_hours,
        "image": image,
        "officialWebsite": official_website,
        "ticketsUrl": tickets_url,
    }
    result.update({key: value for key, value in optional_values.items() if value is not None})

    return result


def _resolved_location(geocode: dict[str, Any]) -> tuple[str, str]:
    address = geocode.get("address") if isinstance(geocode.get("address"), dict) else {}
    city = next(
        (
            str(address[key]).strip()
            for key in ("city", "town", "municipality", "village", "county", "state")
            if address.get(key)
        ),
        str(geocode.get("name", "")).strip(),
    )
    country = str(address.get("country", "")).strip()

    return city or "Unknown city", country or "Unknown country"


def _deduplicate(elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []

    for element in elements:
        tags = element.get("tags", {})
        wikidata_id = tags.get("wikidata") if isinstance(tags, dict) else None
        name = _localized_name(tags) if isinstance(tags, dict) else None
        key = wikidata_id or _normalize(name or "")
        if not key or key in seen:
            continue

        seen.add(key)
        result.append(element)

    return result


def search_locations(
    query: str,
    limit: int = 8,
    *,
    latitude: float | None = None,
    longitude: float | None = None,
) -> list[dict[str, Any]]:
    query = query.strip()
    if len(query) < 2:
        raise PlacesServiceError("Provide at least two search characters.")

    result_limit = min(10, max(1, limit))
    prepared_query, intended_type = _prepare_location_query(query)
    results = _nominatim_search(
        prepared_query,
        result_limit,
        latitude=latitude,
        longitude=longitude,
    )
    if not results and _normalize(prepared_query) != _normalize(query):
        results = _nominatim_search(
            query,
            result_limit,
            latitude=latitude,
            longitude=longitude,
        )
    if intended_type:
        results = sorted(
            results,
            key=lambda result: str(result.get("type", "")) != intended_type,
        )

    locations: list[dict[str, Any]] = []
    seen_osm_ids: set[tuple[str, str]] = set()

    for result in results:
        try:
            latitude = float(result["lat"])
            longitude = float(result["lon"])
        except (KeyError, TypeError, ValueError):
            continue

        name = str(result.get("name", "")).strip()
        display_name = str(result.get("display_name", "")).strip()
        if not name:
            name = display_name.split(",", 1)[0].strip()
        if not name:
            continue

        city, country = _resolved_location(result)
        address = result.get("address") if isinstance(result.get("address"), dict) else {}
        osm_type = str(result.get("osm_type", "")).strip()
        osm_id = str(result.get("osm_id", "")).strip()
        osm_key = (osm_type, osm_id)
        if osm_id and osm_key in seen_osm_ids:
            continue
        if osm_id:
            seen_osm_ids.add(osm_key)
        source_url = (
            f"https://www.openstreetmap.org/{osm_type}/{osm_id}"
            if osm_type in {"node", "way", "relation"} and osm_id
            else "https://www.openstreetmap.org/"
        )
        maps_query = quote(f"{latitude},{longitude}", safe="")

        locations.append(
            {
                "id": f"nominatim-{result.get('place_id', f'{osm_type}-{osm_id}')}",
                "name": name,
                "displayName": display_name or name,
                "city": city,
                "country": country,
                "countryCode": str(address.get("country_code", "")).lower(),
                "latitude": latitude,
                "longitude": longitude,
                "category": str(result.get("category", "place")),
                "type": str(result.get("type", result.get("addresstype", "place"))),
                "addressType": str(result.get("addresstype", "place")),
                "sourceUrl": source_url,
                "mapsUrl": f"https://www.google.com/maps/search/?api=1&query={maps_query}",
            }
        )

    return locations[:result_limit]


def search_places(
    *,
    city: str | None = None,
    country: str | None = None,
    search: str | None = None,
    limit: int = 30,
) -> list[dict[str, Any]]:
    city = (city or "").strip()
    country = (country or "").strip()
    search = (search or "").strip()
    if not city and not search:
        raise PlacesServiceError("Provide a city or search query.")

    limit = min(50, max(1, limit))
    cache_key = (_normalize(city), _normalize(country), _normalize(search), limit)
    now = time.monotonic()
    with _cache_lock:
        cached = _cache.get(cache_key)
        if cached and cached[0] > now:
            return cached[1]

    location_query = ", ".join(part for part in (city or search, country) if part)
    geocode = _geocode(location_query)

    try:
        latitude = float(geocode["lat"])
        longitude = float(geocode["lon"])
    except (KeyError, TypeError, ValueError) as error:
        raise PlacesServiceError("The selected location has no coordinates.") from error

    elements = _fetch_osm_elements(latitude, longitude, _search_radius(geocode))
    resolved_city, resolved_country = _resolved_location(geocode)
    is_broad_search = geocode.get("addresstype") in {
        "city",
        "town",
        "municipality",
        "village",
        "county",
        "state",
        "country",
    }
    ranking_query = search if search and not city and not is_broad_search else search if city else None
    ranked = sorted(
        _deduplicate(elements),
        key=lambda element: (
            -_score(element, ranking_query),
            _haversine_km(
                latitude,
                longitude,
                *(_element_coordinates(element) or (latitude, longitude)),
            ),
        ),
    )[: max(limit * 2, limit)]
    wikidata_entities = _fetch_wikidata_entities(
        [
            str(element.get("tags", {}).get("wikidata", ""))
            for element in ranked
            if isinstance(element.get("tags"), dict)
        ]
    )
    places = [
        place
        for element in ranked
        if (
            place := _place_from_element(
                element,
                city=resolved_city,
                country=resolved_country,
                wikidata_entities=wikidata_entities,
            )
        )
    ][:limit]

    with _cache_lock:
        _cache[cache_key] = (time.monotonic() + CACHE_TTL_SECONDS, places)

    return places
