const express = require("express");
const router = express.Router();
const {
   createNotice,
   getNotices,
   deleteNotice,
   updateNotice
} = require("../controllers/noticeController");
router.post("/create-notice",createNotice);
router.delete("/:id", deleteNotice);

router.put("/:id", updateNotice);
router.get("/", getNotices);
module.exports = router;