module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-param-reassign': ['error', { props: false }],
    'no-console': 'off',
  },
};
