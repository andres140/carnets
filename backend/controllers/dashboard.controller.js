const dashboardService = require('../services/dashboard.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession } = require('../utils/auditHelper');

const stats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStats(actorFromSession(req));
  return res.json({ success: true, data });
});

const index = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(actorFromSession(req));
  return res.json({ success: true, data });
});

module.exports = { stats, index };
