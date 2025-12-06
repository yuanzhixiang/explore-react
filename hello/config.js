var path = require("path");

module.exports = {
  entry: "./input",
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "../build/oss-experimental/hello"),
    filename: "index.js",
  },
};
