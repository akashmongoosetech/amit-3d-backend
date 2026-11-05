const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const MIME_TO_EXT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    // H6: ignore user-supplied extension; derive safe ext from validated mimetype
    const allowedExts = MIME_TO_EXT[file.mimetype] || [];
    const userExt = path.extname(file.originalname || "").toLowerCase();
    const ext = allowedExts.includes(userExt) ? userExt : allowedExts[0] || ".bin";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExts = MIME_TO_EXT[file.mimetype];
  if (!allowedExts) {
    cb(new Error("Only JPG, JPEG, PNG and WEBP files are allowed"), false);
    return;
  }
  const userExt = path.extname(file.originalname || "").toLowerCase();
  // Require extension to match mimetype (blocks shell.php with image/png mime)
  if (userExt && !allowedExts.includes(userExt)) {
    cb(new Error("File extension does not match file type"), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
