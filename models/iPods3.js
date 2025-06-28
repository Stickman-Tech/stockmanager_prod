var mongoose = require("mongoose"),
  shortid = require("shortid");

var ipodSchema = new mongoose.Schema({
  pid: { type: String, default: shortid.generate, unique: true },
  name: { type: String, required: true },
  link: { type: String },
  short_desc: { type: String },
  quantity: { type: Number, default: 1 },
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
  isInStock: { type: Boolean, default: false },
  price: { type: Number },
  my_price: { type: Number },
});

module.exports = mongoose.model("Ipod3", ipodSchema);
