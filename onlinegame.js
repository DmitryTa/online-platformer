function OnlineGame(plans, Display) {
    Game.apply(this, arguments);
}

OnlineGame.prototype = Object.create(Game.prototype);

var movesGet = {};

OnlineGame.prototype.initLevel = function(n) {
    var self = this;
    Game.prototype.initLevel.apply(this, arguments);
    this.level.isOnline = true;
    this.level.initOnlinePlayer();
    this._timerId = setInterval(function() {
        self.checkPosition(self.level.player.pos);
    }, 2500);
    if (!this.socket) {
        this.socket = socket = io.connect();
        socket.on("checkPosition", function(pos) {
            self.level.onlinePlayer.pos = new Vector(pos.x, pos.y);
        }).on("disconnect", function() {
            console.log("DISCONNECTED");
        }).on("levelChange", function(nextLevel) {
            if (self.level.currentLevelPlan == nextLevel) return;
            self.changeLevel(nextLevel);
        }).on("getMoves", function(data) {
            movesGet = data;
        });
    }
    this._timerIdSendMoves = setInterval(function() {
        self.sendMoves(self.level.player.moves);
    }, 50);
};

OnlineGame.prototype.run = function() {
    Game.prototype.run.apply(this);
};

Game.prototype._checkStatus = function(status) {
    var n = this.currentLevel;
    if (status == "lost") {
        this.changeLevel(n);
    } else if (n < this.PLANS.length - 1) {
        this.compareLevel(this.currentLevel + 1);
        this.changeLevel(n + 1);
    } else console.log("You win!");
};

OnlineGame.prototype.changeLevel = function(n) {
    clearInterval(this._timerId);
    clearInterval(this._timerIdSendMoves);
    Game.prototype.changeLevel.apply(this, arguments);
};

OnlineGame.prototype.compareLevel = function(nextLevel) {
    this.socket.emit("levelChange", nextLevel);
};

OnlineGame.prototype.checkPosition = function(pos) {
    this.socket.emit("checkPosition", pos);
};

OnlineGame.prototype.sendMoves = function(data) {
    if (data == null) return;
    this.socket.emit("sendMoves", data);
};