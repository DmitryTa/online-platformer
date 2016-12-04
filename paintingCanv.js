

function flipHorizontally(context, around) {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
}

var scale = 20;

function CanvasDisplay(parent, level) {
  this.canvas = document.createElement("canvas");
  this.canvas.width = Math.min(800, level.width * scale);
  this.canvas.height = Math.min(700, level.height * scale);
  parent.appendChild(this.canvas);
  this.cx = this.canvas.getContext("2d");

  this.level = level;
  this.animationTime = 0;
  this.flipPlayer = false;

  //==============
  this.flipOnlinePlayer = false;
  //-------------
  
  this.viewport = {
    left: 0,
    top: 0,
    width: this.canvas.width / scale,
    height: this.canvas.height / scale
  };

  this.drawFrame(0);
}

CanvasDisplay.prototype.clear = function() {
  this.canvas.parentNode.removeChild(this.canvas);
};

CanvasDisplay.prototype.drawFrame = function(step) {
  this.animationTime += step;

  this.updateViewport();
  this.clearDisplay();
  this.drawBackground();
  this.drawActors();
};

CanvasDisplay.prototype.updateViewport = function() {
  var view = this.viewport, margin = view.width / 3;
  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5));
  
  if (center.x < view.left + margin)
    view.left = Math.max(center.x - margin, 0);
  else if (center.x > view.left + view.width - margin)
    view.left = Math.min(center.x + margin - view.width,
                         this.level.width - view.width);

  if (center.y < view.top + margin)
    view.top = Math.max(center.y - margin, 0);
  else if (center.y > view.top + view.height - margin)
    view.top = Math.min(center.y + margin - view.height,
                        this.level.height - view.height);
};

CanvasDisplay.prototype.clearDisplay = function() {
  if (this.level.status == "won")
    this.cx.fillStyle = "rgb(68, 191, 255)";
  else if (this.level.status == "lost")
    this.cx.fillStyle = "rgb(44, 136, 214)";
  else
    this.cx.fillStyle = "rgb(52, 166, 251)";
  this.cx.fillRect(0, 0,
                   this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

CanvasDisplay.prototype.drawBackground = function() {
  var view = this.viewport;
  var xStart = Math.floor(view.left);
  var xEnd = Math.ceil(view.left + view.width);
  var yStart = Math.floor(view.top);
  var yEnd = Math.ceil(view.top + view.height);

  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var tile = this.level.grid[y][x];
      if (tile == null) continue;
      var screenX = (x - view.left) * scale;
      var screenY = (y - view.top) * scale;
      var tileX = tile == "lava" ? scale : 0;
      this.cx.drawImage(otherSprites,
                        tileX,         0, scale, scale,
                        screenX, screenY, scale, scale);
    }
  }
};



var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;


CanvasDisplay.prototype.drawPlayer = function(x, y, width, height) {
  var sprite = 8, player = this.level.player;
  width += playerXOverlap * 2;
  x -= playerXOverlap;
  if (player.speed.x != 0)
    this.flipPlayer = player.speed.x < 0;

  if (player.speed.y != 0)
    sprite = 9;
  else if (player.speed.x != 0)
    sprite = Math.floor(this.animationTime * 12) % 8;

  this.cx.save();
  if (this.flipPlayer)
    flipHorizontally(this.cx, x + width / 2);

  this.cx.drawImage(playerSprites, sprite * width, 0, width, height, x, y, width, height);

  this.cx.restore();
};

CanvasDisplay.prototype.drawPlayerOnline = function(x, y, width, height) {
  var sprite = 8, player = this.level.onlinePlayer;
  width += playerXOverlap * 2;
  x -= playerXOverlap;
  if (player.speed.x != 0)
    this.flipOnlinePlayer = player.speed.x < 0;

  if (player.speed.y != 0)
    sprite = 9;
  else if (player.speed.x != 0)
    sprite = Math.floor(this.animationTime * 12) % 8;

  this.cx.save();
  if (this.flipOnlinePlayer)
    flipHorizontally(this.cx, x + width / 2);

  this.cx.drawImage(playerSprites, sprite * width, 0, width, height, x, y, width, height);

  this.cx.restore();
};

CanvasDisplay.prototype.drawActors = function() {
  this.level.actors.forEach(function(actor) {
    var width = actor.size.x * scale;
    var height = actor.size.y * scale;
    var x = (actor.pos.x - this.viewport.left) * scale;
    var y = (actor.pos.y - this.viewport.top) * scale;
    if (actor.type == "player") {
      this.drawPlayer(x, y, width, height);
    } else if (actor.type == 'onlinePlayer') {
      this.drawPlayerOnline(x, y, width, height);
    } else {
      var tileX = (actor.type == "coin" ? 2 : 1) * scale;
      this.cx.drawImage(otherSprites,
                        tileX, 0, width, height,
                        x,     y, width, height);
    }
  }, this);
};


var arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}


var arrows = trackKeys(arrowCodes);



function Game(plans, Display) {
   this.PLANS = plans;
   this.displayMethod = Display;
}

Game.prototype.initLevel = function(n) { 
  this.currentLevel = n;
  this.level = new Level(this.PLANS[n]);
  this.display = new this.displayMethod(document.body, this.level);
}

Game.prototype.run = function() {
 
    var level = this.level,
    self = this;

    this._runAnimation(function(step) {
      level.animate(step, arrows);
      self.display.drawFrame(step);

      if (level.isFinished()) {
        self._checkStatus(level.status);
        return false;
      }
    })
}

Game.prototype._runAnimation = function(frameFunc) {
  
    var lastTime = null,
      self = this;

    function frame(time) {
      var stop = false;
      if (lastTime != null) {
        var timeStep = Math.min(time - lastTime, 100) / 1000;
        stop = frameFunc(timeStep) === false;
      }
      lastTime = time;
      if (!stop)
       self._requestId = requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

Game.prototype._checkStatus = function(status) {

   var n = this.currentLevel;
    if (status == "lost") { 
        this.changeLevel(n);     
      } else if (n < this.PLANS.length - 1) { 
        this.changeLevel(n + 1);
      } else
        console.log("You win!");
}

Game.prototype.changeLevel = function(n) {
  if (!this.display) return;
  this.stop();
  this.display.clear();
  this.initLevel(n);
  this.run();
}

Game.prototype.stop = function() {
  cancelAnimationFrame(this._requestId);
}

Game.prototype.destroy = function() {
  this.stop();
  this.display.clear();
}


/*
 var game = new Game(GAME_LEVELS, CanvasDisplay);
     game.initLevel(0);
     game.run();



Game.prototype.run = function() {
 
    level = this.level,
    plans = this.levelPlans,
    n = this.currentLevelPlan,
    self = this;


  runAnimation(function(step) {
    level.animate(step, arrows);
    self.display.drawFrame(step);

    if (level.isFinished()) {
      if (checkStatus)
        checkStatus(level.status);
      return false;
    }
  });
  
  function runAnimation(frameFunc) {
    var lastTime = null;
    function frame(time) {
      var stop = false;
      if (lastTime != null) {
        var timeStep = Math.min(time - lastTime, 100) / 1000;
        stop = frameFunc(timeStep) === false;
      }
      lastTime = time;
      if (!stop)
       self._requestId = requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function checkStatus(status) {
      if (status == "lost") { 
        self.changeLevel(n);     
      } else if (n < self.PLANS.length - 1) { 
        if(self.level.isOnline) 
          levelChange(n + 1)
        self.changeLevel(n + 1);
      }
      else
        console.log("You win!");
    }

}
 */