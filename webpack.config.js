const path = require("path")

module.exports = (currentEnv) => {
  const isDevelopment = currentEnv.WEBPACK_SERVE ? true : false
  return {
    devtool: "source-map",
    entry: {
      index: "./src/index.ts",
      bg: "./src/bg.ts",
    },
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /(node_modules)/,
          use: {
            loader: "swc-loader",
          },
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
    },
  }
}
