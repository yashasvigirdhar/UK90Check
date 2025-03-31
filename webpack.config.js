const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    popup: './popup.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watch: true,
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.test\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}; 