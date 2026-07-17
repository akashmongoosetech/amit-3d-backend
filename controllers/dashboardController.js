const dashboardService = require("../services/dashboardService");
const { sendSuccess } = require("../utils/responseHandler");

const getDashboardData = async (req, res, next) => {
  try {
    const { period, fromDate, toDate } = req.query;

    const [summary, charts, recentOrders, recentContacts, activities, pipeline] =
      await Promise.all([
        dashboardService.getSummary(period, fromDate, toDate),
        dashboardService.getCharts(period, fromDate, toDate),
        dashboardService.getRecentOrders(5),
        dashboardService.getRecentContacts(5),
        dashboardService.getActivities(8),
        dashboardService.getPipeline(),
      ]);

    return sendSuccess(res, { summary, charts, recentOrders, recentContacts, activities, pipeline }, "Dashboard data fetched");
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardData };
