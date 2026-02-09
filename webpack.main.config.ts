import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

import CopyPlugin from "copy-webpack-plugin";
import path from "path";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          // This will copy the entire assets folder from src
          from: path.resolve(__dirname, 'src', 'assets'),
          // To a folder named 'assets' inside your main process build output
          to: 'assets', 
        },
      ],
    }),
    ...plugins,
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  devtool: "source-map"
};
