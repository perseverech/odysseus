export type DiscoverItem = {
  id: string;
  category: "Experience" | "Place" | "Route";
  title: string;
  location: string;
  country: string;
  image: string;

  price: string;
  paymentType: "Free" | "Paid" | "Mixed";
  ticketInfo: string;
  duration: string;
  openingHours: string;
  bestSeason: string;

  description: string;
  note?: string;

  officialSiteUrl: string;
  ticketsUrl?: string;
  mapsUrl: string;
};

export const discoverItems: DiscoverItem[] = [
  {
    id: "hoi-an-lanterns",
    category: "Experience",
    title: "Lantern Evening in Hoi An",
    location: "Hoi An",
    country: "Vietnam",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85",

    price: "80,000–120,000 VND",
    paymentType: "Paid",
    ticketInfo: "One ticket is valid for up to 3 days",
    duration: "2–4 hours",
    openingHours: "Open daily; monument hours vary",
    bestSeason: "February – August",

    description:
      "Walk through Hoi An Ancient Town after dark when the streets, cafés and riverside are illuminated by colourful lanterns. It is one of the most atmospheric experiences in central Vietnam and works especially well as an evening activity.",

    note:
      "For the most impressive lantern atmosphere, plan the visit after sunset. Some river activities and lantern releases cost extra.",

    officialSiteUrl:
      "https://hoianheritage.danang.gov.vn/en.html",
    ticketsUrl:
      "https://hoianheritage.danang.gov.vn/en/news/news-events/announcement-of-the-visiting-in-hoi-an-ancient-town-125.html",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Hoi+An+Ancient+Town+Vietnam",
  },

  {
    id: "cappadocia-balloons",
    category: "Experience",
    title: "Hot Air Balloons",
    location: "Cappadocia",
    country: "Turkey",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=85",

    price: "Approx. €120–250",
    paymentType: "Paid",
    ticketInfo: "Book with a licensed balloon operator",
    duration: "3–4 hours",
    openingHours: "Around sunrise",
    bestSeason: "April – October",

    description:
      "See Cappadocia from above during a sunrise balloon flight over valleys, rock formations and cave settlements. It is one of the region's signature experiences.",

    note:
      "Flights depend heavily on weather and can be cancelled. Do not schedule the flight for the final morning of your trip.",

    officialSiteUrl:
      "https://cappadocia.goturkiye.com/",
    ticketsUrl:
      "https://web.shgm.gov.tr/en/s/80-balloon-operators",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Goreme+Cappadocia+Turkey",
  },

  {
    id: "lake-bled",
    category: "Place",
    title: "Lake Bled",
    location: "Bled",
    country: "Slovenia",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",

    price: "Free",
    paymentType: "Free",
    ticketInfo: "No ticket for the lake; activities cost extra",
    duration: "3–6 hours",
    openingHours: "24 hours",
    bestSeason: "May – September",

    description:
      "An alpine lake surrounded by mountains, with a small island and church at its centre. The lake can be explored on foot, by boat or from viewpoints above Bled.",

    note:
      "Allow additional time if you want to walk around the entire lake or visit Bled Castle.",

    officialSiteUrl:
      "https://www.bled.si/en/what-to-see-do/attractions/1/lake-bled/",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Lake+Bled+Slovenia",
  },

  {
    id: "setenil",
    category: "Place",
    title: "Setenil de las Bodegas",
    location: "Andalusia",
    country: "Spain",
    image:
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=85",

    price: "Free",
    paymentType: "Free",
    ticketInfo: "No ticket required for the town",
    duration: "2–4 hours",
    openingHours: "Town accessible all day",
    bestSeason: "March – June / September – November",

    description:
      "A small Andalusian town famous for streets and houses constructed directly beneath enormous rock overhangs.",

    note:
      "The historic centre is compact but hilly. Comfortable shoes are useful.",

    officialSiteUrl:
      "https://www.setenildelasbodegas.es/en/areas2/tourism",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Setenil+de+las+Bodegas+Spain",
  },

  {
    id: "istanbul-one-day",
    category: "Route",
    title: "1 Day in Istanbul",
    location: "Istanbul",
    country: "Turkey",
    image:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=85",

    price: "From €25",
    paymentType: "Mixed",
    ticketInfo: "Some museums and landmarks require tickets",
    duration: "8–10 hours",
    openingHours: "Full-day route",
    bestSeason: "April – June / September – October",

    description:
      "A compact route designed for travellers with only one full day in Istanbul. Stops are grouped geographically to minimise unnecessary travel across the city.",

    note:
      "Opening hours and queues can affect the route. Religious sites may require appropriate clothing.",

    officialSiteUrl:
      "https://www.visit.istanbul/",
    ticketsUrl:
      "https://muze.gov.tr/Language/Index/EN?SectionId=PTR01&url=%2Fmuze-detay%3FDistId%3DPTR",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Sultanahmet+Istanbul",
  },
];
