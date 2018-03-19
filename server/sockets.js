const xxh = require('xxhashjs');
const Character = require('./classes/Character.js');

const characters = {};

let io;

const directions = {
  DOWNLEFT: 0,
  DOWN: 1,
  DOWNRIGHT: 2,
  LEFT: 3,
  UPLEFT: 4,
  RIGHT: 5,
  UPRIGHT: 6,
  UP: 7,
};

const handleAttack = (userHash) => {
  io.sockets.in('room1').emit('attackHit', userHash);
};

const setupSockets = (ioServer) => {
  io = ioServer;

  io.on('connection', (sock) => {
    const socket = sock;

    socket.join('room1');

    const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16);

    characters[hash] = new Character(hash);

    socket.hash = hash;

    //serialize character to a byte array using custom function in Character class
    //Normally this is needed in real-time apps, especially when working
    //with a custom protocol or certain types of protocols
    //Conveniently socket.io does this for us, but it will not always be there
    //for us, so we need to know how it works. 
    socket.emit('joined', Character.toCharacterMessage(characters[hash]));

    socket.on('movementUpdate', (data) => {
      characters[socket.hash] = data;
      characters[socket.hash].lastUpdate = new Date().getTime();

      //serialize character to a byte array using custom function in Character class
      //Normally this is needed in real-time apps, especially when working
      //with a custom protocol or certain types of protocols
      //Conveniently socket.io does this for us, but it will not always be there
      //for us, so we need to know how it works. 
      const serializedChar = Character.toCharacterMessage(characters[hash]);
      
      io.sockets.in('room1').emit('updatedMovement', serializedChar);
    });

    socket.on('disconnect', () => {
      
      //serialize character to a byte array using custom function in Character class
      //Normally this is needed in real-time apps, especially when working
      //with a custom protocol or certain types of protocols
      //Conveniently socket.io does this for us, but it will not always be there
      //for us, so we need to know how it works. 
      io.sockets.in('room1').emit('left', Character.toCharacterMessage(characters[hash]));
      delete characters[socket.hash];

      socket.leave('room1');
    });
  });
};

module.exports.setupSockets = setupSockets;
module.exports.handleAttack = handleAttack;
