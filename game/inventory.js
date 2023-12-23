
function getInventory(userId, callback) {
    db.all(`SELECT item_name, quantity FROM inventory WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) {
            console.error("Could not retrieve inventory: " + err.message);
            return callback(null);
        }
        return callback(rows);
    });
}

module.exports = { getInventory };