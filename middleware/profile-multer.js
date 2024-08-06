const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // console.log("inside of the profile multer");
    // console.log(" calling multer", req);

    cb(null, "public/userImage");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${"kdk"}-${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
