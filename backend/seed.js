const pool = require("./db");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    const name = "Demo User";
    const email = "demo@sweety.com";
    const password = "Sweety@123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [name, email, hashedPassword]
    );

    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      userId = existingUser.rows[0].id;
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const readings = [
      ["Morning", 110],
      ["After breakfast", 125],
      ["After lunch", 140],
      ["After dinner", 120]
    ];

    for (const [slot, value] of readings) {
      await pool.query(
        `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2::date, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot)
         DO NOTHING`,
        [userId, today, slot, value]
      );
    }

    console.log("Demo data inserted successfully!");
    console.log("Email:", email);
    console.log("Password:", password);

  } catch (error) {
    console.error("Seed Error:", error.message);
  } finally {
    await pool.end();
  }
}

seedDatabase();