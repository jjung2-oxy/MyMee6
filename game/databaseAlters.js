
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('rpg.db'); // This will create an rpg.db file


db.run(`SELECT * FROM user_profiles'`, [], function (err, rows) {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log(rows);
});

db.close();