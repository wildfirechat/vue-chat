module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
      // Exclude from transpilation
      exclude: [
        /(base64.min.js). /, // Exclude filenames containing `ignoreme`
      ],
}
