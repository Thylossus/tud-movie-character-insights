module.exports = {
    "extends": "airbnb",
    "plugins": [
        "react"
    ],
    "rules": {
      "no-underscore-dangle": ["error", { "allow": ["_id"] }],
      "no-param-reassign": ["error", { "props": false }]
    }
};
