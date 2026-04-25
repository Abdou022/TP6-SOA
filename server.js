const fs = require("fs");
const path = require("path");
const express = require("express");
const { buildSchema } = require("graphql");
const { createHandler } = require("graphql-http/lib/use/express");
const dbPromise = require("./db");
const userResolver = require("./userResolver");
const app = express();
const port = 5000;
const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, "schema.gql"), "utf8")
);
app.get("/", (req, res) => {
  res.json({
    message: "TP7 REST/GraphQL avec RxDB",
    rest: {
      list: "GET /users",
      one: "GET /users/:id",
      create: "POST /users",
      update: "PUT /users/:id",
      delete: "DELETE /users/:id",
    },
    graphql: "POST /graphql",
  });
});
app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue: userResolver,
  })
);
app.use(express.json());
app.get("/users", async (req, res) => {
  const { users } = await dbPromise;
  const docs = await users.find().exec();
  res.json(docs.map((doc) => doc.toJSON()));
});
app.get("/users/:id", async (req, res) => {
  const { users } = await dbPromise;
  const doc = await users.findOne(req.params.id).exec();
  if (!doc) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }
  res.json(doc.toJSON());
});
app.post("/users", async (req, res) => {
  try {
    const created = await userResolver.addUser(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.put("/users/:id", async (req, res) => {
  try {
    const updated = await userResolver.updateUser({
      id: req.params.id,
      ...req.body,
    });
    if (!updated) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.delete("/users/:id", async (req, res) => {
  const deleted = await userResolver.deleteUser({ id: req.params.id });
  if (!deleted) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }
  res.json({ message: "success" });
});

app.get('/devices', async (req, res) => {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  res.json(docs.map(d => d.toJSON()));
});

app.get("/devices/:id", async (req, res) => {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(req.params.id).exec();
  if (!doc) {
    return res.status(404).json({ error: "Appareil non trouvé" });
  }
  res.json(doc.toJSON());
});

app.post('/devices', async (req, res) => {
  try {
    const result = await userResolver.addDevice(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
  console.log("GraphQL disponible sur http://localhost:5000/graphql");
});
