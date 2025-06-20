const express = require('express');
const router = express.Router();

router.get('/dogs', function(req, res, next) {
    req.pool.getConnection(function(error, connection) {
        if (error) {
            res.status(500).json({ error: 'Database connection error' });
            return;
        }

        connection.query('SELECT d.name as dog_name, d.size, u.username as owner_username FROM Dogs d JOIN Users u ON d.owner_id = u.user_id', function(err, rows) {
            connection.release();

            if (err) {
                res.status(500).json({ error: 'Database query error' });
                return;
            }

            res.json(rows);
        });
    });
});

router.get('/walkrequests/open', function(req, res, next) {
    req.pool.getConnection(function(error, connection) {
        if (error) {
            res.status(500).json({ error: 'Database connection error' });
            return;
        }

        connection.query('SELECT wr.request_id, d.name as dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username as owner_username FROM WalkRequests wr JOIN Dogs d ON wr.dog_id = d.dog_id JOIN Users u ON d.owner_id = u.user_id WHERE wr.status = "open"', function(err, rows) {
            connection.release();

            if (err) {
                res.status(500).json({ error: 'Database query error' });
                return;
            }

            res.json(rows);
        });
    });
});

router.get('/walkers/summary', function(req, res, next) {
    req.pool.getConnection(function(error, connection) {
        if (error) {
            res.status(500).json({ error: 'Database connection error' });
            return;
        }

        connection.query('SELECT u.username as walker_username, COUNT(wr.rating) as total_ratings, AVG(wr.rating) as average_rating, COUNT(wa.application_id) as completed_walks FROM Users u LEFT JOIN WalkRatings wr ON u.user_id = wr.walker_id LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = "accepted" WHERE u.role = "walker" GROUP BY u.user_id, u.username', function(err, rows) {
            connection.release();

            if (err) {
                res.status(500).json({ error: 'Database query error' });
                return;
            }

            res.json(rows);
        });
    });
});

module.exports = router;
