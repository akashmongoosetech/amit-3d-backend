const orderService = require("../services/orderService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const getAll = async (req, res, next) => {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const result = await orderService.list({
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return sendSuccess(
      res,
      { orders: result.orders, pagination: result.pagination },
      "Orders fetched successfully"
    );
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getById(id);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    return sendSuccess(res, order, "Order fetched successfully");
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const order = await orderService.updateOrderStatus(id, orderStatus);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    return sendSuccess(res, order, `Order status updated to ${orderStatus}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, updateOrderStatus };
