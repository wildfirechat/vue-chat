module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
  ],
      // Exclude from transpilation
      exclude: [
        /(base64.min.js). /, // Exclude filenames containing `ignoreme`
        /(ptt.min.js). /, // Exclude filenames containing `ignoreme`
      ],
      ignore: [
          '**/ptt.min.js', // Exclude filenames containing `ignoreme`
      ],
}
