const iPhones1 = require("../models/iPhones");
const iWatches1 = require("../models/iWatches");
const iPods1 = require("../models/iPods");

const iPhones2 = require("../models/iPhones2");
const iPods2 = require("../models/iPods2");
const iWatches2 = require("../models/iWatches2");
const iPhones3 = require("../models/iPhones3");
const iPods3 = require("../models/iPods3");
const iWatches3 = require("../models/iWatches3");

const iPhones4 = require("../models/iPhones4");
const iPods4 = require("../models/iPods4");
const iWatches4 = require("../models/iWatches4");

const getSchema = (sunil, alt, threeH, type) => {
  if (type === 1) {
    return threeH ? iPhones4 : sunil ? iPhones3 : alt ? iPhones2 : iPhones1;
  } else if (type === 2) {
    return threeH ? iPods4 : sunil ? iPods3 : alt ? iPods2 : iPods1;
  } else {
    return threeH ? iWatches4 : sunil ? iWatches3 : alt ? iWatches2 : iWatches1;
  }
};

exports.addProduct = async (req, res, next) => {
  try {
    const { type, basic, variants, target } = req.body;

    let Schema =
      type === "iPhone" ? iPhones1 : type === "iPod" ? iPods1 : iWatches1,
      Schema2 =
        type === "iPhone" ? iPhones2 : type === "iPod" ? iPods2 : iWatches2,
      Schema3 =
        type === "iPhone" ? iPhones3 : type === "iPod" ? iPods3 : iWatches3,
      Schema4 =
        type === "iPhone" ? iPhones4 : type === "iPod" ? iPods4 : iWatches4;

    const isSyncAll = !target || target === "sync_all";

    if (isSyncAll || target === "main") {
      let doc = new Schema({
        ...basic,
        variants: variants,
      });
      await doc.save();
    }

    if (isSyncAll || target === "alt") {
      let doc2 = new Schema2({
        ...basic,
        variants: variants,
      });
      await doc2.save();
    }

    if (isSyncAll || target === "sunil") {
      let doc3 = new Schema3({
        ...basic,
        variants: variants,
      });
      await doc3.save();
    }

    if (isSyncAll || target === "threeH") {
      let doc4 = new Schema4({
        ...basic,
        variants: variants,
      });
      await doc4.save();
    }

    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const { type, basic = {}, variants = [], id, alt, sunil, threeH, syncAll } = req.body;

    // choose correct schemas
    const Schema =
      type === "iPhone"
        ? (threeH ? iPhones4 : sunil ? iPhones3 : alt ? iPhones2 : iPhones1)
        : type === "iPod"
        ? (threeH ? iPods4 : sunil ? iPods3 : alt ? iPods2 : iPods1)
        : (threeH ? iWatches4 : sunil ? iWatches3 : alt ? iWatches2 : iWatches1);

    const Schema2 =
      type === "iPhone" ? iPhones2 : type === "iPod" ? iPods2 : iWatches2;
    const Schema3 =
      type === "iPhone" ? iPhones3 : type === "iPod" ? iPods3 : iWatches3;
    const Schema4 =
      type === "iPhone" ? iPhones4 : type === "iPod" ? iPods4 : iWatches4;

    // --- Fetch old product to get its pre-update name ---
    const oldProduct = await Schema.findById(id);
    if (!oldProduct) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    const oldName = oldProduct.name;

    // --- Update Target Inventory by _id ---
    const sch1 = await Schema.findByIdAndUpdate(
      id,
      {
        $set:
          type === "iPod"
            ? { ...basic }
            : { ...basic, variants },
      },
      { new: true }
    );

    if (!sch1) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    // helper: merge variants while keeping existing qty
    const mergeVariantsPreserveQty = (existing = [], incoming = [], productType) => {
      return incoming.map((inc) => {
        let match;
        if (productType === "iPhone") {
          match = existing.find((ev) => ev.storage === inc.storage);
        } else if (productType === "iWatch") {
          match = existing.find((ev) => ev.size === inc.size && ev.type === inc.type);
        }

        return {
          ...inc,
          quantity: match ? match.quantity : 0, // preserve or default to 0
        };
      });
    };

    // --- Update Secondary Schemas only if syncAll is active and source is Main ---
    const isMain = !alt && !sunil && !threeH;
    if (syncAll && isMain) {
      if (type === "iPod") {
        // exclude quantity so Schema2/3 keep their own stock
        const { quantity, ...basicWithoutQty } = basic;

        await Schema2.findOneAndUpdate(
          { name: oldName },
          { $set: { ...basicWithoutQty } },
          { new: true }
        );

        await Schema3.findOneAndUpdate(
          { name: oldName },
          { $set: { ...basicWithoutQty } },
          { new: true }
        );

        await Schema4.findOneAndUpdate(
          { name: oldName },
          { $set: { ...basicWithoutQty } },
          { new: true }
        );
      } else {
        // iPhone / iWatch → merge variants
        const doc2 = await Schema2.findOne({ name: oldName });
        if (doc2) {
          const merged = mergeVariantsPreserveQty(doc2.variants, variants, type);
          await Schema2.findOneAndUpdate(
            { name: oldName },
            { $set: { ...basic, variants: merged } },
            { new: true }
          );
        }

        const doc3 = await Schema3.findOne({ name: oldName });
        if (doc3) {
          const merged = mergeVariantsPreserveQty(doc3.variants, variants, type);
          await Schema3.findOneAndUpdate(
            { name: oldName },
            { $set: { ...basic, variants: merged } },
            { new: true }
          );
        }

        const doc4 = await Schema4.findOne({ name: oldName });
        if (doc4) {
          const merged = mergeVariantsPreserveQty(doc4.variants, variants, type);
          await Schema4.findOneAndUpdate(
            { name: oldName },
            { $set: { ...basic, variants: merged } },
            { new: true }
          );
        }
      }
    }

    return res.json({ success: true, product: sch1 });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id, type, alt, sunil, threeH } = req.body;

    let Schema =
      type === "iPhone"
        ? (threeH ? iPhones4 : sunil ? iPhones3 : alt ? iPhones2 : iPhones1)
        : type === "iPod"
        ? (threeH ? iPods4 : sunil ? iPods3 : alt ? iPods2 : iPods1)
        : (threeH ? iWatches4 : sunil ? iWatches3 : alt ? iWatches2 : iWatches1);

    const isMain = !alt && !sunil && !threeH;

    if (isMain) {
      let Schema2 =
        type === "iPhone" ? iPhones2 : type === "iPod" ? iPods2 : iWatches2,
        Schema3 =
          type === "iPhone" ? iPhones3 : type === "iPod" ? iPods3 : iWatches3,
        Schema4 =
          type === "iPhone" ? iPhones4 : type === "iPod" ? iPods4 : iWatches4;

      const sch = await Schema.findById(id);
      if (sch) {
        await Schema2.findOneAndRemove({ name: sch.name });
        await Schema3.findOneAndRemove({ name: sch.name });
        await Schema4.findOneAndRemove({ name: sch.name });
        await Schema.findByIdAndDelete(id);
      }
    } else {
      await Schema.findByIdAndDelete(id);
    }

    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const alt = req.query.alt;
    const sunil = req.query.sunil;
    const threeH = req.query.threeH;

    let iPhones = getSchema(sunil, alt, threeH, 1),
      iPods = getSchema(sunil, alt, threeH, 2),
      iWatches = getSchema(sunil, alt, threeH, 3);

    let iphones = await iPhones.find({}).lean();
    let ipods = await iPods.find({}).lean();
    let iwatches = await iWatches.find({}).lean();

    iphones = iphones.map((doc) => {
      return { ...doc, type: "iPhone" };
    });
    ipods = ipods.map((doc) => {
      return { ...doc, type: "iPod" };
    });
    iwatches = iwatches.map((doc) => {
      return { ...doc, type: "iWatch" };
    });

    return res.json({ items: [...iphones, ...ipods, ...iwatches] });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSingleProduct = async (req, res, next) => {
  try {
    const { id, type, alt, sunil, threeH } = req.body;

    let iPhones = getSchema(sunil, alt, threeH, 1),
      iPods = getSchema(sunil, alt, threeH, 2),
      iWatches = getSchema(sunil, alt, threeH, 3);

    let Schema =
      type === "iPhone" ? iPhones : type === "iPod" ? iPods : iWatches;

    const item = await Schema.findById(id).lean();
    return res.json({ item });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

