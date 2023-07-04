const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  externals: {
    "@novorender/webgl-api": "self.NovoRender",
  },
  devServer: {
    static: "./dist",
    watchFiles: {
      paths: ["src/**/*"],
      options: {
        usePolling: false,
      },
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        "index.html",
        {
          from: "node_modules/@novorender/webgl-api/*.js",
          to: "novorender/[name][ext]",
        },
      ],
    }),
  ],
};
