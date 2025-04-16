const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    code: './src/code.ts',
    ui: './src/ui.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.html']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
}; 