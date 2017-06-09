const _ = require('../client/bower_components/underscore/underscore.js');
const url = require('url');
const querystring = require('querystring');
const path = require('path');

const fs = require('fs');
/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10, // Seconds.,
  'Content-Type': 'application/json'
};

var serverStack = [];

var sendFile = function(url, fileName, response) {
  
  fs.stat(fileName, (err, file) => {
    if (!err && file.isDirectory()) {
      // console.log('before: ', fileName);
      fileName += '/index.html';
      // console.log(fileName);
    }
    fs.exists(fileName, (exists) => {
      if (!exists) {
        response.writeHead(404, defaultCorsHeaders);
        response.end(`404: resource ${url} not found.`);
        return;
      } else {
        fs.readFile(fileName, (err, data) => {
          if (err) {
            response.writeHead(500, defaultCorsHeaders);
            response.end(`Server error: ${err}`);
          } else {
            response.end(data.toString('utf-8'));
          }
        });
      }
    });
  });
  
};


var getMessage = function (serverResponse, urlParsed, response) {
  // console.log('Try: ', process.cwd() + '/client');
  let fileName = path.join(process.cwd() + '/client', urlParsed.pathname);
  if (urlParsed.query === 'order=-createdAt') {
    serverResponse.results = serverResponse.results.slice().reverse();
    response.writeHead(200, defaultCorsHeaders);
    response.end(JSON.stringify(serverResponse));
  } else if (!urlParsed.pathname.includes('/classes/messages')) { 
    sendFile(urlParsed, fileName, response);
  } else {
    response.writeHead(200, defaultCorsHeaders);
    response.end(JSON.stringify(serverResponse));
  }
};


var postMessage = function(request, serverResponse, response) {
  var body = [];
  request.on('data', (chunk) => {
    body.push(chunk.toString('utf-8'));
  });
  request.on('end', () => {
    //for tests: 
    // serverStack.push(JSON.parse(body.toString()));
    //for servers:
    var message = querystring.parse(body[0]);
    message.objectId = serverStack.length;
    message.username = decodeURIComponent(message.username);
    console.log('other method: ', message);
    serverStack.push(message);
    response.writeHead(200, defaultCorsHeaders);
    response.end(JSON.stringify(serverResponse));
  });
};


var requestHandler = function(request, response) {
  var headers = defaultCorsHeaders;
  var statusCode = 200;
  let serverResponse = {
    results: serverStack
  };

  var urlParsed = url.parse(request.url);

  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  if (request.method === 'POST') {
    statusCode = 201;
    postMessage(request, serverResponse, response);
  } else if (request.method === 'GET') {
    getMessage(serverResponse, urlParsed, response);
  } else if (request.method === 'OPTIONS') {
    response.writeHead(200, headers);
    response.end();
  }
};



module.exports.requestHandler = requestHandler;

