// src/utils/response.util.js
export const successResponse = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};
