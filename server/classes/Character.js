class Character {
  constructor(hash) {
    this.hash = hash;
    this.lastUpdate = new Date().getTime();
    this.x = 1;
    this.y = 2;
    this.prevX = 3;
    this.prevY = 4;
    this.destX = 5;
    this.destY = 6;
    this.height = 100;
    this.width = 100;
    this.frame = 0;
    this.frameCount = 0;
    this.alpha = 0;
    this.direction = 0;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveDown = false;
    this.moveUp = false;
  }
  
  //function to convert an int to serialized bytes for a buffer
  /**
      Will add two bytes to a buffer.
      One byte will be for how multiples of 256 this value is
      One byte will be for the remainder
      the value 300 is 256 + 44
      The first byte (how many 256s there are) will be 1
      The second byte will be 44
      Thus when it's reassembled it will be (256 * 1) + 44
      
      The number 513 would be 2 256s and a remainder of 1
      The first byte would be 2
      The second byte will be 1
      When it's reassembled it will be (256 * 2) + 1 
  **/
  static writeIntToBuffer(buffer, integerValue, offset) {
    //forcing positive numbers (this means our app can only use positive numbers)
    //negative numbers are possible, but they can't be an unsigned int.
    //Unsigned values do not support negatives, while signed do.
    //If we want to use negative numbers, we would need to write a signed int
    //which is possible. 
    const intValue = (integerValue < 0) ? 0 : integerValue;
    
    /**
      Each byte can hold a value of 0 to 255 (or 256 values)
      so we need to see how many times 256 goes into our int
      to find out how many bytes there are. 
      This means we do not need to send every byte, just one byte
      for the number of times this goes into 256 and one byte for the remainder.
      Our second byte is the remainder of 256. 
      Based on these two numbers, we can reassemble the number.
      the value 300 is 256 + 44
      The first byte (how many 256s there are) will be 1
      The second byte will be 44
      Thus when it's reassembled it will be (256 * 1) + 44
      
      The number 513 would be 2 256s and a remainder of 1
      The first byte would be 2
      The second byte will be 1
      When it's reassembled it will be (256 * 2) + 1 
    **/
    const byteCount = Math.floor(intValue / 256);
    const remainder = Math.floor(intValue % 256);
    
    //add our bytes to the array and increase the offset. 
    buffer.writeUInt8(byteCount, offset);
    buffer.writeUInt8(remainder, offset+1);
    
    return buffer;
  }
  
  //serialize character to a single byte array
  //This will convert our character to a small byte array
  //that we can send and will save us network time. 
  /**
    Note: The caveat to this is socket.io does it for us
    but socket.io will not always be there and often we need 
    to do this ourselves, especially for custom procotols or 
    certain types of protocols.
  **/
  static toCharacterMessage(charObj) {
    let totalLength = 0; //length to allocate for final message
    
    //get the byte value from our hash (character string id)
    //This will convert the character hash to bytes that we can
    //send in our byte array
    const hashBuffer = Buffer.from(charObj.hash, 'utf-8');
    //get the length of our buffer so we can add it to our total to allocate
    const hashLength = hashBuffer.byteLength;
    //add to our total length. We need to know the exact number of bytes we are sending.
    totalLength += hashLength;

    //allocate a buffer (byte array) of 8 bytes that we can store a date value in
    //Dates are stored as a double (8 bytes) so that tells us how much to allocate
    const dateBuffer = Buffer.alloc(8); //8 bytes in a double
    //write double, read on the client as getFloat64 from dataview
    /**
      We will write the last update date as a double to our date buffer. 
      Oddly enough, we need to read this back out as a float64 on the client-side. 
      That's unusual but is a difference between Node.js and browsers. 
      Browsers don't have true doubles, but they have float64 which is an 8 byte
      float (the same number of bytes as a double). 
      
      The BE part stands for Big Endian. When writing multiple bytes, you can
      choose to store them as Little Endian or Big Endian. Most things are
      stored as Little Endian, especially in modern computers. 
      
      Little Endian means reverse order, meaning 123 would be stored as 321. 
      Initially that may be confusing, but when we do operations, the computer 
      and most math starts with the least significant bit 
      (which is now in our first position in memory). 
      As a result, Little Endian makes the most sense for computers. 
      This also means we can easily make the number bigger by appending
      another bit to the end (since the last is the most significant bit).
      
      Big Endian (or network byte order) is storing the values in human order
      123 would be stored as 123. The most significant value is stored first.
      Though computers do not usually store data like this, it's important in
      networking. The idea here is that we get data as it comes in. 
      For example, if I am transmitting the world 'hello' and I transmit it as
      olleh (little endian order), then the client must wait for the entire 
      message to finish.
      
      If I transmit 'hello' in big endian, then I will receive letters one at a time.
      Starting with 'h' which allows me to start processing and using the data before
      the rest has arrived.
      
      These days it's less important on the network, but Big Endian is still the standard.
      
      https://en.wikipedia.org/wiki/Endianness
      https://softwareengineering.stackexchange.com/questions/95556/what-is-the-advantage-of-little-endian-format
    **/
    dateBuffer.writeDoubleBE(charObj.lastUpdate);
    //get the byte length of our date 
    const dateLength = dateBuffer.byteLength;
    totalLength += dateLength; //add it to the total bytes we are going to need

    //each numeric value, we will send 2 bytes for
    /**
      One byte will be for how multiples of 256 this value is
      One byte will be for the remainder
      the value 300 is 256 + 44
      The first byte (how many 256s there are) will be 1
      The second byte will be 44
      Thus when it's reassembled it will be (256 * 1) + 44
      
      The number 513 would be 2 256s and a remainder of 1
      The first byte would be 2
      The second byte will be 1
      When it's reassembled it will be (256 * 2) + 1 
    **/
    totalLength += 2; //bytes for x value
    totalLength += 2; //bytes for y value
    totalLength += 2; //bytes for prevX
    totalLength += 2; //bytes for prevY
    totalLength += 2; //bytes for destX
    totalLength += 2; //bytes for destY
    totalLength += 2; //bytes for height
    totalLength += 2; //bytes for width
    totalLength += 2; //bytes for frame
    totalLength += 2; //bytes for frameCounter
    
    totalLength += 4; //bytes for alpha (FLOAT)
    
    totalLength += 1; //byte for direction (can only be 0-9 in this app)
    
    totalLength += 1; //byte for moveLeft (boolean can only be 0 or 1)
    totalLength += 1; //byte for moveRight (boolean can only be 0 or 1)
    totalLength += 1; //byte for moveDown (boolean can only be 0 or 1)
    totalLength += 1; //byte for moveUp (boolean can only be 0 or 1)
    
    //offset to know where in our buffer to write. The defaut is 0.
    //Since we want to write in specific positions, we need to keep
    //track of that position. 
    let offset = 0;
    
    //allocate as much memory needed + a byte for each varying length variable
    //2 varying length variables were sending - hash + date. 
    //We will send special bytes saying the number of bytes being recieved
    //for varying length variables (like hash and date)
    //Otherwise the client will not know how to parse the data from them
    let message = Buffer.alloc(totalLength + 2);
    
    //write our hash length (1 byte) so the client knows how long the hash is
    message.writeInt8(hashLength);
    offset += 1; //increase offset by amount written
    
    //write our hash buffer to the message starting at the offset.
    //copy takes a buffer and adds it to a listed buffer at the given offset
    //If the offset is wrong, it might overwrite position in the listed buffer
    hashBuffer.copy(message, offset);
    offset += hashLength; //increase offset by amount written
    
    //write our date length (1 byte) so the client knows how long the date is
    message.writeInt8(dateLength, offset);
    offset += 1; //increase offset by amount written
    
    //write our date buffer to the message starting at the offset
    dateBuffer.copy(message, offset);
    offset += dateLength; //increase offset by amount written
    
    //write our x position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.x, offset);
    offset += 2; //increase offset by amount written
    
    //write our y position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.y, offset);
    offset += 2; //increase offset by amount written
    
    //write our prevX position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.prevX, offset);
    offset += 2; //increase offset by amount written
    
    //write our prevY position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.prevY, offset);
    offset += 2; //increase offset by amount written
    
    //write our destX position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.destX, offset);
    offset += 2; //increase offset by amount written
    
    //write our destY position to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.destY, offset);
    offset += 2; //increase offset by amount written
    
    //write our height to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.height, offset);
    offset += 2; //increase offset by amount written
    
    //write our width to the buffer using our custom function
    message = Character.writeIntToBuffer(message, charObj.width, offset);
    offset += 2; //increase offset by amount written
    
    //write our frame number to the buffer using our custom function.
    //we can do this because our frame number is an int
    message = Character.writeIntToBuffer(message, charObj.frame, offset);
    offset += 2; //increase offset by amount written
    
    //write our frame count to the buffer using our custom function.
    //we can do this because our frame number is an int
    message = Character.writeIntToBuffer(message, charObj.frameCount, offset);
    offset += 2; //increase offset by amount written

    //write our alpha value to the buffer using writeFloatBE. 
    //Refer to dateBuffer for an explanation of big vs small endian
    message.writeFloatBE(charObj.alpha, offset);
    offset += 4; //increase offset by amount written
    
    //write our direction value to the buffer
    //we can do this because direction is an int from 0-8
    message.writeInt8(charObj.direction, offset);
    offset += 1; //increase offset by amount written
    
    //write our moveLeft boolean to the buffer
    //booleans are written as an int from 0 to 1
    message.writeInt8(charObj.moveLeft, offset);
    offset += 1; //increase offset by amount written
    
    //write our moveRight boolean to the buffer
    //booleans are writtenas an int from 0 to 1
    message.writeInt8(charObj.moveRight, offset);
    offset += 1; //increase offset by amount written
    
    //write our moveDown boolean to the buffer
    //booleans are written as an int from 0 to 1
    message.writeInt8(charObj.moveDown, offset);
    offset += 1; //increase offset by amount written
    
    //write our moveUp boolean to the buffer
    //booleans are written as an int from 0 to 1
    message.writeInt8(charObj.moveUp, offset);
    offset += 1; //increase offset by amount written

    //return serialized message
    return message;
  }
}

module.exports = Character;
