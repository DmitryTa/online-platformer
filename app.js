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
	} else if(path == '/index') {
		sendFile('index/run.html', res);
	} else {
		sendFile(path, res);
	}
}).listen(process.env.port);


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

io.on('connection', function (socket) {

  socket.on('moving', function (data) {
    socket.broadcast.emit('getData', data);
  });
   
});

