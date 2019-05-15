/* Base configuration shared accross webpack bundles */
const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  devtool: "cheap-module-source-map",
  mode: "development",
  module: {
    rules: [
      // Loader that compiles Typescript files into standard Javascript
      {
        test: /\.ts$/,
        loader: "awesome-typescript-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [
      // Reads the "paths" field in tsconfig to generate import aliases
      // This can be used for enabling root imports for example.
      new TsconfigPathsPlugin()
    ]
  }
};
