const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve('src/index.tsx'),
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
    ]
  },
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js',
    ]
  },
  devtool: 'source-map',
  devServer: {
    port: 3002,
    hot: true,
    historyApiFallback: true
  }
};