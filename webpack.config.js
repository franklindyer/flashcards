const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  mode: "production",
  devtool: false,
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
        core: path.resolve(process.cwd(), 'src/core/'),
        utils: path.resolve(process.cwd(), 'src/utils/'),
        decks: path.resolve(process.cwd(), 'src/decks/'),
        menus: path.resolve(process.cwd(), 'src/menus/'),
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: "flashcards"
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: false,
    port: 4000,
    client: {
        overlay: false
    }
   },
};
