let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO is not initialized.");
  }

  return ioInstance;
};

module.exports = {
  getIO,
  setIO
};
