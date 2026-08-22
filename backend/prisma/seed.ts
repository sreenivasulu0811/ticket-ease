import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TicketEase Database Seeding...');

  // 1. Clean existing database in reverse order of foreign keys
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.showSeat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned up existing data.');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Demo@Password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@ticketease.demo',
      phone: '+91 98765 43210',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      name: 'Venue Gate Staff',
      email: 'operator@ticketease.demo',
      phone: '+91 98765 43211',
      passwordHash,
      role: 'OPERATOR',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'customer@ticketease.demo',
      phone: '+91 98765 43212',
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+91 98765 43213',
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+91 98765 43214',
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  console.log(`👤 Created 5 test users (Admin: admin@ticketease.demo, Customer: customer@ticketease.demo).`);

  // 3. Create Venues & Screens
  const venue1 = await prisma.venue.create({
    data: {
      name: 'PVR INOX IMAX Multiplex',
      location: 'Forum Mall, Koramangala',
      address: '21 Hosur Road, Koramangala',
      city: 'Bengaluru',
      capacity: 100,
      type: 'MOVIE_THEATRE',
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Royal Opera Concert Arena',
      location: 'Downtown Cultural District',
      address: '45 Marine Drive',
      city: 'Mumbai',
      capacity: 70,
      type: 'CONCERT_HALL',
      imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: 'Cinepolis Grand Central',
      location: 'DLF Cyber City',
      address: 'Building 10, Sector 24',
      city: 'Delhi NCR',
      capacity: 50,
      type: 'MOVIE_THEATRE',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Create Screens & Seats for Venue 1 (PVR INOX)
  // Screen 1: 6 rows (A-F), 10 cols = 60 seats
  const screen1 = await prisma.screen.create({
    data: {
      venueId: venue1.id,
      name: 'Audi 1 (IMAX Laser)',
      rows: 6,
      columns: 10,
      capacity: 60,
    },
  });

  const seatsScreen1: any[] = [];
  for (let r = 0; r < 6; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r < 2 ? 'VIP' : r < 4 ? 'PREMIUM' : 'REGULAR';
    const priceMultiplier = seatType === 'VIP' ? 1.5 : seatType === 'PREMIUM' ? 1.25 : 1.0;
    for (let c = 1; c <= 10; c++) {
      seatsScreen1.push({
        screenId: screen1.id,
        rowLabel,
        seatNumber: c,
        seatType,
        priceMultiplier,
      });
    }
  }
  await prisma.seat.createMany({ data: seatsScreen1 });

  // Screen 2: 4 rows (A-D), 10 cols = 40 seats
  const screen2 = await prisma.screen.create({
    data: {
      venueId: venue1.id,
      name: 'Audi 2 (Dolby Atmos)',
      rows: 4,
      columns: 10,
      capacity: 40,
    },
  });

  const seatsScreen2: any[] = [];
  for (let r = 0; r < 4; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r === 0 ? 'VIP' : r === 1 ? 'PREMIUM' : 'REGULAR';
    const priceMultiplier = seatType === 'VIP' ? 1.5 : seatType === 'PREMIUM' ? 1.25 : 1.0;
    for (let c = 1; c <= 10; c++) {
      seatsScreen2.push({
        screenId: screen2.id,
        rowLabel,
        seatNumber: c,
        seatType,
        priceMultiplier,
      });
    }
  }
  await prisma.seat.createMany({ data: seatsScreen2 });

  // Screen for Venue 2 (Royal Opera Arena)
  // Grand Arena Hall: 7 rows (A-G), 10 cols = 70 seats
  const screen3 = await prisma.screen.create({
    data: {
      venueId: venue2.id,
      name: 'Grand Concert Hall',
      rows: 7,
      columns: 10,
      capacity: 70,
    },
  });

  const seatsScreen3: any[] = [];
  for (let r = 0; r < 7; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r < 2 ? 'VIP' : r < 4 ? 'PREMIUM' : 'REGULAR';
    const priceMultiplier = seatType === 'VIP' ? 1.6 : seatType === 'PREMIUM' ? 1.3 : 1.0;
    for (let c = 1; c <= 10; c++) {
      seatsScreen3.push({
        screenId: screen3.id,
        rowLabel,
        seatNumber: c,
        seatType,
        priceMultiplier,
      });
    }
  }
  await prisma.seat.createMany({ data: seatsScreen3 });

  // Screen for Venue 3 (Cinepolis)
  const screen4 = await prisma.screen.create({
    data: {
      venueId: venue3.id,
      name: 'Screen 1 VIP Lounge',
      rows: 5,
      columns: 10,
      capacity: 50,
    },
  });

  const seatsScreen4: any[] = [];
  for (let r = 0; r < 5; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const seatType = r < 2 ? 'VIP' : r < 3 ? 'PREMIUM' : 'REGULAR';
    const priceMultiplier = seatType === 'VIP' ? 1.5 : seatType === 'PREMIUM' ? 1.25 : 1.0;
    for (let c = 1; c <= 10; c++) {
      seatsScreen4.push({
        screenId: screen4.id,
        rowLabel,
        seatNumber: c,
        seatType,
        priceMultiplier,
      });
    }
  }
  await prisma.seat.createMany({ data: seatsScreen4 });

  console.log('🏛️ Created 3 venues and 4 screens with 220 total seats.');

  // 4. Create Events (Movies & Concerts)
  const event1 = await prisma.event.create({
    data: {
      title: 'RRR (Rise Roar Revolt)',
      description: 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and embark on an inspiring path of freedom against tyrannical rulers.',
      type: 'MOVIE',
      language: 'Telugu / Hindi',
      duration: 187,
      category: 'Action / Drama',
      castOrArtist: 'N. T. Rama Rao Jr., Ram Charan, Alia Bhatt, Ajay Devgn',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 4.9,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Taylor Swift: The Eras Tour',
      description: 'The cultural phenomenon continues on the big screen! Immerse yourself in this once-in-a-lifetime concert film experience with a breathtaking cinematic view of the history-making tour.',
      type: 'CONCERT',
      language: 'English',
      duration: 169,
      category: 'Pop / Live Concert',
      castOrArtist: 'Taylor Swift',
      posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 5.0,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
      type: 'MOVIE',
      language: 'English',
      duration: 180,
      category: 'Biography / Thriller',
      castOrArtist: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 4.8,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: 'Coldplay: Music of the Spheres Live',
      description: 'Experience the magic of Coldplay live in concert with an electric atmosphere, laser lights, fireworks, and chart-topping anthems like Fix You, Yellow, and Viva La Vida.',
      type: 'CONCERT',
      language: 'English',
      duration: 150,
      category: 'Rock / Alternative',
      castOrArtist: 'Coldplay (Chris Martin, Jonny Buckland, Guy Berryman, Will Champion)',
      posterUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 4.9,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      type: 'MOVIE',
      language: 'English',
      duration: 166,
      category: 'Sci-Fi / Adventure',
      castOrArtist: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 4.9,
    },
  });

  console.log('🎬 Created 5 featured events (Movies & Concerts).');

  // 5. Create Shows & Seat Inventories
  const now = new Date();
  const createDate = (daysAhead: number, hour: number, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const showList = [
    // RRR shows
    {
      eventId: event1.id,
      screenId: screen1.id,
      startTime: createDate(0, 14, 0), // Today 2:00 PM
      endTime: createDate(0, 17, 10),
      basePrice: 250,
    },
    {
      eventId: event1.id,
      screenId: screen1.id,
      startTime: createDate(0, 18, 30), // Today 6:30 PM
      endTime: createDate(0, 21, 40),
      basePrice: 280,
    },
    {
      eventId: event1.id,
      screenId: screen1.id,
      startTime: createDate(1, 19, 0), // Tomorrow 7:00 PM
      endTime: createDate(1, 22, 10),
      basePrice: 280,
    },
    // Taylor Swift Concert shows
    {
      eventId: event2.id,
      screenId: screen3.id,
      startTime: createDate(0, 20, 0), // Today 8:00 PM
      endTime: createDate(0, 23, 0),
      basePrice: 1500,
    },
    {
      eventId: event2.id,
      screenId: screen3.id,
      startTime: createDate(2, 19, 30), // In 2 days 7:30 PM
      endTime: createDate(2, 22, 30),
      basePrice: 1800,
    },
    // Oppenheimer shows
    {
      eventId: event3.id,
      screenId: screen2.id,
      startTime: createDate(0, 16, 0),
      endTime: createDate(0, 19, 0),
      basePrice: 220,
    },
    {
      eventId: event3.id,
      screenId: screen4.id,
      startTime: createDate(1, 15, 0),
      endTime: createDate(1, 18, 0),
      basePrice: 240,
    },
    // Coldplay shows
    {
      eventId: event4.id,
      screenId: screen3.id,
      startTime: createDate(1, 20, 30),
      endTime: createDate(1, 23, 0),
      basePrice: 1200,
    },
    // Dune shows
    {
      eventId: event5.id,
      screenId: screen2.id,
      startTime: createDate(0, 20, 0),
      endTime: createDate(0, 22, 50),
      basePrice: 260,
    },
  ];

  const createdShows: any[] = [];
  for (const sData of showList) {
    const show = await prisma.show.create({
      data: sData,
      include: { screen: { include: { seats: true } } },
    });

    // Populate ShowSeat inventory
    const showSeatsData = show.screen.seats.map((seat) => ({
      showId: show.id,
      seatId: seat.id,
      status: 'AVAILABLE' as const,
    }));

    await prisma.showSeat.createMany({
      data: showSeatsData,
    });

    createdShows.push(show);
  }

  console.log(`🎫 Scheduled ${createdShows.length} shows and populated all show seat inventories.`);

  // 6. Create Demo Bookings for John Doe
  const demoShow = createdShows[0]; // RRR Today 2:00 PM
  const demoShowSeats = await prisma.showSeat.findMany({
    where: { showId: demoShow.id },
    include: { seat: true },
    take: 2,
  });

  if (demoShowSeats.length >= 2) {
    const ref = 'TE-2026-DEMO01';
    const subtotal = demoShowSeats.reduce((sum, ss) => sum + Math.round(demoShow.basePrice * ss.seat.priceMultiplier), 0);
    const totalAmount = subtotal + 30.0;

    const qrCodeData = await QRCode.toDataURL(
      JSON.stringify({
        ref,
        uid: customer1.id,
        sid: demoShow.id,
        amt: totalAmount,
      })
    );

    const booking = await prisma.booking.create({
      data: {
        bookingReference: ref,
        userId: customer1.id,
        showId: demoShow.id,
        subtotal,
        convenienceFee: 30.0,
        totalAmount,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        paymentMethod: 'UPI',
        paymentId: 'PAY-DEMO-001',
        qrCodeData,
        ticketStatus: 'VALID',
      },
    });

    await prisma.bookingSeat.createMany({
      data: demoShowSeats.map((ss) => ({
        bookingId: booking.id,
        showSeatId: ss.id,
        price: Math.round(demoShow.basePrice * ss.seat.priceMultiplier),
      })),
    });

    await prisma.showSeat.updateMany({
      where: { id: { in: demoShowSeats.map((ss) => ss.id) } },
      data: {
        status: 'BOOKED',
        bookingId: booking.id,
      },
    });

    console.log(`🎟️ Created demo confirmed booking ${ref} for ${customer1.name}.`);
  }

  // 7. Create Demo Waitlist Entry
  await prisma.waitlistEntry.create({
    data: {
      userId: customer2.id,
      showId: createdShows[3].id, // Taylor Swift show
      requestedSeats: 2,
      status: 'WAITING',
    },
  });

  console.log('📋 Created demo waitlist entry for Alice Smith.');
  console.log('🎉 Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
