const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');

const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
});

app.use(function(req, res, next) {
    req.pool = pool;
    next();
});

function insertTestData() {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.error('Error getting connection for data insertion:', error);
            return;
        }

        connection.query('SELECT COUNT(*) AS count FROM Users', function(err, rows) {
            if (err) {
                connection.release();
                console.error('Error checking Users table:', err);
                return;
            }

            if (rows[0].count === 0) {
                const insertUsers = `
                    INSERT INTO Users (username, email, password_hash, role) VALUES
                    ('alice123', 'alice@example.com', 'hashed123', 'owner'),
                    ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
                    ('carol123', 'carol@example.com', 'hashed789', 'owner'),
                    ('dave', 'dave@example.com', 'hashed101', 'walker'),
                    ('alex', 'alex@example.com', 'hashed202', 'owner'),
                    ('newwalker', 'newwalker@example.com', 'hashed303', 'walker')
                `;

                connection.query(insertUsers, function(err2) {
                    if (err2) {
                        connection.release();
                        console.error('Error inserting users:', err2);
                        return;
                    }

                    const insertDogs = `
                        INSERT INTO Dogs (owner_id, name, size) VALUES
                        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
                        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
                        ((SELECT user_id FROM Users WHERE username = 'alex'), 'Rocky', 'large'),
                        ((SELECT user_id FROM Users WHERE username = 'alex'), 'Luna', 'small'),
                        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Charlie', 'medium')
                    `;

                    connection.query(insertDogs, function(err3) {
                        if (err3) {
                            connection.release();
                            console.error('Error inserting dogs:', err3);
                            return;
                        }

                        const insertWalkRequests = `
                            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
                            ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
                            ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
                            ((SELECT dog_id FROM Dogs WHERE name = 'Rocky' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alex')), '2025-06-11 07:00:00', 60, 'City Park', 'open'),
                            ((SELECT dog_id FROM Dogs WHERE name = 'Luna' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alex')), '2025-06-11 16:00:00', 30, 'River Walk', 'open'),
                            ((SELECT dog_id FROM Dogs WHERE name = 'Charlie' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-12 10:00:00', 45, 'Dog Beach', 'completed')
                        `;

                        connection.query(insertWalkRequests, function(err4) {
                            if (err4) {
                                connection.release();
                                console.error('Error inserting walk requests:', err4);
                                return;
                            }

                            const insertWalkApplications = `
                                INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
                                (2, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted'),
                                (5, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted')
                            `;

                            connection.query(insertWalkApplications, function(err5) {
                                if (err5) {
                                    connection.release();
                                    console.error('Error inserting walk applications:', err5);
                                    return;
                                }

                                const insertRatings = `
                                    INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
                                    (2, (SELECT user_id FROM Users WHERE username = 'bobwalker'), (SELECT user_id FROM Users WHERE username = 'carol123'), 4, 'Great walker'),
                                    (5, (SELECT user_id FROM Users WHERE username = 'bobwalker'), (SELECT user_id FROM Users WHERE username = 'alice123'), 5, 'Excellent service')
                                `;

                                connection.query(insertRatings, function(err6) {
                                    connection.release();
                                    if (err6) {
                                        console.error('Error inserting ratings:', err6);
                                        return;
                                    }
                                    console.log('Test data inserted successfully');
                                });
                            });
                        });
                    });
                });
            } else {
                connection.release();
                console.log('Test data already exists');
            }
        });
    });
}

setTimeout(insertTestData, 1000);

app.use('/api', apiRoutes);

app.use(function(req, res, next) {
    res.status(404).send('Not Found');
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send('Error');
});

module.exports = app;
