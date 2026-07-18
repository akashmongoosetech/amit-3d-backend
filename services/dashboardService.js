const BookModel = require("../models/BookModel");
const Contact = require("../models/Contact");
const Admin = require("../models/Admin");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const cache = new Map();
const CACHE_TTL = 60_000;

function cacheKey(name, ...args) {
  return `${name}_${args.join("_")}`;
}

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function toCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function dateFilter(period, fromDate, toDate, field) {
  const f = field || "createdAt";
  const now = new Date();
  const filter = {};
  if (period === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter[f] = { $gte: start };
  } else if (period === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter[f] = { $gte: start, $lt: end };
  } else if (period === "7d") {
    filter[f] = { $gte: new Date(now.getTime() - 7 * 86400000) };
  } else if (period === "30d") {
    filter[f] = { $gte: new Date(now.getTime() - 30 * 86400000) };
  } else if (period === "90d") {
    filter[f] = { $gte: new Date(now.getTime() - 90 * 86400000) };
  } else if (period === "1y") {
    filter[f] = { $gte: new Date(now.getTime() - 365 * 86400000) };
  } else {
    if (fromDate) filter[f] = { ...filter[f], $gte: new Date(fromDate) };
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter[f] = { ...filter[f], $lte: end };
    }
  }
  return filter;
}

async function getSummary(period, fromDate, toDate) {
  const df = dateFilter(period, fromDate, toDate);
  const baseFilter = { ...df };

  const [
    totalBookings, totalOrders, totalContacts, activeProjects,
    completedProjects, deliveredModels, pendingPayments, newBookings, newContacts,
  ] = await Promise.all([
    BookModel.countDocuments(baseFilter),
    BookModel.countDocuments({ ...baseFilter, status: "Payment" }),
    Contact.countDocuments(baseFilter),
    BookModel.countDocuments({ ...baseFilter, status: { $in: ["Start Project", "On Way"] } }),
    BookModel.countDocuments({ ...baseFilter, status: "Complete" }),
    BookModel.countDocuments({ ...baseFilter, status: "Delivered" }),
    BookModel.countDocuments({ ...baseFilter, status: "Payment", orderStatus: { $ne: "Shipped" } }),
    BookModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, ...df }),
    Contact.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, ...df }),
  ]);

  const now = new Date();
  const periodMs = period === "today" ? 86400000 :
    period === "7d" ? 7 * 86400000 :
    period === "30d" ? 30 * 86400000 :
    period === "90d" ? 90 * 86400000 :
    period === "1y" ? 365 * 86400000 : 7 * 86400000;

  const prevStart = new Date(now.getTime() - periodMs * 2);
  const prevEnd = new Date(now.getTime() - periodMs);
  const prevFilter = { createdAt: { $gte: prevStart, $lt: prevEnd } };

  const [prevBookings, prevOrders, prevContacts] = await Promise.all([
    BookModel.countDocuments(prevFilter),
    BookModel.countDocuments({ ...prevFilter, status: "Payment" }),
    Contact.countDocuments(prevFilter),
  ]);

  const calc = (cur, prev) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
  };

  return {
    totalBookings, totalOrders, totalContacts, activeProjects,
    completedProjects, deliveredModels, pendingPayments,
    bookingTrend: calc(totalBookings, prevBookings),
    orderTrend: calc(totalOrders, prevOrders),
    contactTrend: calc(totalContacts, prevContacts),
    newBookings, newContacts,
  };
}

async function getCharts(period, fromDate, toDate) {
  const df = dateFilter(period, fromDate, toDate, "createdAt");

  const bookingStatusPipe = [
    { $match: df },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ];

  const orderStatusPipe = [
    { $match: { ...df, status: "Payment" } },
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ];

  const monthlyPipe = [
    { $match: df },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        bookings: { $sum: 1 },
        orders: { $sum: { $cond: [{ $eq: ["$status", "Payment"] }, 1, 0] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $let: {
            vars: { m: "$_id.month" },
            in: { $arrayElemAt: [MONTHS, { $subtract: ["$$m", 1] }] },
          },
        },
        bookings: 1, orders: 1,
      },
    },
  ];

  const topModelsPipe = [
    { $match: { ...df, modelName: { $ne: "" } } },
    { $group: { _id: "$modelName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ];

  const dailyPipe = (days) => [
    { $match: { ...df, createdAt: { $gte: new Date(Date.now() - days * 86400000) } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        bookings: { $sum: 1 },
        orders: { $sum: { $cond: [{ $eq: ["$status", "Payment"] }, 1, 0] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } },
          },
        },
        bookings: 1, orders: 1,
      },
    },
  ];

  const customerGrowthPipe = [
    { $match: df },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        uniqueCustomers: { $addToSet: "$email" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $let: {
            vars: { m: "$_id.month" },
            in: { $arrayElemAt: [MONTHS, { $subtract: ["$$m", 1] }] },
          },
        },
        customers: { $size: "$uniqueCustomers" },
      },
    },
  ];

  const [bookingStatusDist, orderStatusDist, monthlyBookings, topModels, dailyTrend30, dailyTrend90, customerGrowth] =
    await Promise.all([
      BookModel.aggregate(bookingStatusPipe),
      BookModel.aggregate(orderStatusPipe),
      BookModel.aggregate(monthlyPipe),
      BookModel.aggregate(topModelsPipe),
      BookModel.aggregate(dailyPipe(30)),
      BookModel.aggregate(dailyPipe(90)),
      BookModel.aggregate(customerGrowthPipe),
    ]);

  const revenueVsOrders = monthlyBookings.map((m) => ({
    month: m.month,
    revenue: 0,
    orders: m.orders || 0,
  }));

  return { bookingStatusDist, orderStatusDist, monthlyBookings, revenueVsOrders, topModels, dailyTrend30, dailyTrend90, customerGrowth };
}

async function getRecentOrders(limit) {
  const n = limit || 5;
  const orders = await BookModel.find({ status: "Payment" }).sort({ createdAt: -1 }).limit(n).lean();
  return orders.map((o) => ({
    _id: o._id, name: o.name, email: o.email, mobile: o.mobile,
    modelName: o.modelName || "\u2014", status: o.status,
    orderStatus: o.orderStatus || "Start Create", createdAt: o.createdAt,
  }));
}

async function getRecentContacts(limit) {
  const n = limit || 5;
  const contacts = await Contact.find().sort({ createdAt: -1 }).limit(n).lean();
  return contacts.map((c) => ({
    _id: c._id, name: c.name, email: c.email,
    mobile: c.mobile || "\u2014", company: c.company || "\u2014",
    budget: c.budget || "\u2014", message: c.message,
    status: c.status, createdAt: c.createdAt,
  }));
}

async function getActivities(limit) {
  const n = limit || 8;
  const [recentBookings, recentContacts] = await Promise.all([
    BookModel.find().sort({ createdAt: -1 }).limit(n).lean(),
    Contact.find().sort({ createdAt: -1 }).limit(n).lean(),
  ]);

  const activities = [
    ...recentBookings.map((b) => ({
      id: `b_${b._id}`, type: "booking",
      action: "New Booking", detail: `${b.name} booked "${b.modelName || "3D Model"}"`,
      status: b.status, time: b.createdAt,
    })),
    ...recentContacts.map((c) => ({
      id: `c_${c._id}`, type: "contact",
      action: "New Contact", detail: `${c.name} sent an inquiry`,
      status: c.status, time: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, n);

  return activities;
}

async function getPipeline() {
  const stages = ["New Order", "Contact", "Payment", "Start Project", "Complete", "On Way", "Delivered"];
  const counts = await Promise.all(stages.map((s) => BookModel.countDocuments({ status: s })));
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const pipeline = stages.map((name, i) => ({ name, count: counts[i], percentage: parseFloat(((counts[i] / total) * 100).toFixed(1)) }));
  const deliveredIdx = stages.indexOf("Delivered");
  const completedCount = counts[deliveredIdx];
  const inProgress = total - completedCount;
  const completionPercentage = parseFloat(((completedCount / total) * 100).toFixed(1));
  return { stages: pipeline, completionPercentage, totalInPipeline: total, inProgress };
}

function withCache(fn, name) {
  return async (...args) => {
    const key = cacheKey(name, ...args.map((a) => (a instanceof Date ? a.toISOString() : String(a))));
    const cached = fromCache(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    toCache(key, result);
    return result;
  };
}

module.exports = {
  getSummary: withCache(getSummary, "getSummary"),
  getCharts: withCache(getCharts, "getCharts"),
  getRecentOrders: withCache(getRecentOrders, "getRecentOrders"),
  getRecentContacts: withCache(getRecentContacts, "getRecentContacts"),
  getActivities: withCache(getActivities, "getActivities"),
  getPipeline: withCache(getPipeline, "getPipeline"),
};
