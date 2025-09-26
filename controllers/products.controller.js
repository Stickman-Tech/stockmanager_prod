const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("../utils/pupeeteer");
const nodeHtmlToImage = require("node-html-to-image");

const iPhones = require("../models/iPhones");
const iPods = require("../models/iPods");
const iWatches = require("../models/iWatches");

const iPhones2 = require("../models/iPhones2");
const iPods2 = require("../models/iPods2");
const iWatches2 = require("../models/iWatches2");

const iPhones3 = require("../models/iPhones3");
const iPods3 = require("../models/iPods3");
const iWatches3 = require("../models/iWatches3");

const Expense = require("../models/Expense");
const Stock = require("../models/stock");
const mongoose = require("mongoose");
const db = mongoose.connection.db;
const Order = mongoose.model("Order", new mongoose.Schema(), "orders");
const Customer = require("../models/Customer");
const Udhar = require("../models/Udhar");
const moment = require("moment");
const { bucket } = require("../firebase");
const Voucher = mongoose.model(
  "Vouchertable",
  new mongoose.Schema(),
  "vouchertables"
);

const getSchema = (sunil, alt, type) => {
  if (type === 1) {
    return sunil ? iPhones3 : alt ? iPhones2 : iPhones;
  } else if (type === 2) {
    return sunil ? iPods3 : alt ? iPods2 : iPods;
  } else {
    return sunil ? iWatches3 : alt ? iWatches2 : iWatches;
  }
};

exports.getInventory = (req, res, next) => {
  const alt = req.query.alt;
  const sunil = req.query.sunil;
  let iph = getSchema(sunil, alt, 1),
    ipd = getSchema(sunil, alt, 2),
    wth = getSchema(sunil, alt, 3);

  let iphn, ipod;
  iph
    .find({})
    .then((result) => {
      iphn = result;
      return ipd.find({});
    })
    .then((result) => {
      ipod = result;
      return wth.find({});
    })
    .then((result) => {
      res.json({ iphones: iphn, ipods: ipod, iwatches: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUdharByDate = async (req, res, next) => {
  try {
    const gteDate = new Date(req.query.gte);
    const lteDate = new Date(req.query.lte);
    const adjLteDate = lteDate.setMilliseconds(86340000);

    if (!gteDate || !lteDate) {
      const error = new Error(
        "Error occured while trying to retrieve orders!."
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const items = await Udhar.aggregate([
      {
        $match: {
          order_date: {
            $gte: gteDate,
            $lt: new Date(adjLteDate),
          },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: "orders",
          localField: "billno",
          foreignField: "billno",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $sort: { order_date: -1 } },
    ]);

    return res.json(items);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSingleUdhar = async (req, res, next) => {
  try {
    const billno = req.params.billno;

    let bill = await Udhar.findOne({ billno }).populate("customer").lean();
    const order = await Order.findOne({ billno: +billno }).lean();

    console.log(order);

    bill.order = order;
    return res.json({ ...bill, order });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.markLoanComplete = async (req, res, next) => {
  try {
    const { amount, _id } = req.body;
    let udhar = await Udhar.findById(_id);
    udhar.balance = udhar.balance - +amount;
    udhar.total_paid = udhar.total_paid + +amount;
    udhar.payments = [...(udhar.payments ?? []), { date: new Date(), amount }];

    await udhar.save();
    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUdharByDate = async (req, res, next) => {
  try {
    const gteDate = new Date(req.query.gte);
    const lteDate = new Date(req.query.lte);
    const adjLteDate = lteDate.setMilliseconds(86340000);

    if (!gteDate || !lteDate) {
      const error = new Error(
        "Error occured while trying to retrieve orders!."
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const items = await Udhar.aggregate([
      {
        $match: {
          order_date: {
            $gte: gteDate,
            $lt: new Date(adjLteDate),
          },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: "orders",
          localField: "billno",
          foreignField: "billno",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $sort: { order_date: -1 } },
    ]);

    return res.json(items);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSingleUdhar = async (req, res, next) => {
  try {
    const billno = req.params.billno;

    let bill = await Udhar.findOne({ billno }).populate("customer").lean();
    const order = await Order.findOne({ billno: +billno }).lean();

    console.log(order);

    bill.order = order;
    return res.json({ ...bill, order });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSingleBill = async (req, res, next) => {
  try {
    const billno = req.params.billno;

    let bill = await Order.findOne({ billno: +billno }).lean();

    bill.customer = await Customer.findById(bill?.customer).lean();
    return res.json(bill);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.markLoanComplete = async (req, res, next) => {
  try {
    const { amount, _id } = req.body;
    let udhar = await Udhar.findById(_id);
    udhar.balance = udhar.balance - +amount;
    udhar.total_paid = udhar.total_paid + +amount;
    udhar.payments = [...(udhar.payments ?? []), { date: new Date(), amount }];

    await udhar.save();
    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrdersByDate = (req, res, next) => {
  const gteDate = new Date(req.query.gte);
  const lteDate = new Date(req.query.lte);
  const adjLteDate = lteDate.setMilliseconds(86340000);

  if (!gteDate || !lteDate) {
    const error = new Error("Error occurred while trying to retrieve orders.");
    error.title = "Error Occurred";
    error.statusCode = 422;
    throw error;
  }

  Order.aggregate([
    {
      $match: {
        order_date: {
          $gte: gteDate,
          $lt: new Date(adjLteDate),
        },
        isPaid: true,
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: {
        path: "$customerDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        order_date: 1,
      },
    },
  ])
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

exports.groupByDate = (req, res, next) => {
  const gteDate = new Date(req.query.gte);
  const lteDate = new Date(req.query.lte);
  const adjLteDate = lteDate.setMilliseconds(86340000);

  if (!gteDate || !lteDate) {
    const error = new Error("Error occured while trying to retrieve orders!.");
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  Order.aggregate([
    {
      $match: {
        order_date: {
          $gte: gteDate,
          $lt: new Date(adjLteDate),
        },
        isPaid: true,
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_date" } },
        orders: { $push: "$$ROOT" },
        total: { $sum: "$total" },
        products: { $sum: { $size: "$products1" } },
        cash: {
          $sum: { $cond: [{ $eq: ["$payment_type", "Cash"] }, "$total", 0] },
        },
        online: {
          $sum: {
            $cond: [{ $eq: ["$payment_type", "Online"] }, "$total", 0],
          },
        },
        card: {
          $sum: { $cond: [{ $eq: ["$payment_type", "Card"] }, "$total", 0] },
        },
        cashfree: {
          $sum: {
            $cond: [{ $eq: ["$payment_type", "Cashfree"] }, "$total", 0],
          },
        },
        ma: {
          $sum: {
            $cond: [{ $eq: ["$payment_type", "Ma"] }, "$total", 0],
          },
        },
        other: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$total",
              0,
            ],
          },
        },
        otherCash: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$paid_struc.cash",
              0,
            ],
          },
        },
        otherCard: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$paid_struc.card",
              0,
            ],
          },
        },
        otherBank: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$paid_struc.bank",
              0,
            ],
          },
        },
        otherCashfree: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$paid_struc.cashfree",
              0,
            ],
          },
        },
        otherMa: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $type: "$paid_struc" }, "missing"] },
                  { $eq: ["$payment_type", "Other"] },
                ],
              },
              "$paid_struc.ma",
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: -1 } },
  ])
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

exports.groupByCity = async (req, res, next) => {
  try {
    const gteDate = new Date(req.query.gte);
    const lteDate = new Date(req.query.lte);
    lteDate.setHours(23, 59, 59, 999);

    if (isNaN(gteDate) || isNaN(lteDate)) {
      const error = new Error("Invalid date range provided.");
      error.title = "Error Occurred";
      error.statusCode = 422;
      throw error;
    }

    const results = await Order.aggregate([
      {
        $match: {
          order_date: {
            $gte: gteDate,
            $lte: lteDate,
          },
          isPaid: true,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: false, // require customer for city grouping
        },
      },
      {
        $group: {
          _id: "$customer.city",
          orders: { $push: "$$ROOT" },
          total: { $sum: "$total" },
          products: { $sum: { $size: "$products1" } },
          cash: {
            $sum: { $cond: [{ $eq: ["$payment_type", "Cash"] }, "$total", 0] },
          },
          online: {
            $sum: {
              $cond: [{ $eq: ["$payment_type", "Online"] }, "$total", 0],
            },
          },
          card: {
            $sum: { $cond: [{ $eq: ["$payment_type", "Card"] }, "$total", 0] },
          },
          cashfree: {
            $sum: {
              $cond: [{ $eq: ["$payment_type", "Cashfree"] }, "$total", 0],
            },
          },
          ma: {
            $sum: {
              $cond: [{ $eq: ["$payment_type", "Ma"] }, "$total", 0],
            },
          },
          other: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $type: "$paid_struc" }, "missing"] },
                    { $eq: ["$payment_type", "Other"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
          otherCash: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $type: "$paid_struc" }, "missing"] },
                    { $eq: ["$payment_type", "Other"] },
                  ],
                },
                "$paid_struc.cash",
                0,
              ],
            },
          },
          otherCard: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $type: "$paid_struc" }, "missing"] },
                    { $eq: ["$payment_type", "Other"] },
                  ],
                },
                "$paid_struc.card",
                0,
              ],
            },
          },
          otherBank: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $type: "$paid_struc" }, "missing"] },
                    { $eq: ["$payment_type", "Other"] },
                  ],
                },
                "$paid_struc.bank",
                0,
              ],
            },
          },
          otherMa: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $type: "$paid_struc" }, "missing"] },
                    { $eq: ["$payment_type", "Other"] },
                  ],
                },
                "$paid_struc.ma",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json(results);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getVouchersByDate = (req, res, next) => {
  const gteDate = new Date(req.query.gte);
  const lteDate = new Date(req.query.lte);
  const adjLteDate = lteDate.setMilliseconds(86340000);

  if (!gteDate || !lteDate) {
    const error = new Error("Error occured while trying to retrieve orders!.");
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  Voucher.aggregate([
    {
      $addFields: {
        date: { $dateFromString: { dateString: "$date", format: "%d-%m-%Y" } },
      },
    },
    {
      $match: {
        date: {
          $gte: gteDate,
          $lt: new Date(adjLteDate),
        },
      },
    },
    { $group: { _id: "$date", data: { $push: "$$ROOT" } } },
  ])
    .sort({ _id: 1 })
    .then((result) => {
      if (result.length < 1) {
        return res.json([]);
      }
      const newResult = result
        .map((docMain) => {
          return docMain.data
            .map((doc) => {
              return doc.detail.map((subDoc) => {
                let product;
                if (subDoc.product === "1") {
                  product = "iPhone";
                } else if (subDoc.product === "2") {
                  product = "Watch";
                } else {
                  product = "AirPods";
                }
                return {
                  Date: doc.date.toString().slice(0, 10),
                  VDate: subDoc.date,
                  Name: subDoc.name,
                  City: subDoc.city,
                  Product: product,
                  Qty: subDoc.quantity,

                  Discount: subDoc.discount,
                  Ctpin: subDoc.ctipin,
                };
              });
            })
            .flat();
        })
        .flat();

      res.json(newResult);
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getProductsByDate = (req, res, next) => {
  const gteDate = new Date(req.query.gte);
  const lteDate = new Date(req.query.lte);
  const adjLteDate = lteDate.setMilliseconds(86340000);

  if (!gteDate || !lteDate) {
    const error = new Error("Error occured while trying to retrieve orders!.");
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  Order.aggregate([
    {
      $match: {
        order_date: {
          $gte: gteDate,
          $lt: new Date(adjLteDate),
        },
        isPaid: true,
      },
    },
    { $unwind: "$products1" },
    {
      $group: {
        _id: {
          id: "$products1.product_id",
          name: "$products1.name",
          variants: "$products1.desc",
        },
        orders: { $sum: 1 },
        total_value: { $sum: "$products1.price" },
        total_quantity: { $sum: "$products1.quantity" },
        type: { $first: "$products1.product" },
      },
    },
    { $sort: { type: 1 } },
  ])
    .then((result) => {
      let newData = result;
      if (newData.length > 0) {
        newData = result.map((doc) => {
          let productType;
          if (doc.type === "1") {
            productType = "iPhone";
          } else if (doc.type === "2") {
            productType = "Watch";
          } else {
            productType = "AirPods";
          }
          return {
            id: doc._id.id,
            name: doc._id.name,
            variant: doc._id.variants,
            totalOrders: doc.orders,
            totalValue: doc.total_value,
            totalQuantity: doc.total_quantity,
            type: productType,
          };
        });
      }
      res.json(newData);
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPdfData = async (req, res, next) => {
  try {
    const gteDate = new Date(req.params.date);
    gteDate.setUTCHours(0, 0, 0, 0);
    let lteDate = new Date(gteDate);
    lteDate.setUTCHours(23, 59, 59, 0);

    console.log(gteDate, lteDate);

    // Get all orders without populate
    let orders = await Order.find({
      order_date: { $gte: gteDate, $lt: new Date(lteDate) },
    }).lean();

    // Fetch customers separately with Promise.all
    orders = await Promise.all(
      orders.map(async (order) => {
        if (order.customer) {
          const customer = await Customer.findById(order.customer).lean();
          return { ...order, customer };
        }
        return order;
      })
    );

    // Expenses as usual
    let expenses = await Expense.find({
      createdAt: { $gte: gteDate, $lt: new Date(lteDate) },
    }).lean();

    return res.json({ success: true, payload: { orders, expenses } });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.clear = async (req, res, next) => {
  try {
    await Expense.updateMany({}, { $set: { cleared: true } });
    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.printPDF = async (req, res, next) => {
  try {
    const { data, date } = req.body;

    // Helpers
    const formatValue = (val) => (val > 0 ? val : 0);
    const formatDisplay = (val) => (val > 0 ? `₹ ${val}` : "-");

    // ---- Orders ----
    let orders = data?.orders?.map((doc, i) => {
      const ctipin = doc?.products1?.map((d) => d?.ctpin).join(", ");

      let cash = 0,
        card = 0,
        cashfree = 0,
        ma = 0,
        online = 0,
        udhar = 0;

      if (doc?.payment_type === "Other") {
        cash = formatValue(doc?.paid_struc?.cash);
        card = formatValue(doc?.paid_struc?.card);
        cashfree = formatValue(doc?.paid_struc?.cashfree);
        ma = formatValue(doc?.paid_struc?.ma);
        online = formatValue(doc?.paid_struc?.bank);
      } else if (doc?.payment_type === "Cash") {
        cash = formatValue(doc?.total);
      } else if (doc?.payment_type === "Card") {
        card = formatValue(doc?.total);
      } else if (doc?.payment_type === "Cashfree") {
        cashfree = formatValue(doc?.total);
      } else if (doc?.payment_type === "Ma") {
        ma = formatValue(doc?.total);
      } else if (doc?.payment_type === "Online") {
        online = formatValue(doc?.total);
      }

      udhar = formatValue(doc?.paid_struc?.loaned);

      return {
        sr: i + 1,
        date: new Date(doc?.order_date)?.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        time: new Date(doc?.order_date)?.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        products: doc?.products1?.map((d) => {
          return `${d?.name} ${d?.desc}${doc.is2H ? " (2H)" : ""}`;
        }),
        // numeric values
        cash,
        card,
        cashfree,
        ma,
        online,
        udhar,
        total: formatValue(doc?.total),

        // display values
        cashDisplay: formatDisplay(cash),
        cardDisplay: formatDisplay(card),
        cashfreeDisplay: formatDisplay(cashfree),
        maDisplay: formatDisplay(ma),
        onlineDisplay: formatDisplay(online),
        udharDisplay: formatDisplay(udhar),
        totalDisplay: formatDisplay(doc?.total),

        name: doc?.billName,
        Date: doc?.order_date,
        type: "order",
        ctipin,
        customerName: doc?.customer?.name,
        customerMobile: doc?.customer?.mobile,
      };
    });

    // ---- Expenses ----
    let expenses = data?.expenses?.map((doc, i) => {
      const amt = formatValue(doc?.amount);
      return {
        sr: i + 1,
        date: new Date(doc?.createdAt)?.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        time: new Date(doc?.createdAt)?.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        products: [
          `${doc?.reason} (${doc?.spendOn === "personal" ? "Personal" : "Store"})`,
        ],
        // numeric values
        cash: 0,
        card: 0,
        cashfree: 0,
        online: 0,
        ma: 0,
        udhar: 0,
        total: amt,

        // display values
        cashDisplay: "-",
        cardDisplay: "-",
        cashfreeDisplay: "-",
        onlineDisplay: "-",
        maDisplay: "-",
        udharDisplay: "-",
        totalDisplay: formatDisplay(amt),

        name: doc?.name,
        Date: doc?.createdAt,
        type: "expense",
        spendOn: doc?.spendOn ?? "store",
      };
    });

    // ---- Merge & Sort ----
    let mixed = [...orders, ...expenses]?.sort((a, b) => {
      return new Date(a.Date) - new Date(b.Date);
    });

    // ---- Totals ----
    let total = 0,
      cash = 0,
      card = 0,
      cashfree = 0,
      online = 0,
      ma = 0,
      udhar = 0,
      expense = 0,
      personal = 0;

    expenses.forEach((doc) => {
      if (doc?.spendOn === "personal") {
        personal += doc.total;
      } else {
        expense += doc.total;
      }
    });

    cash = orders.reduce((a, b) => a + b.cash, 0);
    card = orders.reduce((a, b) => a + b.card, 0);
    cashfree = orders.reduce((a, b) => a + b.cashfree, 0);
    online = orders.reduce((a, b) => a + b.online, 0);
    ma = orders.reduce((a, b) => a + b.ma, 0);
    udhar = orders.reduce((a, b) => a + b.udhar, 0);

    total = cash + card + cashfree + online + ma + udhar - expense + personal;

    // ---- EJS ----
    var templateEjs = fs.readFileSync(
      path.join(__dirname + "/print.ejs"),
      "utf8"
    );
    var template = ejs.compile(templateEjs);
    var html = template({
      date,
      reports: mixed,
      total,
      cash,
      card,
      cashfree,
      ma,
      online,
      personal,
      udhar,
      expense,
    });

    const options = {
      displayHeaderFooter: false,
      printBackground: true,
      margin: "0px",
      width: "350mm",   // custom width
      height: "500mm",  // custom height
    };

    let pdfS = await puppeteer.getStream(html, options);
    pdfS.pipe(res);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStocks = async (req, res, next) => {
  try {
    let { gte, lte } = req.body;
    lte = new Date(lte);
    lte.setUTCHours(23, 59, 59, 0);

    const items = await Stock.find({
      createdAt: { $gte: gte, $lte: lte },
    }).lean();

    return res.json({ success: true, items });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllStocks = async (req, res, next) => {
  try {
    const items = await Stock.find({}).lean();

    return res.json({ success: true, items });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createRecord = async (req, res, next) => {
  try {
    let { input, amount, type } = req.body;
    const doc = new Stock({
      input,
      amount,
      type,
    });

    await doc.save();
    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.sendSummaryReport = async () => {
  try {
    console.time("Started");
    let startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const items = await Order.find({
      order_date: {
        $gte: startDate,
        $lt: endDate,
      },
      isPaid: true,
    }).lean();

    const expenseItems = await Expense.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();

    let today = {
      sales: 0,
      orders: 0,
      products: 0,
      cash: 0,
      online: 0,
      card: 0,
      cashfree: 0,
      ma: 0,
      udhar: 0,
      store: 0,
      personal: 0,
    };

    items.forEach((doc) => {
      if (doc.isPaid) {
        today.cash += doc?.payment_type === "Cash" ? doc.total : 0;
        today.online += doc?.payment_type === "Online" ? doc.total : 0;
        today.card += doc?.payment_type === "Card" ? doc.total : 0;
        today.cashfree += doc?.payment_type === "Cashfree" ? doc.total : 0;
        today.ma += doc?.payment_type === "Ma" ? doc.total : 0;

        if (doc.payment_type === "Other") {
          today.cash += doc.paid_struc.cash;
          today.card += doc.paid_struc.card;
          today.online += doc.paid_struc.bank;
          today.cashfree += doc.paid_struc.cashfree ?? 0;
          today.ma += doc.paid_struc.ma ?? 0;

          today.udhar += doc.paid_struc?.loaned ?? 0;
        }

        today.products += doc?.products1?.length;
        today.orders += 1;
      }
    });

    today.sales = today.card + today.card + today.online + today.cashfree + today.ma;
    expenseItems.forEach((doc) => {
      if (doc?.spendOn === "personal") {
        today.personal += doc.amount;
      } else {
        today.store += doc.amount;
      }
    });

    //calculate the trend for month
    let previousStartDate = new Date(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      1
    );

    let previousEndDate = new Date(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      0
    );

    const thisMonthitems = await Order.find({
      order_date: {
        $gte: previousStartDate,
        $lt: previousEndDate,
      },
    }).lean();

    const thisMonthAllExpenseItems = await Expense.find({
      createdAt: {
        $gte: previousStartDate,
        $lt: previousEndDate,
      },
    }).lean();

    let thisMonth = {
      sales: 0,
      orders: 0,
      products: 0,
      cash: 0,
      online: 0,
      card: 0,
      cashfree: 0,
      ma: 0,
      udhar: 0,
      store: 0,
      personal: 0,
    };

    thisMonthitems.forEach((doc) => {
      if (doc.isPaid) {
        thisMonth.cash += doc?.payment_type === "Cash" ? doc.total : 0;
        thisMonth.online += doc?.payment_type === "Online" ? doc.total : 0;
        thisMonth.card += doc?.payment_type === "Card" ? doc.total : 0;
        thisMonth.cashfree += doc?.payment_type === "Cashfree" ? doc.total : 0;
        thisMonth.ma += doc?.payment_type === "Ma" ? doc.total : 0;

        if (doc.payment_type === "Other") {
          thisMonth.cash += doc.paid_struc.cash;
          thisMonth.card += doc.paid_struc.card;
          thisMonth.online += doc.paid_struc.bank;
          thisMonth.cashfree += doc.paid_struc.cashfree ?? 0;
          thisMonth.ma += doc.paid_struc.ma ?? 0;

          thisMonth.udhar += doc.paid_struc?.loaned ?? 0;
        }

        thisMonth.products += doc?.products1?.length;
        thisMonth.orders += 1;
      }
    });

    thisMonth.sales =
      thisMonth.card + thisMonth.card + thisMonth.online + thisMonth.cashfree + thisMonth.ma;
    thisMonthAllExpenseItems.forEach((doc) => {
      if (doc?.spendOn === "personal") {
        thisMonth.personal += doc.amount;
      } else {
        thisMonth.store += doc.amount;
      }
    });

    let toc;
    ejs.renderFile(
      path.join(__dirname, "../sales-summary-report.ejs"),
      {
        today,
        thisMonth,
        date: moment(endDate).utc().format("DD MMM YYYY"),
        month: moment(endDate).format("MMM YYYY"),
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          toc = data;
        }
      }
    );

    const bufferImage = await puppeteer.getImageBuffer(toc, {});

    // const bufferImage = await nodeHtmlToImage({
    //   html: toc,
    //   selector: ".report",
    // });

    const file = bucket.file(`sales/${moment().toISOString()}`);
    const stream = file.createWriteStream({
      metadata: {
        contentType: "image/png",
      },
    });

    stream.end(bufferImage);

    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL of the image
    const publicUrl = file.publicUrl();

    let humanReadableDate = moment(endDate).utc().format("DD MMM YYYY");

    const headers = {
      apiSecret: process.env.gallaApi_secretKey,
      apiKey: process.env.gallaApiKey,
      "Content-Type": "application/json",
    };

    const data = {
      channelId: process.env.channelId,
      channelType: "whatsapp",

      recipient: {
        name: `Nemantaj Sahu`,
        phone: `918349727696`,
      },
      botId: "61980d26506f0200049c71da",
      whatsapp: {
        type: "template",
        template: {
          templateName: "report_card_delivered_clone",
          headerValues: {
            mediaUrl: publicUrl,
            mediaName: humanReadableDate,
          },
          bodyValues: {
            variable_1: humanReadableDate,
          },
        },
      },
    };

    const resp = await fetch(
      "https://server.gallabox.com/devapi/messages/whatsapp",
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    ).then((response) => response.json());

    console.log(today, thisMonth, resp);
    console.timeEnd("Started");
  } catch (err) {
    console.log(err);
  }
};

exports.deleteExpenseRecord = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Expense.findByIdAndDelete(id);

    return res.json({ success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
