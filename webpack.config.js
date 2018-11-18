const webpack = require("webpack");
const merge = require("webpack-merge");
const path = require("path");

var commonConfig = {
  output: {
    path: path.resolve(__dirname + "/dist/")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        include: __dirname,
        exclude: /node_modules/
      },
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  }
};

module.exports = [
  merge(commonConfig, {
    entry: path.resolve(__dirname + "/src/v-tree-data-table.vue"),
    output: {
      filename: "v-tree-data-table.js",
      libraryTarget: "umd",

      // These options are useful if the user wants to load the module with AMD
      library: "v-tree-data-table",
      umdNamedDefine: true
    }
  }),
  merge(commonConfig, {
    entry: path.resolve(__dirname + "/example/main.js"),
    output: {
      filename: "example.js",
      libraryTarget: "umd",
    }
  })
];
