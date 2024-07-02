const express = require("express");
const router = express.Router();

const errPageRender = require("../../services/errPage/errPageRender");

router.all("*", errPageRender.errPage);

module.exports = router;
