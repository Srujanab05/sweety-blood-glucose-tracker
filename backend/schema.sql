CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    glucose_value INTEGER NOT NULL
        CHECK (glucose_value BETWEEN 40 AND 600),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (time_slot IN (
        'Morning',
        'After breakfast',
        'After lunch',
        'After dinner'
    )),

    UNIQUE (user_id, reading_date, time_slot)
);