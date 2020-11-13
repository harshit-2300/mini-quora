// All backend related to POSTS
const express = require("express");
const mysql = require("mysql");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const db = require("../config/db.js");
const multer = require("multer");
const PORT = process.env.PORT;
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
const router = express.Router();
const checkifLogged = require("./middleware/checkifLogged");
const fs = require("fs");
const api = require("../api/api.js");

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: api.cloud_name,
  api_key: api.API_Key,
  api_secret: api.API_secret,
});
const upload = require("./middleware/multerMiddleware");

router.get("/newpost", checkifLogged, function (req, res) {
  res.render("NewPost", { logged: req.session.admin });
});
router.post("/newpost", upload.array("image"), async (req, res) => {
  var newPost = {
    user: req.session.user,
    title: req.body.title,
    text: req.body.body,
  };

  await db.query(
    "INSERT INTO post SET ?",
    newPost,
    async (error, results, fields) => {
      if (error) {
        console.log(error);
      } else {
        for (var i = 0; i < req.files.length; i++) {
          console.log(i);

          try {
            var imgurl = await cloudinary.uploader.upload(
              req.files[i].path,
              function (error, result) {
                if (error) {
                  console.log(error);
                }
              }
            );
            images = {
              post_id: results.insertId,
              url: imgurl.url,
            };
          } catch (error) {
            console.log(error);
          }

          await db.query("INSERT INTO images SET ?", images, function (
            error,
            results,
            fields
          ) {
            if (error) {
              res.send("ERROR");
              console.log(error);
            } else {
              console.log("Images added");
            }
          });
        }
        res.send("IMAGES ADDED");
      }
    }
  );
});

router.get("/:id", function (req, res) {
  var id = req.params.id;
  console.log();
});
const socketio = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = socketio(server);
io.on("connection", function (socket) {
  socket.on("add", function () {
    io.emit("image");
  });
  console.log("Connected socket");
});

module.exports = router;
