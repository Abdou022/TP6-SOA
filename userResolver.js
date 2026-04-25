const dbPromise = require("./db");
function toJson(doc) {
  return doc ? doc.toJSON() : null;
}
async function findByEmail(usersCollection, email) {
  return usersCollection
    .findOne({
      selector: { email },
    })
    .exec();
}
async function ensureUniqueEmail(usersCollection, email, excludedId = null) {
  const existing = await findByEmail(usersCollection, email);
  if (existing && existing.primary !== excludedId) {
    throw new Error("Adresse e-mail déjà utilisée");
  }
}
module.exports = {
  user: async ({ id }) => {
    const { users } = await dbPromise;
    const doc = await users.findOne(id).exec();
    return toJson(doc);
  },
  users: async () => {
    const { users } = await dbPromise;
    const docs = await users.find().exec();
    return docs.map((doc) => doc.toJSON());
  },
  addUser: async ({ name, email, password }) => {
    const { users, persistUsers, createId } = await dbPromise;
    await ensureUniqueEmail(users, email);
    const inserted = await users.insert({
      id: createId(),
      name,
      email,
      password,
    });
    await persistUsers(users);
    return inserted.toJSON();
  },
  updateUser: async ({ id, name, email, password }) => {
    const { users, persistUsers } = await dbPromise;
    const doc = await users.findOne(id).exec();
    if (!doc) {
      return null;
    }
    await ensureUniqueEmail(users, email, id);
    const updatedDoc = await doc.incrementalPatch({
      name,
      email,
      password,
    });
    await persistUsers(users);
    return updatedDoc.toJSON();
  },
  deleteUser: async ({ id }) => {
    const { users, persistUsers } = await dbPromise;
    const { devices } = await dbPromise;
    const doc = await users.findOne(id).exec();
    if (!doc) {
      return false;
    }
    const userDevices = await devices.find({
        selector: { userId: id }
    }).exec();

    for (const d of userDevices) {
        await d.remove();
    }
    await doc.remove();
    await persistUsers(users);
    return true;
  },

  devices: async () => {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  return docs.map(d => d.toJSON());
},

addDevice: async ({ userId, name, type, serialNumber, status }) => {
  const { users, devices, createId } = await dbPromise;

  // Vérifier utilisateur existe
  const user = await users.findOne(userId).exec();
  if (!user) {
    throw new Error("User n'existe pas");
  }

  const device = await devices.insert({
    id: createId(),
    userId,
    name,
    type,
    serialNumber,
    status
  });

  return device.toJSON();
}
};
