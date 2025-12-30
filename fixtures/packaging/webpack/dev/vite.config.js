// 引入 Node 的路径工具，用来拼绝对路径，避免相对路径在不同工作目录下出错。
const path = require("path");

// Vite 读取这个对象作为配置
module.exports = {
  // 把项目根目录设为 fixtures/packaging/webpack/dev
  root: __dirname,
  // 告诉 Vite 在解析 import 时做路径重写
  resolve: {
    alias: [
      // 重写 react-dom/client 到我们自己实现的模块，并且将 react-dom/client 放在 react-dom 前面
      // 防止被下面的 react-dom 重写规则覆盖掉
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(
          __dirname,
          "../../../../build/node_modules/react-dom/client.js"
        ),
      },
      // 重写 react-dom 到我们自己实现的模块
      {
        find: /^react-dom$/,
        replacement: path.resolve(
          __dirname,
          "../../../../build/node_modules/react-dom/index.js"
        ),
      },
      // 重写 react 到我们自己实现的模块
      {
        find: /^react$/,
        replacement: path.resolve(
          __dirname,
          "../../../../build/node_modules/react/index.js"
        ),
      },
    ],
  },
  // Vite 预构建依赖会把包提前打进缓存，这会绕过你的 alias。把这些包排除，确保每次都走你指定的路径
  optimizeDeps: {
    exclude: ["react", "react-dom", "react-dom/client"],
  },
  server: {
    // Vite 默认不允许访问项目外目录。你把允许范围扩到仓库根，这样才能读取 build/node_modules/...
    fs: {
      allow: [path.resolve(__dirname, "../../../../")],
    },
    // 让 Vite 监听 build/node_modules 的改动
    watch: {
      ignored: ["**/node_modules/**", "!**/build/node_modules/**"],
    },
  },
  // 生成 build 时也保留 sourcemap，保证生产构建时仍能映射回源码。
  build: {
    sourcemap: true,
  },
};
