// character.js
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('rpg.db');

function createProfile(userId, username) {
    const query = `INSERT INTO user_profiles (user_id, username, level, experience, health, mana, gold) VALUES (?, ?, 1, 0, 100, 50, 0)`;
    db.run(query, [userId, username], function (err) {
        if (err) {
            console.error("Could not create profile for user " + username + ": " + err.message);
            return false;
        }
        console.log(`Profile created for user ${username}`);
        return true;
    });
}

function getProfile(userId, callback) {
    const query = `SELECT * FROM user_profiles WHERE user_id = ?`;
    db.get(query, [userId], function (err, row) {
        if (err) {
            console.error("Could not retrieve profile: " + err.message);
            return callback(null);
        }
        return callback(row);
    });
}

function deleteProfile(userId, callback) {
    const query = `DELETE FROM user_profiles WHERE user_id = ?`;
    db.run(query, [userId], function (err) {
        if (err) {
            console.error("Could not delete profile: " + err.message);
            return callback(false);
        }
        console.log(`Profile deleted for user ID ${userId}`);
        return callback(true);
    });
}


module.exports = { createProfile, getProfile, deleteProfile };
