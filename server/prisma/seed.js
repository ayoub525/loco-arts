import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.wishlist.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('LocoArts2024!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@locoarts.tn',
      passwordHash: adminPassword,
      name: 'Admin LOCO Arts',
      phone: '+21612345678',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created: admin@LocoArts.tn / LocoArts2024!');

  // Create test customer
  const customerPassword = await bcrypt.hash('Test1234!', 10);
  const customer = await prisma.user.create({
    data: {
      email: 'client@test.tn',
      passwordHash: customerPassword,
      name: 'Ahmed Ben Ali',
      phone: '+21698765432',
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Customer created: client@test.tn / Test1234!');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Femme', slug: 'femme', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: 'Homme', slug: 'homme', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: 'Enfants', slug: 'enfants', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: 'Personnalisé', slug: 'personnalise', sortOrder: 4 },
    }),
  ]);
  console.log('✅ 4 categories created');

  const [femme, homme, enfants, custom] = categories;

  // Create products with variants
  const products = [
    {
      name: 'Baskets Artisanales Noires',
      slug: 'baskets-artisanales-noires',
      description: 'Baskets faites à la main en cuir véritable noir. Chaque paire est unique, confectionnée par nos artisans à Tunis avec un savoir-faire traditionnel tunisien.',
      price: 189,
      oldPrice: 229,
      categoryId: homme.id,
      isFeatured: true,
      isNew: true,
      sizes: ['39', '40', '41', '42', '43', '44', '45'],
      color: 'Noir',
    },
    {
      name: 'Sneakers Blanches Classiques',
      slug: 'sneakers-blanches-classiques',
      description: 'Sneakers blanches minimalistes en cuir souple. Design épuré et confort optimal pour un style streetwear élégant.',
      price: 169,
      categoryId: femme.id,
      isFeatured: true,
      isNew: true,
      sizes: ['36', '37', '38', '39', '40', '41'],
      color: 'Blanc',
    },
    {
      name: 'Bottines Chelsea Cuir',
      slug: 'bottines-chelsea-cuir',
      description: 'Bottines Chelsea en cuir naturel tanné. Semelle cousue main, élastiques latéraux pour un enfilage facile.',
      price: 249,
      oldPrice: 299,
      categoryId: homme.id,
      isFeatured: true,
      isNew: false,
      sizes: ['40', '41', '42', '43', '44'],
      color: 'Marron',
    },
    {
      name: 'Sandales Été Tressées',
      slug: 'sandales-ete-tressees',
      description: 'Sandales d\'été avec tressage artisanal. Cuir végétal souple et semelle confortable pour les journées chaudes.',
      price: 129,
      categoryId: femme.id,
      isFeatured: false,
      isNew: true,
      sizes: ['36', '37', '38', '39', '40'],
      color: 'Beige',
    },
    {
      name: 'Baskets Junior Colorées',
      slug: 'baskets-junior-colorees',
      description: 'Baskets pour enfants avec des touches de couleur. Confortables et durables pour les petits aventuriers.',
      price: 99,
      oldPrice: 119,
      categoryId: enfants.id,
      isFeatured: false,
      isNew: true,
      sizes: ['28', '29', '30', '31', '32', '33', '34', '35'],
      color: 'Multicolore',
    },
    {
      name: 'Chaussures Sur Mesure',
      slug: 'chaussures-sur-mesure',
      description: 'Créez votre propre paire de chaussures. Choisissez le cuir, la couleur, le design et la pointure. Un artisan dédié réalisera votre commande unique.',
      price: 349,
      categoryId: custom.id,
      isFeatured: true,
      isNew: false,
      sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
      color: 'Sur Mesure',
    },
  ];

  for (const p of products) {
    const { sizes, color, ...productData } = p;
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: [
            { url: '/placeholder-product.jpg', sortOrder: 0 },
            { url: '/placeholder-product.jpg', sortOrder: 1 },
          ],
        },
        variants: {
          create: sizes.map((size) => ({
            size,
            color,
            stock: Math.floor(Math.random() * 10) + 2,
            isAvailable: true,
          })),
        },
      },
    });
    console.log(`✅ Product: ${product.name}`);
  }

  // Create settings
  const settings = [
    { key: 'shopName', value: 'LOCO Arts' },
    { key: 'tagline', value: 'CR.EATIVE STUDIO' },
    { key: 'deliveryFee', value: '8' },
    { key: 'freeShippingThreshold', value: '200' },
    { key: 'heroTitle', value: 'Fait à la main · Fait en Tunisie' },
    { key: 'heroSubtitle', value: 'Chaussures artisanales uniques, créées avec passion dans notre atelier à Tunis.' },
    { key: 'phone', value: '+216 12 345 678' },
    { key: 'email', value: 'contact@LocoArts.tn' },
    { key: 'address', value: 'Tunis, Tunisie' },
    { key: 'instagram', value: 'https://instagram.com/LocoArts.tn' },
    { key: 'facebook', value: 'https://facebook.com/LocoArts.tn' },
    { key: 'tiktok', value: 'https://tiktok.com/@LocoArts.tn' },
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }
  console.log('✅ Settings created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
