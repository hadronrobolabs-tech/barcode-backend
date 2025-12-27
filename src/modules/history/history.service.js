const historyRepo = require('./history.repository');
const barcodeRepo = require('../barcode/barcode.repository');

const getHistory = async (filters) => {
  return historyRepo.getHistory(filters);
};

const getStatistics = async (filters) => {
  return historyRepo.getStatistics(filters);
};

const getGenerationStats = async (filters) => {
  return barcodeRepo.getGenerationStats(filters);
};

const getHistoryWithStats = async (filters) => {
  const history = await historyRepo.getHistory(filters);
  const statistics = await historyRepo.getStatistics(filters);
  
  // Format history items for display
  const formattedHistory = history.map(item => {
    // Determine status based on barcode status
    let status = 'PENDING';
    if (item.barcode_status === 'SCANNED' || item.barcode_status === 'BOXED') {
      status = 'SUCCESS';
    } else if (item.barcode_status === 'SCRAPPED') {
      status = 'FAILED';
    } else if (item.barcode_status === 'CREATED') {
      status = 'PENDING';
    }

    return {
      id: item.id,
      barcode: item.barcode_value,
      product_name: item.product_name || item.component_name || 'Unknown',
      component_name: item.component_name || 'Unknown',
      component_category: item.component_category || 'UNKNOWN',
      scanned_by: item.scanned_by_name || item.scanned_by_email || 'Unknown',
      scanned_by_email: item.scanned_by_email,
      time: item.scanned_at,
      scan_action: item.scan_action,
      status: status,
      barcode_status: item.barcode_status,
      kit_id: item.kit_id || null,
      remark: item.remark || null
    };
  });

  return {
    statistics: {
      total: parseInt(statistics.total) || 0,
      success: parseInt(statistics.success) || 0,
      pending: parseInt(statistics.pending) || 0,
      failed: parseInt(statistics.failed) || 0
    },
    history: formattedHistory,
    count: formattedHistory.length
  };
};

module.exports = {
  getHistory,
  getStatistics,
  getHistoryWithStats,
  getGenerationStats
};

