const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,"uploads/");
    },
    filename:(req,file,cb) => {
        const uniquename = Date.now() + "-" + Math.round(Math.random()*1e9);
        cb(null,uniquename+path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits:{fileSize:5*1024*1024}//5mb
})

module.exports = upload;