function GameControl(otions) {
    this.elem = otions.elem;
    this.createRoomForm = form = this.elem.querySelector("form");
    this.roomList = otions.roomList;
    this.infoBlock = otions.info;
    this.socket = otions.socket;
    this.game = otions.game;
    var self = this;
    this.room = null;
    
    this.socket.on("addRoom", function(room) {
        self.addRoom(room);
    }).on("deleteRoom", function(room) {
        self.deleteRoom(room);
    }).on("udatePlayers", function(room) {
        self.updateRoom(room);
    }).on("clientError", function(errText) {
        self.showInfo(errText, "error");
    }).on("info", function(infoText) {
        self.showInfo(infoText, "info");
    }).on("loadRooms", function(rooms) {
        self.loadAllRooms(rooms);
    });
    form.addEventListener("submit", function(e) {
        var input = form.querySelector("input");
        if (input.value.length == 0) {
            self.showInfo("Введите название для игры", "error");
        } else {
            socket.emit("createRoom", input.value, function() {
                var widgetEvent = new CustomEvent("createdRoom", {
                    bubbles: true
                });
                self.elem.dispatchEvent(widgetEvent);
            });
            input.value = "";
        }
        e.preventDefault();
    });
    this.roomList.addEventListener("click", function(e) {
        var target = e.target;
        while (target != this) {
            if (target.tagName == "LI") {
                socket.emit("joinRoom", target.firstElementChild.textContent, function() {
                    var widgetEvent = new CustomEvent("joinedRoom", {
                        bubbles: true,
                        detail: target
                    });
                    self.elem.dispatchEvent(widgetEvent);
                });
                self.game.compareLevel(self.game.currentLevel);
                return;
            }
            target = target.parentElement;
        }
    });
}

GameControl.prototype.loadAllRooms = function(rooms) {
    var self = this;
    rooms.forEach(function(room) {
        self.addRoom(room);
    });
};

GameControl.prototype.addRoom = function(room) {
    var li = document.createElement("li");
    var spanRoomName = document.createElement("span");
    spanRoomName.textContent = room.name;
    var spanRoomPlayers = document.createElement("span");
    spanRoomPlayers.textContent = room.players + "/2";
    li.appendChild(spanRoomName);
    li.appendChild(spanRoomPlayers);
    this.roomList.appendChild(li);
};

GameControl.prototype.deleteRoom = function(room) {
    var list = this.roomList.children;
    [].forEach.call(list, function(li) {
        if (li.firstElementChild.textContent == room.name) {
            li.parentElement.removeChild(li);
        }
    });
};

GameControl.prototype.updateRoom = function(room) {
    var list = this.roomList.children;
    [].forEach.call(list, function(li) {
        if (li.firstElementChild.textContent == room.name) {
            li.children[1].textContent = room.players + "/2";
        }
    });
};

GameControl.prototype.showInfo = function(text, type) {
    var info = this.infoBlock;
    if (info.children.length > 3) {
        info.removeChild(info.firstElementChild);
    }
    var message = document.createElement("p");
    message.classList.add("info__message");
    if (type == "error") {
        message.classList.add("info__message_error");
    }
    if (type == "info") {
        message.classList.add("info__message_info");
    }
    message.textContent = text;
    info.appendChild(message);
    setTimeout(function() {
        if (!info.contains(message)) return;
        info.removeChild(message);
    }, 3e3);
};