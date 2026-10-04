// Shared button classes. Size classes are separate so callers never combine two heights.
const buttonBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";

export const primaryButton = `${buttonBase} bg-shark-blue text-white hover:bg-shark-blue-dark`;
export const buttonLarge = "h-12 px-6";
export const buttonSmall = "h-10 px-4 text-sm";
// Links and buttons on a dark blue background need a white focus ring to stay visible.
export const focusOnBrand = "focus-visible:outline-white";
export const textLink =
  "font-semibold text-shark-blue underline decoration-2 underline-offset-4 hover:text-shark-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";
