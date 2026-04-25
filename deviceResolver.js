const deviceService = require('./services/deviceService');

module.exports = {
  devices: () => deviceService.getAll(),

  device: ({ id }) => deviceService.getById(id),

  devicesByUser: ({ userId }) => deviceService.getByUser(userId),

  addDevice: (args) => deviceService.create(args),

  updateDevice: (args) => deviceService.update(args.id, args),

  deleteDevice: ({ id }) => deviceService.remove(id)
};