var mongoose = require("mongoose"),
  shortid = require("shortid");

var iphoneSchema = new mongoose.Schema({
  pid: { type: String, default: shortid.generate, unique: true },
  name: { type: String, required: true },
  link: { type: String },
  short_desc: { type: String },
  short_image: {
    url: { type: String },
    public_id: { type: String },
  },
  gallery: [
    {
      url: { type: String },
      public_id: { type: String },
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
      storage: { type: String },
      color: { type: String },
      price: { type: Number },
      my_price: { type: Number },
      isInStock: { type: Boolean },
      quantity: Number,
    },
  ],
});

module.exports = mongoose.model("Iphone3", iphoneSchema);
