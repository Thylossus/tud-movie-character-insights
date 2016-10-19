module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'prefer-template': 'off',
    'no-console': 'off',
    'no-param-reassign': 'off',
    'max-len': ['error', 150],
  },
};
