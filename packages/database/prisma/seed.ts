import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create system settings
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      botUsername: 'Animanyaktvuzbot',
      telegramBotUsername: '@Animanyaktvuzbot',
      telegramChannelUrl: 'https://t.me/Manyak_tv',
      adminContactUrl: 'https://t.me/Animanyaktvuzbot',
      enableComments: true,
      enableRatings: true,
      maintenanceMode: false,
      tokenPrice: 1000,
    },
  });

  console.log('✅ System settings created');

  // 2. Create super admin
  const superAdmin = await prisma.admin.upsert({
    where: { telegramId: '891846690' },
    update: {},
    create: {
      telegramId: '891846690',
      name: 'Super Admin',
      roleTitle: 'Bosh Admin',
      isSuperAdmin: true,
      permissions: {
        canAddContent: true,
        canEditContent: true,
        canDeleteContent: true,
        canManageUsers: true,
        canManageCatalogs: true,
        canManageReceipts: true,
        canManagePlans: true,
        canManagePromoCodes: true,
        canViewStats: true,
        canManageSettings: true,
        canManageAdmins: true,
        canBroadcast: true,
      },
    },
  });

  console.log('✅ Super admin created:', superAdmin.name);

  // 3. Create categories
  const categories = [
    { name: 'Action', slug: 'action', icon: '💥', order: 1 },
    { name: 'Comedy', slug: 'comedy', icon: '😂', order: 2 },
    { name: 'Drama', slug: 'drama', icon: '🎭', order: 3 },
    { name: 'Horror', slug: 'horror', icon: '👻', order: 4 },
    { name: 'Romance', slug: 'romance', icon: '💕', order: 5 },
    { name: 'Sci-Fi', slug: 'sci-fi', icon: '🚀', order: 6 },
    { name: 'Thriller', slug: 'thriller', icon: '🔪', order: 7 },
    { name: 'Documentary', slug: 'documentary', icon: '📽️', order: 8 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories created:', categories.length);

  // 4. Create subscription plans
  const plans = [
    {
      name: 'Haftalik',
      description: '7 kunlik VIP obuna',
      price: 15000,
      originalPrice: 20000,
      durationDays: 7,
      badge: null,
      features: ['Barcha filmlar', 'Reklama yo\'q', 'HD sifat'],
    },
    {
      name: 'Oylik',
      description: '30 kunlik VIP obuna',
      price: 50000,
      originalPrice: 70000,
      durationDays: 30,
      badge: 'POPULAR',
      features: ['Barcha filmlar', 'Reklama yo\'q', 'HD sifat', '24/7 yordam'],
    },
    {
      name: 'Yillik',
      description: '365 kunlik VIP obuna',
      price: 500000,
      originalPrice: 800000,
      durationDays: 365,
      badge: 'BEST VALUE',
      features: ['Barcha filmlar', 'Reklama yo\'q', 'HD sifat', '24/7 yordam', 'Exclusive content'],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({
      data: plan,
    });
  }

  console.log('✅ Subscription plans created:', plans.length);

  // 5. Create promo codes
  const promoCodes = [
    { code: 'WELCOME2024', discountPercent: 20, maxUses: 100 },
    { code: 'VIP50', discountPercent: 50, maxUses: 50 },
    { code: 'NEWUSER', discountPercent: 30, maxUses: 200 },
  ];

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
  }

  console.log('✅ Promo codes created:', promoCodes.length);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
