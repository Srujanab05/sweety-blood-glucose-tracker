const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("INCOMING REQUEST:", req.method, req.url);
  next();
});

const TIME_SLOTS = [
  "Morning",
  "After breakfast",
  "After lunch",
  "After dinner"
];

// Get today's date in India.
function getTodayIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// Validate YYYY-MM-DD date.
function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

function isFutureDate(date) {
  return date > getTodayIndia();
}

// Validate glucose reading.
function validateReading(date, timeSlot, value) {
  if (!isValidDate(date)) {
    return "Please provide a valid date";
  }

  if (isFutureDate(date)) {
    return "Future dates are not allowed";
  }

  if (!TIME_SLOTS.includes(timeSlot)) {
    return "Please select a valid time slot";
  }

  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isInteger(Number(value)) ||
    Number(value) < 40 ||
    Number(value) > 600
  ) {
    return "Glucose value must be a whole number between 40 and 600";
  }

  return null;
}

// JWT authentication middleware.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token required"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

// -------------------- SIGNUP --------------------

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please provide a valid name and email"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [cleanName, cleanEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      message: "Signup failed"
    });
  }
});
// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});


// -------------------- ADD READING --------------------

app.post("/api/readings", authenticateToken, async (req, res) => {
  try {
    const { reading_date, time_slot, glucose_value } = req.body;

    const validationError = validateReading(
      reading_date,
      time_slot,
      glucose_value
    );

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2::date`,
      [req.user.id, reading_date]
    );

    if (Number(countResult.rows[0].count) >= 4) {
      return res.status(400).json({
        message: "Maximum 4 readings allowed per day"
      });
    }

    const result = await pool.query(
      `INSERT INTO readings
       (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2::date, $3, $4)
       RETURNING
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_value,
         created_at`,
      [
        req.user.id,
        reading_date,
        time_slot,
        Number(glucose_value)
      ]
    );

    return res.status(201).json({
      message: "Reading added successfully",
      reading: result.rows[0]
    });

  } catch (error) {
    console.error("Add reading error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading for this time slot already exists on this date"
      });
    }

    return res.status(500).json({
      message: "Unable to add reading"
    });
  }
});


// -------------------- GET ALL READINGS --------------------

app.get("/api/readings", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_value,
         created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, time_slot ASC`,
      [req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      readings: result.rows
    });

  } catch (error) {
    console.error("Get readings error:", error);

    return res.status(500).json({
      message: "Unable to fetch readings"
    });
  }
});


// -------------------- UPDATE READING --------------------

app.put("/api/readings/:id", authenticateToken, async (req, res) => {
  try {
    const { reading_date, time_slot, glucose_value } = req.body;

    const readingId = Number(req.params.id);

    if (!Number.isInteger(readingId) || readingId <= 0) {
      return res.status(400).json({
        message: "Invalid reading ID"
      });
    }

    const validationError = validateReading(
      reading_date,
      time_slot,
      glucose_value
    );

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const existing = await pool.query(
      `SELECT id
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [readingId, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found"
      });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2::date
       AND id != $3`,
      [req.user.id, reading_date, readingId]
    );

    if (Number(countResult.rows[0].count) >= 4) {
      return res.status(400).json({
        message: "Maximum 4 readings allowed per day"
      });
    }

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1::date,
           time_slot = $2,
           glucose_value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_value,
         created_at`,
      [
        reading_date,
        time_slot,
        Number(glucose_value),
        readingId,
        req.user.id
      ]
    );

    return res.status(200).json({
      message: "Reading updated successfully",
      reading: result.rows[0]
    });

  } catch (error) {
    console.error("Update reading error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading for this time slot already exists on this date"
      });
    }

    return res.status(500).json({
      message: "Unable to update reading"
    });
  }
});
// -------------------- DELETE READING --------------------

app.delete("/api/readings/:id", authenticateToken, async (req, res) => {
  try {
    const readingId = Number(req.params.id);

    if (!Number.isInteger(readingId) || readingId <= 0) {
      return res.status(400).json({
        message: "Invalid reading ID"
      });
    }

    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [readingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found"
      });
    }

    return res.status(200).json({
      message: "Reading deleted successfully"
    });

  } catch (error) {
    console.error("Delete reading error:", error);

    return res.status(500).json({
      message: "Unable to delete reading"
    });
  }
});


// -------------------- REPORTS --------------------

app.get("/api/reports", authenticateToken, async (req, res) => {
  try {
    const selectedDate = req.query.date;

    if (!isValidDate(selectedDate) || isFutureDate(selectedDate)) {
      return res.status(400).json({
        message: "Please provide a valid date that is not in the future"
      });
    }

    const year = Number(selectedDate.slice(0, 4));
    const month = Number(selectedDate.slice(5, 7));

    const monthStart =
      `${year}-${String(month).padStart(2, "0")}-01`;

    const previousMonthStart = new Date(
      Date.UTC(year, month - 2, 1)
    ).toISOString().slice(0, 10);

    // Daily statistics
    const dailyQuery = await pool.query(
      `SELECT
         MAX(glucose_value) AS highest,
         MIN(glucose_value) AS lowest,
         ROUND(AVG(glucose_value), 1) AS average,
         COUNT(*) AS count
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2::date`,
      [req.user.id, selectedDate]
    );

    // Individual daily readings
    const dailyReadings = await pool.query(
      `SELECT
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_value
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2::date
       ORDER BY time_slot`,
      [req.user.id, selectedDate]
    );

    // Month-to-date statistics
    const monthToDateQuery = await pool.query(
      `SELECT
         MAX(glucose_value) AS highest,
         MIN(glucose_value) AS lowest,
         ROUND(AVG(glucose_value), 1) AS average,
         COUNT(*) AS count
       FROM readings
       WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date <= $3::date`,
      [req.user.id, monthStart, selectedDate]
    );

    // Previous full month statistics
    const previousMonthQuery = await pool.query(
      `SELECT
         MAX(glucose_value) AS highest,
         MIN(glucose_value) AS lowest,
         ROUND(AVG(glucose_value), 1) AS average,
         COUNT(*) AS count
       FROM readings
       WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date < $3::date`,
      [req.user.id, previousMonthStart, monthStart]
    );

    function formatStats(row) {
      return {
        highest: row.highest === null ? null : Number(row.highest),
        lowest: row.lowest === null ? null : Number(row.lowest),
        average: row.average === null ? null : Number(row.average),
        count: Number(row.count)
      };
    }

    return res.status(200).json({
      selectedDate,

      daily: {
        ...formatStats(dailyQuery.rows[0]),
        readings: dailyReadings.rows
      },

      monthToDate: formatStats(monthToDateQuery.rows[0]),

      previousMonth: formatStats(previousMonthQuery.rows[0])
    });

  } catch (error) {
    console.error("Reports error:", error);

    return res.status(500).json({
      message: "Unable to generate reports"
    });
  }
});


// -------------------- HEALTH CHECK --------------------

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Sweety Blood Glucose Tracker API is running"
  });
});


// -------------------- START SERVER --------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("ACTIVE SERVER FILE:", __filename);
});