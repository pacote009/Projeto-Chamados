const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Importe suas rotas (ajuste o caminho/nome conforme seu projeto)
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const activityRoutes = require("./routes/activity");

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Use as rotas
app.use("/auth", userRoutes);
app.use("/projects", projectRoutes);
app.use("/activities", activityRoutes);

module.exports = app;