function success(res, data, message = 'Success') {
  res.json({ success: true, message, data });
}

function fail(res, message, statusCode = 500) {
  res.status(statusCode).json({ success: false, message });
}

module.exports = { success, fail };