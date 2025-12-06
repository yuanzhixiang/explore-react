var path = require("path");

module.exports = {
  entry: "./input",
  devtool: "source-map",
  output: {
    filename: "output.js",
  },
  resolve: {
    root: path.resolve("../../../../build/oss-experimental/"),
  },
};
