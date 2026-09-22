import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { airports, destinations } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { iataCode: airport.iataCode },
      update: airport,
      create: airport,
    });
  }

  for (const d of destinations) {
    await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {
        city: d.city,
        country: d.country,
        countryCode: d.countryCode,
        airportCode: d.airportCode,
        airportName: d.airportName,
        imageUrl: `https://picsum.photos/seed/${d.imageSeed}/1600/1000`,
        imageAlt: `${d.city}, ${d.country}`,
        active: true,
      },
      create: {
        slug: d.slug,
        city: d.city,
        country: d.country,
        countryCode: d.countryCode,
        airportCode: d.airportCode,
        airportName: d.airportName,
        imageUrl: `https://picsum.photos/seed/${d.imageSeed}/1600/1000`,
        imageAlt: `${d.city}, ${d.country}`,
        active: true,
      },
    });
  }

  console.log(`Seeded ${airports.length} airports and ${destinations.length} destinations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
