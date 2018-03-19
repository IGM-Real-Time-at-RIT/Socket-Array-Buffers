//function to get an int back from our custom buffer.
//We stored most of the ints as multiple of 256 and their remainder
//We sent two bytes (one for number of 256 values and one for remainder)
//function takes the buffer and the offset (position) to start reading from
const getIntFromBuffer = (buffer, offset) => {
  let val = 0; //default value

  //grab the first byte as uint8 and multiply it by 256
  //to get the number of 256 values in this
  //For example 300 would be 256 + 44
  //That means we'd have 1 256 with a remainder of 44
  //If our value as 520, then we'd have a 2 for the first byte
  //That means 2 times 256 (512) with a remainder of 8 (in the second byte)
  val += buffer.getUint8(offset) * 256;
  //grab the remainder from our next byte
  val += buffer.getUint8(offset+1);
    
  //return assembled int
  return val;
};

//function to deserialize our custom buffer back into a character
//We need to know very carefully what is in each position.
const parseCharacter = (data) => {
  //index to read from in buffer so we don't lose our place
  let totalOffset = 0; 
  
  /**
    Please note: We actually know the lengths of everything in the
    buffer but I wanted to write out the offsets and lengths manually
    for our understanding. This could be way more optimized since we 
    already know how many bytes we used.
  **/
  

  //decoder for decoding bytes into text
  const decoder = new TextDecoder();

  //cast our buffer to a dataview.
  //A dataview is essentially a buffer on the client side
  //since browsers don't contain a Buffer class
  const myData = new DataView(data); //cast to data view

  //read out our first byte (which we know is the hash length)
  //this will tell us how much more to read to accept as the hash
  //value since our client has no clue
  const hashLength = myData.getInt8();
  //hash length is 1 byte so increase our index in the buffer
  totalOffset += 1; 

  //cast our hash into a dataview (of only that value)
  //and ask the dataview to decode its value which will
  //convert it to a string for us.
  //If we used the dataview above it would have
  //decoded the entire buffer into a string and it would have
  //been mangled data. 
  const hashView = new DataView(data, 1, hashLength);
  const hash = decoder.decode(hashView);
  totalOffset += hashLength; //add the length of hash to our offset

  //grab our date length from the buffer (since the client doesnt know)
  //we know this comes after the hash (but only know position) based
  //on the calculated offset based on previous data
  const dateLength = myData.getInt8(totalOffset);
  totalOffset += 1; //add the length of the hash to our offset

  //grab a float64 from the buffer since we know date is a float64
  const lastUpdate = myData.getFloat64(totalOffset);
  totalOffset += dateLength; //add to our offset

  //grab an int8 from the buffer for x
  const x = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int8 from the buffer for y
  const y = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for prevX
  const prevX = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for prevY
  const prevY = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for destX
  const destX = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for destY
  const destY = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for height
  const height = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for width
  const width = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for our frame
  const frame = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //grab an int from the buffer for the frame count
  const frameCount = getIntFromBuffer(myData, totalOffset);
  totalOffset += 2; //add to our offset

  //create a dataview just of the alpha bytes so we can get a float
  const alphaView = new DataView(data, totalOffset, 4);
  //pull a float from our custom dataview
  const alpha = alphaView.getFloat32();
  totalOffset += 4; //add the length of hash to our offset

  //grab an int from the buffer for the direction
  //We know this is only one byte since direction is 0-8
  const direction = myData.getUint8(totalOffset);
  totalOffset += 1; //add to our offset

  //grab an int from the buffer for the boolean moveLeft
  const moveLeft = myData.getUint8(totalOffset);
  totalOffset += 1; //add to our offset

  //grab an int from the buffer for the boolean moveRight
  const moveRight = myData.getUint8(totalOffset);
  totalOffset += 1; //add to our offset

  //grab an int from the buffer for the boolean moveDown
  const moveDown = myData.getUint8(totalOffset);
  totalOffset += 1; //add to our offset

  //grab an int from the buffer for the boolean moveUp
  const moveUp = myData.getUint8(totalOffset);
  totalOffset += 1; //add to our offset
  
  //reconstruct our character from the deserialized data
  const character = {
    hash: hash,
    lastUpdate: lastUpdate,
    x: x,
    y: y,
    prevX: prevX,
    prevY: prevY,
    destX: destX,
    destY: destY,
    height: height,
    width: width,
    frame: frame,
    frameCount: frameCount,
    alpha: alpha,
    direction: direction,
    moveLeft: moveLeft,
    moveRight: moveRight,
    moveDown: moveDown,
    moveUp: moveUp,
  };
  
  //return the character
  return character;
};

const update = (dataObj) => {
  
  //call to deserialize the data into a character object
  const data = parseCharacter(dataObj);
  
  if(!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  if(data.hash === hash) {
    return;
  }

  if(squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  const square = squares[data.hash];
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;
};

const removeUser = (dataObj) => {
  const data = parseCharacter(dataObj);
  
  if(squares[data.hash]) {
    delete squares[data.hash];
  }
};

const setUser = (dataObj) => {
  const data = parseCharacter(dataObj);
  
  hash = data.hash;
  squares[hash] = data;
  requestAnimationFrame(redraw);
};

const updatePosition = () => {
  const square = squares[hash];

  square.prevX = square.x;
  square.prevY = square.y;

  if(square.moveUp && square.destY > 0) {
    square.destY -= 2;
  }
  if(square.moveDown && square.destY < 400) {
    square.destY += 2;
  }
  if(square.moveLeft && square.destX > 0) {
    square.destX -= 2;
  }
  if(square.moveRight && square.destX < 400) {
    square.destX += 2;
  }

  if(square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if(square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if(square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if(square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if(square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if(square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if(square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if(square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  square.alpha = 0.05;

  socket.emit('movementUpdate', square);
};