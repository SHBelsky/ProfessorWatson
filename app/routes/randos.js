/*eslint-env node */
var FIRST_NAMES = [
    'Anna', 'Bobby', 'Cameron', 'Danny', 'Emmett', 'Frida', 'Gracie', 'Hannah',
    'Isaac', 'Jenova', 'Kendra', 'Lando', 'Mufasa', 'Nate', 'Owen', 'Penny',
    'Quincy', 'Roddy', 'Samantha', 'Tammy', 'Ulysses', 'Victoria', 'Wendy',
    'Xander', 'Yolanda', 'Zelda'
];

function randomUsername() {
    function rando(arr) {
        return arr[Math.floor(Math.random()*arr.length)];
    }
    return "Pokemon Trainer " + rando(FIRST_NAMES);
}

module.exports = randomUsername;
