import "../_config/logger";

const request = function (req, res, next) {
    logger.info({
        url: req.url,
        method: req.method,
        originalUrl: req.originalUrl,
        ip: req.ip,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
    });
    next();
}

export default request;
