// src/middlewares/validate.js
module.exports = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        error.isJoi = true;
        return next(error);
    }
    req.body = value;
    next();
};
