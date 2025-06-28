const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Inventory = new Schema({
  dateAdded: {
    type: Date,
  },
  pid: {
    type: String,
  },
  name: {
    type: String,
  },
  desc: {
    type: String,
  },
  add: { type: Number },
  sub: { type: Number },
  prev: { type: Number },
  reason: { type: String },
});

module.exports = mongoose.model("NewInventory3", Inventory);
