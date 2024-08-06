const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
const cookieSession = require("cookie-session");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const flash = require("connect-flash"); // Fixed typo here
const router = require("./router/userRouter");
const adminRouter = require("./router/adminRouter");
const connectDB = require("./config/connection");

const app = express();
const PORT = process.env.PORT || 3003;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Use connect-flash middleware
app.use(flash());

// Use session middleware
app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false,
  })
);

// Use nocache middleware
app.use(nocache());

// Use bodyParser middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Use your routers
app.use("/admin", adminRouter);
app.use("/", router);
app.use((req, res, next) => {
  res.render('user/404')
});

// Connect to the database
connectDB;

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
