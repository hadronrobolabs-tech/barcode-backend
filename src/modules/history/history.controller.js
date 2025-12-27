const historyService = require('./history.service');

const getHistory = async (req, res, next) => {
  try {
    const filters = {
      barcode_id: req.query.barcode_id,
      scanned_by: req.query.scanned_by,
      scan_action: req.query.scan_action,
      status: req.query.status,
      search: req.query.search,
      kit_id: req.query.kit_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      include_all: req.query.include_all === 'true'
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    // Get history with statistics
    const result = await historyService.getHistoryWithStats(filters);
    
    res.json({ 
      success: true, 
      data: result.history,
      statistics: result.statistics,
      count: result.count 
    });
  } catch (err) {
    next(err);
  }
};

const getBarcodeHistory = async (req, res, next) => {
  try {
    const { barcode_id } = req.params;
    const history = await historyService.getHistory({ barcode_id });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      component_id: req.query.component_id,
      scan_action: req.query.scan_action,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const stats = await historyService.getGenerationStats(filters);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    const filters = {
      scanned_by: req.query.scanned_by,
      kit_id: req.query.kit_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const statistics = await historyService.getStatistics(filters);
    res.json({ success: true, data: statistics });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  getBarcodeHistory,
  getStats,
  getStatistics
};

