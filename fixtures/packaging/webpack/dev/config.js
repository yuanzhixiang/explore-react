var path = require("path");

module.exports = {
  entry: "./input",
  devtool: "source-map",
  output: {
    filename: "output.js",
  },
  resolve: {
    root: [
      // TODO 这里存在的问题是，这个源代码是没有编译的，那么后续改成 flow 语法就会出问题
      path.resolve("../../../../packages/"),
      path.resolve("../../../../build/oss-experimental/"),
    ],
  },
};
