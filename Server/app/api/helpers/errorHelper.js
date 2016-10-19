function returnError(res, code, message) {
  const errorObj = {
    code,
    message,
  };

  res.status(code);
  res.json(errorObj);
}

module.exports = {
  returnError,
};
