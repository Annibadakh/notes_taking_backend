require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize } = require("./models");
const userRoute = require("./routes/userRoutes");
const loginRoute = require("./routes/loginRoutes");
const notesRoute = require("./routes/notesRoute");

const { testEmailConnection } = require("./services/mailService");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());


app.use("/signup", userRoute);
app.use("/login", loginRoute);
app.use("/notes", notesRoute);

app.get("/", async (req, res) => {
    // await testEmailConnection("aniketbadakh1212@gmail.com", "Mail Testing", `<p>This is a test mail form HD Note taking</p>` )
  res.status(200).json({ message: "HD Note Taking Server" });
});

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.sync({ alter: true });
    // console.log("Models synced with DB");

    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("Unable to connect to DB:", error);
  }
});
