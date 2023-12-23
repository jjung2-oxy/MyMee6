const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('rpg.db'); // This will create an rpg.db file

db.serialize(function () {
    db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0
    )`, [], function (err) {
        if (err) {
            console.error("Error creating table: " + err.message);
            return;
        }
        console.log("Table created successfully");
        db.close();
    });
});

db.close();
