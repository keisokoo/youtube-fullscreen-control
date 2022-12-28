const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = (currentEnv) => {
  const isDev = currentEnv.WEBPACK_SERVE ? true : false
  return {
    devtool: "source-map",
    entry: {
      index: "./src/index.ts",
      bg: "./src/bg.ts",
    },
    plugins: [new MiniCssExtractPlugin()],
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /(node_modules)/,
          use: {
            loader: "swc-loader",
          },
        },
        {
          test: /\.css$/i,
          use: [
            isDev ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                sourceMap: isDev,
                modules: {
                  mode: "icss",
                },
              },
            },
          ],
        },
        {
          test: /\.(sa|sc)ss$/i,
          use: [
            isDev ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                sourceMap: isDev,
                modules: {
                  mode: "icss",
                },
              },
            },
            {
              loader: "resolve-url-loader",
              options: {
                sourceMap: isDev,
                root: path.resolve(__dirname, "src"),
              },
            },
            {
              loader: require.resolve("sass-loader"),
              options: {
                sourceMap: true,
              },
            },
          ],
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
