const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const httpError = require("../models/http-error");
const getCooordForAddress = require("../util/location");
const mongoose = require("mongoose");
const Place = require("../models/place");
const User = require("../models/user");
// const mongooseUniqueValidator = require("mongoose-unique-validator");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    next(new httpError("Something went wrong, could not find the place", 500));
  }

  if (!place) {
    return next(
      new httpError("Could not find a place for the provided user id", 404)
    );
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(
      new httpError("Fetching places failed, please try again later", 500)
    );
  }

  if (!places || places.length === 0) {
    return next(
      new httpError("Could not find a place for the provided user id", 404)
    );
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  //async doesn't work correctly with throw
  if (!errors.isEmpty()) {
    return next(
      new httpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { title, description, address, creator } = req.body;
  let coordinates;

  try {
    coordinates = await getCooordForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new httpError("Creating place failed, please try again", 500));
  }

  if (!user) {
    return next(new httpError("Could not find user for provided ID", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new httpError("Creating place failed, please try again", 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new httpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new httpError("Something went wrong, could not update place", 500)
    );
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new httpError("You are not allowed to edit this place.", 401));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    return next(
      new httpError("Something went wrong, could not update place", 500)
    );
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    return next(
      new httpError("Something went wrong, could not delete the place", 500)
    );
  }

  if (!place) {
    return next(
      new httpError("Could not find place for the provided id.", 404)
    );
  }

  if (place.creator.id !== req.userData.userId) {
    return next(
      new httpError("You are not allowed to delete this place.", 401)
    );
  }
  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(
      new httpError("Something went wrong, could not delete the place", 500)
    );
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Place Deleted" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
