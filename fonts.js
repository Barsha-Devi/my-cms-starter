// Fonts you can choose from in the admin. All are free Google Fonts.
window.FONT_LIST = [
  "Space Grotesk", "Inter", "DM Sans", "Manrope", "Outfit", "Sora", "Poppins", "Montserrat", "Raleway", "Work Sans",
  "Nunito", "Quicksand", "Rubik", "Karla", "Josefin Sans", "Open Sans", "Roboto", "Archivo",
  "Playfair Display", "Lora", "Merriweather", "Libre Baskerville", "Cormorant Garamond", "EB Garamond", "Crimson Text",
  "Source Serif 4", "Fraunces", "Bitter", "DM Serif Display", "Abril Fatface",
  "Oswald", "Bebas Neue", "Anton", "Syne", "Unbounded",
  "Caveat", "Dancing Script", "Pacifico", "Lobster",
  "IBM Plex Mono", "JetBrains Mono", "Space Mono"
];
// These have only one weight, so asking for more would make Google reject the request.
window.SINGLE_WEIGHT = ["DM Serif Display", "Abril Fatface", "Bebas Neue", "Anton", "Pacifico", "Lobster"];
window.fontsUrl = function (names) {
  const fam = [...new Set(names)].filter(n => window.FONT_LIST.includes(n)).map(n =>
    "family=" + n.replace(/ /g, "+") + (window.SINGLE_WEIGHT.includes(n) ? "" : ":wght@400;700"));
  return fam.length ? "https://fonts.googleapis.com/css2?" + fam.join("&") + "&display=swap" : "";
};
