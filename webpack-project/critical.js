const critical = require('critical');

critical.generate({
  base: 'dist/', // Path to the dist directory
  src: 'index.html', // HTML file to extract critical CSS from
  dest: 'index.html', // Output file
  inline: true, // Inline the critical CSS
  minify: true, // Minify the critical CSS
  width: 1300, // Viewport width for calculation
  height: 900, // Viewport height for calculation
  extract: true, // Extract the critical CSS to separate file
});