const { body, validationResult } = require('express-validator');

const validarLogin = [
  body('email').isEmail().withMessage('Email is invalid'),

  body('password').notEmpty().withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return next();
  },
];

module.exports = { validarLogin };
