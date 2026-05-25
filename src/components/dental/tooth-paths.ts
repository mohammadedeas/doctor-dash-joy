// Anatomically-inspired SVG paths for each tooth type
// These are simplified but recognizable tooth shapes for the odontogram

export const TOOTH_PATHS: Record<string, string> = {
  // Incisors — flat blade-like shape
  incisor:
    "M 10,6 C 14,4 18,4 22,6 C 24,8 25,12 24,18 C 23,24 21,30 19,36 C 18,40 16,42 14,42 C 12,42 10,40 9,36 C 7,30 5,24 4,18 C 3,12 4,8 6,6 C 8,5 9,5 10,6 Z",

  // Canines — pointed with single cusp
  canine:
    "M 10,8 C 13,5 17,5 20,8 C 22,10 23,14 22,18 C 21,22 20,26 19,30 C 18,34 17,38 16,40 C 15,42 13,42 12,40 C 11,38 10,34 9,30 C 8,26 7,22 6,18 C 5,14 6,10 8,8 C 9,7 9,7 10,8 Z",

  // Premolars — two cusps, wider
  premolar:
    "M 8,10 C 11,7 15,7 18,8 C 21,9 23,11 24,14 C 25,17 24,21 23,25 C 22,29 20,33 19,37 C 18,40 16,42 14,42 C 12,42 10,40 9,37 C 8,33 6,29 5,25 C 4,21 3,17 4,14 C 5,11 7,9 8,10 Z",

  // Molars — large with multiple cusps
  molar:
    "M 6,12 C 9,8 13,7 17,8 C 21,9 24,11 25,15 C 26,19 25,23 24,27 C 23,31 21,35 20,38 C 19,41 17,43 14,43 C 11,43 9,41 8,38 C 7,35 5,31 4,27 C 3,23 2,19 3,15 C 4,11 5,12 6,12 Z",

  // Wisdom teeth — similar to molars but slightly more rounded
  wisdom:
    "M 7,12 C 10,9 14,8 18,9 C 22,10 24,13 25,17 C 26,21 25,25 24,29 C 23,33 21,36 20,39 C 19,42 17,44 14,44 C 11,44 9,42 8,39 C 7,36 5,33 4,29 C 3,25 2,21 3,17 C 4,13 6,12 7,12 Z",
};

export const TOOTH_VIEWBOX = "0 0 28 48";

// Root paths for visualizing root canal / root structures
export const ROOT_PATHS: Record<string, string> = {
  incisor: "M 14,42 L 14,46",
  canine: "M 14,40 L 14,46",
  premolar: "M 11,40 L 11,46 M 17,40 L 17,46",
  molar: "M 10,40 L 10,46 M 14,40 L 14,46 M 18,40 L 18,46",
  wisdom: "M 10,40 L 10,46 M 14,40 L 14,46 M 18,40 L 18,46",
};

// Crown overlay paths for conditions like crown, bridge, etc.
export const CROWN_OVERLAY: Record<string, string> = {
  incisor:
    "M 10,6 C 14,4 18,4 22,6 C 24,8 25,12 24,18 C 23,24 21,30 19,36 C 18,38 16,38 14,38 C 12,38 10,38 9,36 C 7,30 5,24 4,18 C 3,12 4,8 6,6 C 8,5 9,5 10,6 Z",
  canine:
    "M 10,8 C 13,5 17,5 20,8 C 22,10 23,14 22,18 C 21,22 20,26 19,30 C 18,33 16,34 14,34 C 12,34 10,33 9,30 C 8,26 7,22 6,18 C 5,14 6,10 8,8 C 9,7 9,7 10,8 Z",
  premolar:
    "M 8,10 C 11,7 15,7 18,8 C 21,9 23,11 24,14 C 25,17 24,21 23,25 C 22,28 20,30 18,30 C 16,30 12,30 10,30 C 8,30 6,28 5,25 C 4,21 3,17 4,14 C 5,11 7,9 8,10 Z",
  molar:
    "M 6,12 C 9,8 13,7 17,8 C 21,9 24,11 25,15 C 26,19 25,23 24,27 C 23,30 21,32 18,32 C 16,32 12,32 10,32 C 7,32 5,30 4,27 C 3,23 2,19 3,15 C 4,11 5,12 6,12 Z",
  wisdom:
    "M 7,12 C 10,9 14,8 18,9 C 22,10 24,13 25,17 C 26,21 25,25 24,29 C 23,32 21,34 18,34 C 16,34 12,34 10,34 C 7,34 5,32 4,29 C 3,25 2,21 3,17 C 4,13 6,12 7,12 Z",
};

// Occlusal surface detail for molars/premolars
export const OCCLUSAL_DETAIL: Record<string, string> = {
  premolar: "M 11,14 L 13,18 L 11,22 M 17,14 L 15,18 L 17,22",
  molar: "M 10,16 L 12,20 L 10,24 M 14,14 L 14,26 M 18,16 L 16,20 L 18,24",
  wisdom: "M 10,16 L 12,20 L 10,24 M 14,14 L 14,26 M 18,16 L 16,20 L 18,24",
};
