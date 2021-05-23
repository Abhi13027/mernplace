const express = require("express");
const { check } = require("express-validator");

const httpError = require("../models/http-error");
const checkAuth = require("../middleware/check-auth");
const placeController = require("../controllers/place-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();

router.get("/:pid", placeController.getPlaceById);
router.get("/user/:uid", placeController.getPlacesByUserId);
router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placeController.createPlace
);
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placeController.updatePlace
);
router.delete("/:pid", placeController.deletePlace);
module.exports = router;
