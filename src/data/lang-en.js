export const GameLang = {
  id: 'en',
  segment: text => text.toUpperCase().split('').filter(c => /[A-Z]/.test(c)),
  randomFiller: () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(Math.random() * 26) | 0],
  speak(text) {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.9
    speechSynthesis.cancel(); speechSynthesis.speak(u)
  },
  fontScale: 0.55,
  ui: {
    levelPrefix: 'Level ',
    levelLabel: n => 'Level ' + n,
    diffLabel: lvl => lvl < 2 ? 'Easy' : lvl < 4 ? 'Medium' : 'Hard',
    wrongMsg: 'Not quite, try again!',
    rightMsg: 'Correct!',
    winSub: n => `You found all ${n} words!`,
    nextLevel: n => `▶ Level ${n}`,
    nextCategory: '▶ Next Category',
  },
}

export const CATEGORIES = [
  { id: 'animals', icon: '🐘', name: 'Animals', en: '', words: [
    {kh:'CAT'},{kh:'DOG'},{kh:'PIG'},{kh:'ANT'},{kh:'BEE'},{kh:'COW'},
    {kh:'TIGER'},{kh:'SNAKE'},{kh:'RABBIT'},{kh:'MONKEY'},{kh:'PARROT'},
    {kh:'ELEPHANT'},{kh:'CROCODILE'},{kh:'BUTTERFLY'},{kh:'PENGUIN'},{kh:'DOLPHIN'},
  ]},
  { id: 'nature', icon: '🌳', name: 'Nature', en: '', words: [
    {kh:'SUN'},{kh:'SKY'},{kh:'SEA'},{kh:'LAKE'},{kh:'ROCK'},{kh:'TREE'},
    {kh:'RIVER'},{kh:'CLOUD'},{kh:'STORM'},{kh:'FOREST'},{kh:'ISLAND'},
    {kh:'MOUNTAIN'},{kh:'WATERFALL'},{kh:'VOLCANO'},{kh:'RAINBOW'},{kh:'LIGHTNING'},
  ]},
  { id: 'colors', icon: '🎨', name: 'Colors', en: '', words: [
    {kh:'RED'},{kh:'TAN'},{kh:'BLUE'},{kh:'GOLD'},{kh:'PINK'},{kh:'GREY'},
    {kh:'GREEN'},{kh:'BLACK'},{kh:'WHITE'},{kh:'BROWN'},{kh:'AMBER'},
    {kh:'ORANGE'},{kh:'PURPLE'},{kh:'CRIMSON'},{kh:'SCARLET'},{kh:'TURQUOISE'},
  ]},
  { id: 'food', icon: '🍚', name: 'Food', en: '', words: [
    {kh:'EGG'},{kh:'RICE'},{kh:'MILK'},{kh:'SOUP'},{kh:'SALT'},{kh:'MEAT'},
    {kh:'BREAD'},{kh:'SUGAR'},{kh:'MANGO'},{kh:'NOODLE'},{kh:'CHEESE'},
    {kh:'COCONUT'},{kh:'SANDWICH'},{kh:'PINEAPPLE'},{kh:'CHOCOLATE'},{kh:'SPAGHETTI'},
  ]},
  { id: 'school', icon: '🏫', name: 'School', en: '', words: [
    {kh:'PEN'},{kh:'MAP'},{kh:'GYM'},{kh:'BOOK'},{kh:'DESK'},{kh:'CHALK'},
    {kh:'RULER'},{kh:'PAPER'},{kh:'CHAIR'},{kh:'LESSON'},{kh:'ERASER'},
    {kh:'PENCIL'},{kh:'TEACHER'},{kh:'STUDENT'},{kh:'HOMEWORK'},{kh:'CLASSROOM'},
  ]},
  { id: 'family', icon: '👨‍👩‍👧', name: 'Family', en: '', words: [
    {kh:'MOM'},{kh:'DAD'},{kh:'SON'},{kh:'AUNT'},{kh:'WIFE'},{kh:'BABY'},
    {kh:'UNCLE'},{kh:'SISTER'},{kh:'FATHER'},{kh:'MOTHER'},{kh:'COUSIN'},
    {kh:'BROTHER'},{kh:'DAUGHTER'},{kh:'HUSBAND'},{kh:'GRANDFATHER'},{kh:'GRANDMOTHER'},
  ]},
  { id: 'body', icon: '🧍', name: 'Body', en: '', words: [
    {kh:'EAR'},{kh:'EYE'},{kh:'RIB'},{kh:'TOE'},{kh:'JAW'},{kh:'NOSE'},
    {kh:'BACK'},{kh:'KNEE'},{kh:'NECK'},{kh:'MOUTH'},{kh:'ELBOW'},
    {kh:'FINGER'},{kh:'STOMACH'},{kh:'SHOULDER'},{kh:'FOREHEAD'},{kh:'EYEBROW'},
  ]},
  { id: 'fruits', icon: '🍎', name: 'Fruits', en: '', words: [
    {kh:'FIG'},{kh:'LIME'},{kh:'PLUM'},{kh:'PEAR'},{kh:'KIWI'},{kh:'GRAPE'},
    {kh:'APPLE'},{kh:'MANGO'},{kh:'LEMON'},{kh:'PEACH'},{kh:'GUAVA'},
    {kh:'BANANA'},{kh:'ORANGE'},{kh:'PAPAYA'},{kh:'COCONUT'},{kh:'PINEAPPLE'},{kh:'WATERMELON'},
  ]},
  { id: 'vegetables', icon: '🥬', name: 'Vegetables', en: '', words: [
    {kh:'YAM'},{kh:'PEA'},{kh:'CORN'},{kh:'LEEK'},{kh:'CHILI'},{kh:'ONION'},
    {kh:'CARROT'},{kh:'GARLIC'},{kh:'POTATO'},{kh:'TOMATO'},{kh:'CELERY'},
    {kh:'SPINACH'},{kh:'CABBAGE'},{kh:'PUMPKIN'},{kh:'BROCCOLI'},{kh:'CUCUMBER'},
  ]},
  { id: 'weather', icon: '🌤️', name: 'Weather', en: '', words: [
    {kh:'ICE'},{kh:'FOG'},{kh:'SUN'},{kh:'HOT'},{kh:'RAIN'},{kh:'WIND'},
    {kh:'COLD'},{kh:'SNOW'},{kh:'CLOUD'},{kh:'STORM'},{kh:'FROST'},
    {kh:'THUNDER'},{kh:'BLIZZARD'},{kh:'LIGHTNING'},{kh:'HURRICANE'},{kh:'DRIZZLE'},
  ]},
]
