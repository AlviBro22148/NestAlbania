/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Use single-string arrays matching your useFonts keys
        rubik: ['Rubik-Regular','sans-serif'],
        "rubik-bold": ["Rubik-Bold","sans-serif"],
        "rubik-extrabold": ["Rubik-ExtraBold","sans-serif"],
        "rubik-medium": ["Rubik-Medium","sans-serif"],
        "rubik-semibold": ["Rubik-SemiBold","sans-serif"],
        "rubik-light": ["Rubik-Light","sans-serif"],
      },
      colors: {
        "primary": {
          100: "#0061FF0A",
          200: "#0061FF1A",
          300: "#0062ffa1",
        },
        accent: { 100: '#FBFBFD' },
        black: {
          default: '#000000',
          100: '#9c9E98',
          200: '#666876', // Fixed missing #
          300: '#191d31',
        },
        danger: '#F75555'
      },
    },
  },
  plugins: [],
}