// combat.js
const db = new sqlite3.Database('rpg.db');

function attack(userId, callback) {
    // Retrieve user's current stats
    db.get(`SELECT * FROM user_profiles WHERE user_id = ?`, [userId], (err, profile) => {
        if (err) {
            console.error("Could not retrieve profile for combat: " + err.message);
            return callback(null, 'Error in retrieving profile.');
        }

        // Simple combat logic: win or lose based on random chance
        const win = Math.random() < 0.5; // 50% chance to win
        let message;
        
        if (win) {
            profile.experience += 10; // Grant experience points
            profile.gold += 5; // Grant some gold
            message = 'You won the fight!';
        } else {
            profile.health -= 10; // Reduce health
            message = 'You lost the fight!';
        }

        // Update the profile in the database
        db.run(`UPDATE user_profiles SET health = ?, experience = ?, gold = ? WHERE user_id = ?`, 
               [profile.health, profile.experience, profile.gold, userId]);

        return callback(profile, message);
    });
}

module.exports = { attack };
