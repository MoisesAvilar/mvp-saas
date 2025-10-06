const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();

const router = jsonServer.router(path.join(__dirname, 'db.json')); 

const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4);
  }
  next();
});

server.use(router);

module.exports = server;