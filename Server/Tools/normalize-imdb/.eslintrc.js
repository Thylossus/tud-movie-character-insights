module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-param-reassign': ['error', { props: false }],
    'prefer-template': 'off',
    'no-console': 'off',
  },
};
