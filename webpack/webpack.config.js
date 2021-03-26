const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    entry: './src/index.js',
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    // externalsType: "script",
    externals: {
        "@novotech/novorender": "self.NovoRender",
    },
    devServer: {
        contentBase: './dist',
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                "index.html",
                { from: "node_modules/@novotech/novorender/*.js", to: "novorender/[name][ext]" }
            ],
        }),
    ],
};