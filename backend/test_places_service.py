import unittest

from unittest.mock import patch

from places_service import (
    _parse_price,
    _place_from_element,
    _prepare_location_query,
    parse_opening_hours,
    search_locations,
)


class OpeningHoursTests(unittest.TestCase):
    def test_parses_weekday_range(self):
        weekly = parse_opening_hours("Mo-Sa 10:00-17:00")

        self.assertEqual(
            weekly["monday"], [{"opensAt": "10:00", "closesAt": "17:00"}]
        )
        self.assertNotIn("sunday", weekly)

    def test_parses_closed_days_without_guessing(self):
        weekly = parse_opening_hours("Mo-Tu closed; We-Su 10:00-17:00")

        self.assertEqual(weekly["monday"], [])
        self.assertEqual(
            weekly["sunday"], [{"opensAt": "10:00", "closesAt": "17:00"}]
        )

    def test_rejects_complex_unsupported_expression(self):
        self.assertIsNone(parse_opening_hours("sunrise-sunset"))


class PriceTests(unittest.TestCase):
    def test_fee_no_is_free(self):
        self.assertEqual(_parse_price({"fee": "no"}), (0, "Free", None, True))

    def test_exact_source_amount_is_preserved(self):
        self.assertEqual(
            _parse_price({"fee": "yes", "charge": "5 EUR"}),
            (5.0, "5 EUR", "EUR", False),
        )

    def test_fee_yes_does_not_invent_a_price(self):
        self.assertEqual(_parse_price({"fee": "yes"}), (None, None, None, False))


class PlaceMappingTests(unittest.TestCase):
    def test_missing_source_fields_stay_missing(self):
        place = _place_from_element(
            {
                "type": "node",
                "id": 42,
                "lat": 56.95,
                "lon": 24.1,
                "tags": {"name": "Source-backed place", "tourism": "attraction"},
            },
            city="Riga",
            country="Latvia",
            wikidata_entities={},
        )

        self.assertNotIn("price", place)
        self.assertNotIn("isFree", place)
        self.assertNotIn("openingHours", place)
        self.assertNotIn("officialWebsite", place)
        self.assertEqual(place["durationSource"], "estimate")


class LocationSearchTests(unittest.TestCase):
    def test_prepares_russian_mall_query_and_city_inflection(self):
        prepared, intended_type = _prepare_location_query(
            "ТРЦ Домина в Риге"
        )

        self.assertEqual(prepared, "mall Домина Riga")
        self.assertEqual(intended_type, "mall")

    @patch("places_service._nominatim_search")
    def test_maps_a_specific_cafe_without_changing_coordinates(self, search_mock):
        search_mock.return_value = [
            {
                "place_id": 123,
                "osm_type": "node",
                "osm_id": 456,
                "lat": "52.0874791",
                "lon": "23.6993990",
                "category": "amenity",
                "type": "cafe",
                "addresstype": "amenity",
                "name": "Облака",
                "display_name": "Облака, Брест, Беларусь",
                "address": {
                    "city": "Брест",
                    "country": "Беларусь",
                    "country_code": "by",
                },
            }
        ]

        locations = search_locations("кафе Облака", 5)

        self.assertEqual(len(locations), 1)
        self.assertEqual(locations[0]["name"], "Облака")
        self.assertEqual(locations[0]["type"], "cafe")
        self.assertEqual(locations[0]["latitude"], 52.0874791)
        self.assertEqual(locations[0]["longitude"], 23.6993990)
        search_mock.assert_called_once_with(
            "cafe Облака",
            5,
            latitude=None,
            longitude=None,
        )

    @patch("places_service._nominatim_search")
    def test_passes_map_location_as_search_bias(self, search_mock):
        search_mock.return_value = []

        search_locations(
            "Domina",
            8,
            latitude=56.9494,
            longitude=24.1052,
        )

        search_mock.assert_called_once_with(
            "Domina",
            8,
            latitude=56.9494,
            longitude=24.1052,
        )


if __name__ == "__main__":
    unittest.main()
