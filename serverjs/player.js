(function () {
    var fs = require('fs');
    var uuid = require('uuid/v4');
    var nameGen = require('./namegen');
    var world = require('./world');
    var auth = require('./auth');
    var Entity = require('./entity');

    class Player extends Entity {
        constructor(id, name) {
            super();
            this.id = id;
            this.name = name;
            this.status = {
                'hp': 7,
                'max_hp': 10,
                'sp': 10,
                'max_sp': 10,
                'ap': 0,
                'ap_recovery': 25,
                'max_ap': 60,
            }
            this.sheet = {
                'BOD': {
                    'STR': 1,
                    'END': 2,
                    'CON': 3
                }, 'MOV': {
                    'AGI': 4,
                    'DEX': 5,
                    'SPD': 6
                }, 'MNT': {
                    'CHA': 7,
                    'LOG': 8,
                    'WIS': 9
                }, 'OTH': {
                    'MEM': 10,
                    'WIL': 11,
                    'LCK': 12
                }, 'MNA': {
                    'CAP': 13,
                    'CND': 14,
                    'GEN': 15
                }, 'FTH': {
                    'CVN': 16,
                    'PTY': 17,
                    'FVR': 18
                }
            }
        }
        move(direction) {
            var dir = world.directionVectors[direction];
            var newLoc = {
                instance: this.location.instance,
                x: this.location.x + dir.x,
                y: this.location.y + dir.y,
            }
            world.moveEntity(this, newLoc);
        }
    }

    var players = {};
    function accessPlayer(id) {
        return players[id];
    }
    function generateNewPlayerID() {
        return uuid();
    }
    function createPlayer() {
        var name = nameGen.generateName();
        while (getPlayerByName(name)) {
            name = nameGen.generateName()
        }
        var plr = new Player(generateNewPlayerID(), name);
        players[plr.id] = plr;
        world.spawnInRandomEmptyLocation(plr);
        //savePlayer(plr.id);
        return plr;
    }
    function loadPlayer(id, name) {
        //TODO: load from file
        var plr = new Player(id, name)
        players[plr.id] = plr;
        world.spawnInRandomEmptyLocation(plr);
        return plr;
    }
    function getPlayerByName(name) {
        return Object.values(players).find(value => value.name === name);
    }
    function deletePlayerById(id) {
        delete players[id];
    }
    module.exports.createPlayer = createPlayer;
    module.exports.loadPlayer = loadPlayer;
    module.exports.getPlayerByName = getPlayerByName;
    module.exports.accessPlayer = accessPlayer;
    module.exports.deletePlayerById = deletePlayerById
}());