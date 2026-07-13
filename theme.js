import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    // Tailwind `fontFamily` mappings
    lato: "Lato, sans-serif",
    roboto: "Roboto, sans-serif",
    playfair: "'Playfair Display', serif",
    dmserif: "'DM Serif Display', serif",
    alike: "Alike, serif",
    montecarlo: "MonteCarlo, cursive",
    inter: "Inter, sans-serif",
    poppins: "Poppins, sans-serif",
    sofia: "'Sofia Sans', sans-serif",

    // Chakra uses `heading` and `body` by default
    heading: "Lato, sans-serif", // or change to Playfair/DM Serif if you prefer
    body: "Lato, sans-serif",
  },
});

export default theme;
