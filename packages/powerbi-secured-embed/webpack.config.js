const path = require('path');
const webpack = require('webpack');

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
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY)
    })
  ]
};