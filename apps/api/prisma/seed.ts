import { FoodCategory, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  console.log('Seeding FoodSave database...');

  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodsave.kz' },
    update: {},
    create: { name: 'Platform Admin', email: 'admin@foodsave.kz', passwordHash: password, role: Role.ADMIN },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@foodsave.kz' },
    update: {},
    create: {
      name: 'Aigerim Restaurateur',
      email: 'owner@foodsave.kz',
      phone: '+77011234567',
      passwordHash: password,
      role: Role.RESTAURANT_OWNER,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@foodsave.kz' },
    update: {},
    create: {
      name: 'Daniyar Customer',
      email: 'customer@foodsave.kz',
      phone: '+77017654321',
      passwordHash: password,
      role: Role.CUSTOMER,
    },
  });

  // Two restaurants in Astana.
  const bakery = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: 'Astana Bakery House',
      description: 'Fresh bread, pastries and cakes baked daily.',
      address: 'Kabanbay Batyr Ave 17, Astana',
      lat: 51.1283,
      lng: 71.4304,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    },
  });

  const cafe = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: 'Green Garden Cafe',
      description: 'Healthy bowls, soups and salads.',
      address: 'Dostyk St 5, Astana',
      lat: 51.0909,
      lng: 71.4187,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    },
  });

  await prisma.offer.createMany({
    data: [
      {
        restaurantId: bakery.id,
        title: 'Surprise Pastry Box',
        description: 'A mix of croissants, buns and muffins from today.',
        originalPrice: 4000,
        discountedPrice: 1500,
        quantity: 8,
        category: FoodCategory.BAKERY,
        pickupStart: hoursFromNow(2),
        pickupEnd: hoursFromNow(5),
        expiresAt: hoursFromNow(6),
        images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'],
      },
      {
        restaurantId: bakery.id,
        title: 'Whole Cake (slightly imperfect)',
        description: 'Delicious cake that did not pass our display standards.',
        originalPrice: 9000,
        discountedPrice: 3500,
        quantity: 3,
        category: FoodCategory.DESSERTS,
        pickupStart: hoursFromNow(1),
        pickupEnd: hoursFromNow(4),
        expiresAt: hoursFromNow(5),
      },
      {
        restaurantId: cafe.id,
        title: 'Lunch Bowl Rescue',
        description: 'Hearty grain bowl with seasonal veggies.',
        originalPrice: 3200,
        discountedPrice: 1200,
        quantity: 12,
        category: FoodCategory.MEALS,
        pickupStart: hoursFromNow(1),
        pickupEnd: hoursFromNow(3),
        expiresAt: hoursFromNow(4),
        images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
      },
    ],
  });

  console.log('Seed complete:');
  console.log({ admin: admin.email, owner: owner.email, customer: customer.email });
  console.log('All seeded accounts use password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
