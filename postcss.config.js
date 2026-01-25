export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "not dead",
        "not ie <= 11"
      ],
      grid: true,
      supports: true
    },
  },
};
