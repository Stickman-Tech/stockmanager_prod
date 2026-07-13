const Inventory1 = require("../models/Inventory");
const iPhones1 = require("../models/iPhones");
const iWatches1 = require("../models/iWatches");
const iPods1 = require("../models/iPods");

const iPhones2 = require("../models/iPhones2");
const iPods2 = require("../models/iPods2");
const iWatches2 = require("../models/iWatches2");
const iPhones3 = require("../models/iPhones3");
const iPods3 = require("../models/iPods3");
const iWatches3 = require("../models/iWatches3");
const Inventory2 = require("../models/Inventory2");
const Inventory3 = require("../models/Inventory3");

const iPhones4 = require("../models/iPhones4");
const iPods4 = require("../models/iPods4");
const iWatches4 = require("../models/iWatches4");
const Inventory4 = require("../models/Inventory4");

const mongoose = require("mongoose");

const getSchema = (sunil, alt, threeH, type) => {
  if (type === 1) {
    return threeH ? iPhones4 : sunil ? iPhones3 : alt ? iPhones2 : iPhones1;
  } else if (type === 2) {
    return threeH ? iPods4 : sunil ? iPods3 : alt ? iPods2 : iPods1;
  } else if (type === 3) {
    return threeH ? iWatches4 : sunil ? iWatches3 : alt ? iWatches2 : iWatches1;
  } else {
    return threeH ? Inventory4 : sunil ? Inventory3 : alt ? Inventory2 : Inventory1;
  }
};

exports.addStock = async (req, res, next) => {
  if (!req.body) {
    const error = new Error("Error occured while trying to update stock!.");
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  const alt = req.body.alt;
  const sunil = req.body.sunil;
  const threeH = req.body.threeH;
  let iPhones = getSchema(sunil, alt, threeH, 1),
    iPods = getSchema(sunil, alt, threeH, 2),
    iWatches = getSchema(sunil, alt, threeH, 3),
    Inventory = getSchema(sunil, alt, threeH, 4);

  const id = req.body.id;
  const variantId = req.body.variantId;

  let response, previous, prevQty;

  try {
    if (req.body.category === "iPhones") {
      previous = await iPhones.findOne({
        pid: req.body.pid,
        "variants._id": variantId,
      });

      prevQty = previous?.variants?.find((doc) => {
        return doc?._id?.toString() === variantId?.toString();
      });

      response = await iPhones.findOneAndUpdate(
        {
          pid: req.body.pid,
          "variants._id": variantId,
        },
        {
          $inc: {
            "variants.$.quantity": req.body.add,
          },
        },
        { new: true }
      );
    } else if (req.body.category === "AirPods") {
      prevQty = await iPods.findOne({
        _id: mongoose.Types.ObjectId(req.body.id),
      });

      response = await iPods.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(req.body.id) },
        {
          $inc: {
            quantity: req.body.add,
          },
        },
        { new: true }
      );
    } else {
      previous = await iWatches.findOne({
        pid: req.body.pid,
        "variants._id": variantId,
      });

      prevQty = previous?.variants?.find((doc) => {
        return doc?._id?.toString() === variantId?.toString();
      });

      response = await iWatches.findOneAndUpdate(
        {
          pid: req.body.pid,
          "variants._id": variantId,
        },
        {
          $inc: {
            "variants.$.quantity": req.body.add,
          },
        },
        { new: true }
      );
    }

    const invData = {
      dateAdded: new Date(),
      pid: req.body.pid,
      name: req.body.name,
      desc: req.body.desc,
      add: req.body.add,
      prev: prevQty.quantity,
      reason: "stock-increased",
    };
    const newInvtry = threeH ? new Inventory4(invData)
      : sunil ? new Inventory3(invData)
      : alt ? new Inventory2(invData)
      : new Inventory1(invData);

    console.log(newInvtry);

    await newInvtry.save();
    res.json({ response, category: req.body.category });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.subStock = async (req, res, next) => {
  if (!req.body) {
    const error = new Error("Error occured while trying to update stock!.");
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  const alt = req.body.alt;
  const sunil = req.body.sunil;
  const threeH = req.body.threeH;
  let iPhones = getSchema(sunil, alt, threeH, 1),
    iPods = getSchema(sunil, alt, threeH, 2),
    iWatches = getSchema(sunil, alt, threeH, 3),
    Inventory = getSchema(sunil, alt, threeH, 4);

  let response, previous, prevQty;
  const id = req.body.id;
  const variantId = req.body.variantId;

  try {
    if (req.body.category === "iPhones") {
      previous = await iPhones.findOne({
        pid: req.body.pid,
        "variants._id": variantId,
      });

      prevQty = previous?.variants?.find((doc) => {
        return doc?._id?.toString() === variantId?.toString();
      });

      response = await iPhones.findOneAndUpdate(
        {
          pid: req.body.pid,
          "variants._id": variantId,
        },
        {
          $inc: {
            "variants.$.quantity": req.body.sub,
          },
        },
        { new: true }
      );
    } else if (req.body.category === "AirPods") {
      prevQty = await iPods.findOne({
        _id: mongoose.Types.ObjectId(req.body.id),
      });

      response = await iPods.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(req.body.id) },
        {
          $inc: {
            quantity: req.body.sub,
          },
        },
        { new: true }
      );
    } else {
      previous = await iWatches.findOne({
        pid: req.body.pid,
        "variants._id": variantId,
      });

      prevQty = previous?.variants?.find((doc) => {
        return doc?._id?.toString() === variantId?.toString();
      });

      response = await iWatches.findOneAndUpdate(
        {
          pid: req.body.pid,
          "variants._id": variantId,
        },
        {
          $inc: {
            "variants.$.quantity": req.body.sub,
          },
        },
        { new: true }
      );
    }

    const invData = {
      dateAdded: new Date(),
      pid: req.body.pid,
      name: req.body.name,
      desc: req.body.desc,
      sub: req.body.sub,
      prev: prevQty.quantity,
      reason: "stock-decreased",
    };
    const newInvtry = threeH ? new Inventory4(invData)
      : sunil ? new Inventory3(invData)
      : alt ? new Inventory2(invData)
      : new Inventory1(invData);

    await newInvtry.save();
    res.json({ response, category: req.body.category });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getHistory = (req, res, next) => {
  const alt = req.query.alt;
  const sunil = req.query.sunil;
  const threeH = req.query.threeH;
  let Inventory = getSchema(sunil, alt, threeH, 4);

  const gteDate = new Date(req.query.gte);
  const lteDate = new Date(req.query.lte);
  const adjLteDate = lteDate.setMilliseconds(86340000);

  let schema = threeH ? Inventory4 : sunil ? Inventory3 : alt ? Inventory2 : Inventory1

  schema.find({
    dateAdded: {
      $gte: gteDate,
      $lt: new Date(adjLteDate),
    },
  })
    .sort({ dateAdded: -1 })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
