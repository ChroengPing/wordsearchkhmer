"use strict";

/* -----------------------------------------------------------------------
 * English language data — word banks + UI strings + text segmenter
 * Loaded BEFORE engine.js. Exposes: window.GameLang, window.CATEGORIES
 * --------------------------------------------------------------------- */

const GameLang = {
  id: "en",
  segment:      text => text.toUpperCase().split("").filter(c => /[A-Z]/.test(c)),
  randomFiller: ()   => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[(Math.random() * 26) | 0],
  speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.9;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  },
  fontScale: 0.55,
  ui: {
    levelPrefix:   "Level ",
    levelLabel:    n => "Level " + n,
    diffLabel:     lvl => lvl < 2 ? "Easy" : lvl < 4 ? "Medium" : "Hard",
    wrongMsg:      "Not quite, try again!",
    rightMsg:      "Correct!",
    winSub:        n => `You found all ${n} words!`,
    nextLevel:     n => `▶ Level ${n}`,
    nextCategory:  "▶ Next Category",
  },
};

const CATEGORIES = [
  { id: "animals", icon: "🐘", name: "Animals", en: "", words: [
    // easy (3–4 letters)
    {kh:"CAT"},{kh:"DOG"},{kh:"PIG"},{kh:"ANT"},{kh:"BEE"},{kh:"COW"},
    // medium (5–7 letters)
    {kh:"TIGER"},{kh:"SNAKE"},{kh:"RABBIT"},{kh:"MONKEY"},{kh:"PARROT"},
    // hard (8+ letters)
    {kh:"ELEPHANT"},{kh:"CROCODILE"},{kh:"BUTTERFLY"},{kh:"PENGUIN"},{kh:"DOLPHIN"},
  ]},
  { id: "nature", icon: "🌳", name: "Nature", en: "", words: [
    // easy
    {kh:"SUN"},{kh:"SKY"},{kh:"SEA"},{kh:"LAKE"},{kh:"ROCK"},{kh:"TREE"},
    // medium
    {kh:"RIVER"},{kh:"CLOUD"},{kh:"STORM"},{kh:"FOREST"},{kh:"ISLAND"},
    // hard
    {kh:"MOUNTAIN"},{kh:"WATERFALL"},{kh:"VOLCANO"},{kh:"RAINBOW"},{kh:"LIGHTNING"},
  ]},
  { id: "colors", icon: "🎨", name: "Colors", en: "", words: [
    // easy
    {kh:"RED"},{kh:"TAN"},{kh:"BLUE"},{kh:"GOLD"},{kh:"PINK"},{kh:"GREY"},
    // medium
    {kh:"GREEN"},{kh:"BLACK"},{kh:"WHITE"},{kh:"BROWN"},{kh:"AMBER"},
    // hard
    {kh:"ORANGE"},{kh:"PURPLE"},{kh:"CRIMSON"},{kh:"SCARLET"},{kh:"TURQUOISE"},
  ]},
  { id: "food", icon: "🍚", name: "Food", en: "", words: [
    // easy
    {kh:"EGG"},{kh:"RICE"},{kh:"MILK"},{kh:"SOUP"},{kh:"SALT"},{kh:"MEAT"},
    // medium
    {kh:"BREAD"},{kh:"SUGAR"},{kh:"MANGO"},{kh:"NOODLE"},{kh:"CHEESE"},
    // hard
    {kh:"COCONUT"},{kh:"SANDWICH"},{kh:"PINEAPPLE"},{kh:"CHOCOLATE"},{kh:"SPAGHETTI"},
  ]},
  { id: "school", icon: "🏫", name: "School", en: "", words: [
    // easy
    {kh:"PEN"},{kh:"MAP"},{kh:"GYM"},{kh:"BOOK"},{kh:"DESK"},{kh:"CHALK"},
    // medium
    {kh:"RULER"},{kh:"PAPER"},{kh:"CHAIR"},{kh:"LESSON"},{kh:"ERASER"},
    // hard
    {kh:"PENCIL"},{kh:"TEACHER"},{kh:"STUDENT"},{kh:"HOMEWORK"},{kh:"CLASSROOM"},
  ]},
  { id: "family", icon: "👨‍👩‍👧", name: "Family", en: "", words: [
    // easy
    {kh:"MOM"},{kh:"DAD"},{kh:"SON"},{kh:"AUNT"},{kh:"WIFE"},{kh:"BABY"},
    // medium
    {kh:"UNCLE"},{kh:"SISTER"},{kh:"FATHER"},{kh:"MOTHER"},{kh:"COUSIN"},
    // hard
    {kh:"BROTHER"},{kh:"DAUGHTER"},{kh:"HUSBAND"},{kh:"GRANDFATHER"},{kh:"GRANDMOTHER"},
  ]},
  { id: "body", icon: "🧍", name: "Body", en: "", words: [
    // easy
    {kh:"EAR"},{kh:"EYE"},{kh:"RIB"},{kh:"TOE"},{kh:"JAW"},{kh:"NOSE"},
    // medium
    {kh:"BACK"},{kh:"KNEE"},{kh:"NECK"},{kh:"MOUTH"},{kh:"ELBOW"},
    // hard
    {kh:"FINGER"},{kh:"STOMACH"},{kh:"SHOULDER"},{kh:"FOREHEAD"},{kh:"EYEBROW"},
  ]},
  { id: "fruits", icon: "🍎", name: "Fruits", en: "", words: [
    // easy
    {kh:"FIG"},{kh:"LIME"},{kh:"PLUM"},{kh:"PEAR"},{kh:"KIWI"},{kh:"GRAPE"},
    // medium
    {kh:"APPLE"},{kh:"MANGO"},{kh:"LEMON"},{kh:"PEACH"},{kh:"GUAVA"},
    // hard
    {kh:"BANANA"},{kh:"ORANGE"},{kh:"PAPAYA"},{kh:"COCONUT"},{kh:"PINEAPPLE"},{kh:"WATERMELON"},
  ]},
  { id: "vegetables", icon: "🥬", name: "Vegetables", en: "", words: [
    // easy
    {kh:"YAM"},{kh:"PEA"},{kh:"CORN"},{kh:"LEEK"},{kh:"CHILI"},{kh:"ONION"},
    // medium
    {kh:"CARROT"},{kh:"GARLIC"},{kh:"POTATO"},{kh:"TOMATO"},{kh:"CELERY"},
    // hard
    {kh:"SPINACH"},{kh:"CABBAGE"},{kh:"PUMPKIN"},{kh:"BROCCOLI"},{kh:"CUCUMBER"},
  ]},
  { id: "weather", icon: "🌤️", name: "Weather", en: "", words: [
    // easy
    {kh:"ICE"},{kh:"FOG"},{kh:"SUN"},{kh:"HOT"},{kh:"RAIN"},{kh:"WIND"},
    // medium
    {kh:"COLD"},{kh:"SNOW"},{kh:"CLOUD"},{kh:"STORM"},{kh:"FROST"},
    // hard
    {kh:"THUNDER"},{kh:"BLIZZARD"},{kh:"LIGHTNING"},{kh:"HURRICANE"},{kh:"DRIZZLE"},
  ]},
];
