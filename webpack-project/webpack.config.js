const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production', // Ensures production optimizations (minification, tree shaking, etc.)

  // Entry point of the application
  entry: './src/index.js',

  // Output configuration
  output: {
    filename: 'bundle.[contenthash].js', // Cache busting
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Cleans up the dist folder before each build
  },

  // Module rules for different file types
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader', // Transpile JavaScript with Babel
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ], // Process and minify CSS
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { progressive: true, quality: 65 },
              optipng: { optimizationLevel: 5 },
              pngquant: { quality: [0.65, 0.90], speed: 4 },
              gifsicle: { interlaced: false },
              svgo: { plugins: [{ removeViewBox: false }] },
              webp: { quality: 75 },
            },
          },
        ], // Image optimization
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/experimental', // WebAssembly support
      },
    ],
  },

  // Optimization settings
  optimization: {
    minimize: true, // Minify JavaScript and CSS
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
          },
        },
      }),
      new CssMinimizerPlugin(),
      new ImageMinimizerPlugin({
        test: /\.(jpg|jpeg|png|gif|svg)$/i,
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ['gifsicle', { interlaced: false }],
              ['jpegoptim', { max: 65, progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              ['svgo', { plugins: [{ removeViewBox: false }] }],
              ['webp', { quality: 75 }],
            ],
          },
        },
      }),
    ],
    splitChunks: {
      chunks: 'all', // Code splitting: split large chunks into smaller files
    },
    usedExports: true, // Tree shaking: remove unused code
  },

  // Resolve extensions for imports
  resolve: {
    extensions: ['.js', '.json', '.wasm'], // Resolve JS, JSON, and WASM files
  },

  // Development Server (Optional)
  devServer: {
    static: path.join(__dirname, 'dist'), // Serving static files from dist folder
    compress: true,
    port: 9000,
    hot: true, // Enable Hot Module Replacement (HMR) for faster updates
    open: true, // Opens the browser on server start
  },

  // Plugins
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css', // Extracts CSS into separate files
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html', // Uses a custom HTML template
      inject: 'body', // Inject scripts into the body of the HTML file
    }),
  ],

  // Additional configurations
  performance: {
    hints: 'warning', // Warn about large assets
    maxAssetSize: 1000000, // Maximum size of individual assets (1MB)
    maxEntrypointSize: 1000000, // Maximum size for entry point
  },
};