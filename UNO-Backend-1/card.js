export class Color {
  static set = new Set(["red", "green", "yellow", "blue", 
                        "black"]);
}
// Declares everything inside Color final, basically
Object.freeze(Color);

export class Card {
  static PLUS_TWO = 10;
  static SKIP = 11;
  static REVERSE = 12;
  static PLUS_FOUR = 13;
  static COLOR_CHANGE = 14;
}
Object.freeze(Card);