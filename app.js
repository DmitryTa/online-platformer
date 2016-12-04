var http = require('http');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var url = require('url');
ROOT = __dirname;
var server = http.createServer(function(req,res) {
	var path = url.parse(req.url).pathname;
	if (path == '/') {
		sendFile('run.html', res);
	} else {
		sendFile(path, res);
	}
}).listen(process.env.port || 81);


function sendFile(filePath, res) {
	var filePath = decodeURIComponent(filePath);
	filePath = path.normalize(path.join(ROOT, filePath));
  fs.readFile(filePath, function(err, content) {
    if (err) {
    	res.writeHead(404, http.STATUS_CODES[404]);
    	res.end();
    }

    var mime = require('mime').lookup(filePath); 
   
    res.setHeader('Content-Type', mime + "; charset=utf-8"); 
    res.end(content);
  });
}




var io = require('socket.io')(server);

var rooms = [];

var test = new Room('test-1');
var tes2 = new Room('test-2');

function Room(name) {
  this.name = name;
  this.players = 0;
  rooms.push(this);
}

function findRoomByName(name) {
  return rooms.filter(function(room) {
    return room.name == name;
  })[0];
}

function leaveRoom(socket) {
  currentRoom = findRoomByName(socket.room);
  if(currentRoom == undefined) {
    socket.emit('clientError', 'Вы не играете в комнате');
  }
  socket.leave(socket.room);
  socket.broadcast.to(socket.room).emit('info', 'Игрок покинул комнату');
  --currentRoom.players;
  if(currentRoom.players == 0) {
    rooms = rooms.filter(function(room) {
      return room.name != socket.room;
    }); 
    socket.broadcast.emit('deleteRoom', currentRoom);
    socket.emit('deleteRoom', currentRoom);
  } else {
    socket.broadcast.emit('udatePlayers', currentRoom);
    socket.emit('udatePlayers', currentRoom);
  }
  socket.room = null;
}

function createRoom(socket, newRoom, callback) {
  if(newRoom.length > 12) {
    newRoom = newRoom.substring(0, 10) + '...';
  }
  if (newRoom.length == 0) {
    socket.emit('clientError', 'Room must have name');
    return;
  }
  if(rooms.some(function(room) {
      return room.name == newRoom;
    })) {
      socket.emit('clientError', 'Room with the name '+newRoom+' is already exist');
      return;
    } 
  var room = new Room(newRoom);
  socket.broadcast.emit('addRoom', room);
  socket.emit('addRoom', room);
  socket.emit('info', 'Вы создали игру ' + room.name);
  if(callback && callback());
}

function joinRoom(socket, roomName, callback) {
  var room = findRoomByName(roomName);
  if(room == undefined) {
    socket.emit('clientError', 'Room with the name '+roomName+' does not exist');
    return;
  } ;
  if(room.players > 1 || room.name == socket.room)  {
    socket.emit('clientError', 'Max players limit or you are already in');
    return;
  };
  if(socket.room) {
    leaveRoom(socket);
  };
  room.players++;
  socket.room = room.name;
  socket.join(roomName);
  
  socket.broadcast.emit('udatePlayers', room);
  socket.emit('udatePlayers', room);
  socket.broadcast.to(socket.room).emit('info', 'К вам присоединился другой игрок');
  socket.emit('info', 'Вы вошли в игру ' + socket.room);
  if(callback && callback());
}


io.on('connection', function (socket) {
  socket.emit('loadRooms', rooms);
  socket.on('sendMoves', function (data) {
   socket.broadcast.to(socket.room).emit('getMoves', data);
  });

  socket.on('checkPosition', function (pos) {
     socket.broadcast.to(socket.room).emit('checkPosition', pos);
  });

  socket.on('levelChange', function (nextLevel) {
     socket.broadcast.to(socket.room).emit('levelChange', nextLevel);
  }); 
  socket.on('disconnect', function () {
      if(socket.room) {
        leaveRoom(socket);
      } 
    });

  socket.on('createRoom', function (newRoom, callback) {
     createRoom(socket, newRoom, callback);
  });
  socket.on('joinRoom', function (roomName, callback) {
     joinRoom(socket, roomName, callback);    
     
  });


   
});

