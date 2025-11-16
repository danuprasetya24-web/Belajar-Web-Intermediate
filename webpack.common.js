const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { test } = require('picomatch');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './src/scripts/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/favicon.ico', to: 'favicon.ico' },
        { from: 'src/scripts/sw.js', to: 'sw.js' },
        { from: 'public', to: '.' }
      ]
    })
  ],
};