var mongoose = require("mongoose"),
  shortid = require("shortid");

var iwatchSchema = new mongoose.Schema({
  pid: { type: String, default: shortid.generate, unique: true },
  name: { type: String, required: true },
  link: { type: String },
  short_desc: { type: String },
  short_image: {
    url: String,
    public_id: String,
  },
  gallery: [
    {
      url: String,
      public_id: String,
    },
  ],
  desc_images: [
    {
      url: { type: String },
      public_id: { type: String },
    },
  ],
  variants: [
    {
      type: { type: String },
      color: { type: String },
      price: { type: Number },
      my_price: { type: Number },
      size: { type: String },
      quantity: Number,
      isInStock: { type: Boolean },
    },
  ],
});

module.exports = mongoose.model("Iwatch3", iwatchSchema);
