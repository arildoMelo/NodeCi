const {clearHash} = require('../services/cache');

module.exports = async (req, res, next) => {
    await next();//this will wait for the handler
    clearHash(req.user.id);
}