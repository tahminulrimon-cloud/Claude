require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const gdrive = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w800`;

const ENTRIES = [
  { label: "Birth Day",  age: "Day 0",       date: "25 April 2022",  photo: gdrive("14tLTqcz8ibw_k5Gx_brTSX4ApyQhZwFA"), caption: "Welcome to the world, little Alysha! 🌸", milestone: "First breath of life",     ageInDays: 0  },
  { label: "Day 3",      age: "Day 3",       date: "28 April 2022",  photo: gdrive("1CN3IYgGHmc10TSRmdlxRrUv53Y4XnebR"), caption: "Still learning what this world is about",   milestone: "Bundled and warm",         ageInDays: 3  },
  { label: "Day 4",      age: "Day 4",       date: "29 April 2022",  photo: gdrive("1EhAlJmwSuLHbOE6Tc9Wh6nUXCVHHRTM8"), caption: "Every tiny yawn is a miracle",             milestone: "Rooting reflex",           ageInDays: 4  },
  { label: "Day 5",      age: "Day 5",       date: "30 April 2022",  photo: gdrive("1FuAgfwYwZXaIJxLdz8sL8d3-ArDVXXA5"), caption: "Peaceful little dreamer",                  milestone: "First full nap",           ageInDays: 5  },
  { label: "Day 6",      age: "Day 6",       date: "01 May 2022",    photo: gdrive("1DQTTB2SVn5EahKRPHZDOYnKtSnCpxvc3"), caption: "One week almost done — growing stronger",  milestone: "Tummy time begins",        ageInDays: 6  },
  { label: "Day 8",      age: "Day 8",       date: "03 May 2022",    photo: gdrive("1HQsb9LhYwAOLe3sC6r-uHbfyJ8XInhCc"), caption: "Eyes opening to the light",                milestone: "Focusing on faces",        ageInDays: 8  },
  { label: "Day 9",      age: "Day 9",       date: "04 May 2022",    photo: gdrive("1TG3EbM8wmxMLPgmcC2qvy9es1Ul96Ej6"), caption: "So much personality already!",             milestone: "Alert & aware",            ageInDays: 9  },
  { label: "Day 12",     age: "Day 12",      date: "07 May 2022",    photo: gdrive("1UBVKNPt5wIzVK1VfO9G62uGY3oXILAHr"), caption: "Almost two weeks of wonder",               milestone: "Recognizing voices",       ageInDays: 12 },
  { label: "2 Weeks",    age: "Day 14",      date: "09 May 2022",    photo: gdrive("1UttTpwtyvm7G9Aqgwgs1laIGVeXokDIi"), caption: "Two whole weeks of Alysha!",               milestone: "Holding gaze",             ageInDays: 14 },
  { label: "Day 17",     age: "Day 17",      date: "12 May 2022",    photo: gdrive("1WxQQy4YE0ZPYw8JlNLZVFzkX7XL8et81"), caption: "Getting chubbier and more adorable",       milestone: "Stronger grip",            ageInDays: 17 },
  { label: "1 Month",    age: "~1 month",    date: "25 May 2022",    photo: gdrive("1Wzi--gDaz7mkD_6bs_TiZ0plDb8Xfuz1"), caption: "One whole month of love and wonder!",      milestone: "Social smiling",           ageInDays: 30 },
  { label: "~2 Months",  age: "~2 months",   date: "June 2022",      photo: gdrive("1XCp3eJ9sjIC8biOy5U7lbXmlCZVN4Gai"), caption: "Growing so fast, cooing and discovering", milestone: "Tracking movement",        ageInDays: 65 },
  { label: "2.5 Months", age: "~2.5 months", date: "06 July 2022",   photo: gdrive("1bXEvO-mqJKaEEJAN46mxUnyrZ8ep4Doe"), caption: "Getting bigger, brighter, more beautiful", milestone: "Head control",             ageInDays: 72 },
];

function seed() {
  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@alysha.family";
  const adminPassword = process.env.ADMIN_PASSWORD || "Alysha@2022";
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);

  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)").run(
      uuidv4(), adminEmail, hash, "admin"
    );
    console.log(`✓ Admin user created: ${adminEmail}`);
  } else {
    console.log(`  Admin user already exists: ${adminEmail}`);
  }

  // Seed entries
  const count = db.prepare("SELECT COUNT(*) as n FROM entries").get().n;
  if (count > 0) {
    console.log(`  Entries already seeded (${count} rows)`);
    return;
  }

  const insertEntry = db.prepare(
    `INSERT INTO entries (id, label, age, date, photo, caption, milestone, age_in_days, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertAll = db.transaction((entries) => {
    entries.forEach((e, i) => {
      insertEntry.run(uuidv4(), e.label, e.age, e.date, e.photo, e.caption, e.milestone, e.ageInDays, i);
    });
  });

  insertAll(ENTRIES);
  console.log(`✓ Seeded ${ENTRIES.length} timeline entries`);
}

seed();
console.log("✓ Database ready");
