const COENG = 0x17D2
const isBase = c => c >= 0x1780 && c <= 0x17B3
const isCombining = c =>
  (c >= 0x17B4 && c <= 0x17D1) || c === 0x17DD || c === 0x200C || c === 0x200D

function segment(text) {
  const chars = Array.from(text)
  const out = []; let i = 0
  while (i < chars.length) {
    const cp = chars[i].codePointAt(0)
    if (isBase(cp)) {
      let cl = chars[i++]
      while (i < chars.length) {
        const n = chars[i].codePointAt(0)
        if (n === COENG) { cl += chars[i++]; if (i < chars.length) cl += chars[i++] }
        else if (isCombining(n)) { cl += chars[i++] }
        else break
      }
      out.push(cl)
    } else {
      if (chars[i].trim() !== '') out.push(chars[i])
      i++
    }
  }
  return out
}

const FILLER = Array.from('កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវសហឡអ')
const KHNUM = ['០','១','២','៣','៤','៥','៦','៧','៨','៩']
const khNum = n => String(n).split('').map(d => KHNUM[+d] ?? d).join('')

export const GameLang = {
  id: 'km',
  segment,
  randomFiller: () => FILLER[(Math.random() * FILLER.length) | 0],
  speak(text) {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'km-KH'; u.rate = 0.88; u.pitch = 1.05
    speechSynthesis.cancel(); speechSynthesis.speak(u)
  },
  fontScale: 0.46,
  ui: {
    levelPrefix: '',
    levelLabel: n => 'កម្រិត ' + khNum(n),
    diffLabel: lvl => lvl < 2 ? 'ងាយ · Easy' : lvl < 4 ? 'មធ្យម · Medium' : 'ពិបាក · Hard',
    wrongMsg: 'មិនទាន់ត្រឹមត្រូវទេ',
    rightMsg: 'ត្រឹមត្រូវ',
    winSub: n => `រកឃើញ ${n} ពាក្យ · found all ${n} words`,
    nextLevel: n => `▶ កម្រិត ${khNum(n)}`,
    nextCategory: '▶ ប្រភេទបន្ទាប់',
  },
}

export const CATEGORIES = [
  { id: 'animals', icon: '🐘', name: 'សត្វ', en: 'Animals', words: [
    {kh:'ដំរី',en:'elephant'},{kh:'ទន្សាយ',en:'rabbit'},{kh:'ក្រពើ',en:'crocodile'},
    {kh:'កណ្ដុរ',en:'rat'},{kh:'ពពែ',en:'goat'},{kh:'ក្របី',en:'buffalo'},
    {kh:'ខ្លា',en:'tiger'},{kh:'ជ្រូក',en:'pig'},{kh:'មាន់',en:'chicken'},
    {kh:'ត្រី',en:'fish'},{kh:'កែប',en:'frog'},{kh:'ពស់',en:'snake'},
  ]},
  { id: 'nature', icon: '🌳', name: 'ធម្មជាតិ', en: 'Nature', words: [
    {kh:'ទន្លេ',en:'river'},{kh:'សមុទ្រ',en:'sea'},{kh:'ដើមឈើ',en:'tree'},
    {kh:'ស្លឹក',en:'leaf'},{kh:'ផ្កាយ',en:'star'},{kh:'ខ្យល់',en:'wind'},
    {kh:'ព្រះអាទិត្យ',en:'sun'},{kh:'ភ្នំ',en:'mountain'},{kh:'ព្រៃ',en:'forest'},
    {kh:'ទឹកជ្រោះ',en:'waterfall'},{kh:'ដី',en:'soil'},{kh:'ថ្ម',en:'rock'},
  ]},
  { id: 'colors', icon: '🎨', name: 'ពណ៌', en: 'Colors', words: [
    {kh:'ក្រហម',en:'red'},{kh:'លឿង',en:'yellow'},{kh:'បៃតង',en:'green'},
    {kh:'ខៀវ',en:'blue'},{kh:'ត្នោត',en:'brown'},{kh:'ប្រផេះ',en:'grey'},
    {kh:'ពណ៌ស',en:'white'},{kh:'ខ្មៅ',en:'black'},{kh:'ផ្កាឈូក',en:'pink'},
    {kh:'លឿងទុំ',en:'orange'},{kh:'ស្វាយ',en:'purple'},
  ]},
  { id: 'food', icon: '🍚', name: 'អាហារ', en: 'Food', words: [
    {kh:'បាយ',en:'rice'},{kh:'នំបុ័ង',en:'bread'},{kh:'សាច់',en:'meat'},
    {kh:'បន្លែ',en:'vegetable'},{kh:'ផ្លែឈើ',en:'fruit'},{kh:'ទឹក',en:'water'},
    {kh:'អំបិល',en:'salt'},{kh:'ស្ករ',en:'sugar'},{kh:'ប្រេង',en:'oil'},
    {kh:'សម្លរ',en:'soup'},{kh:'ស៊ុប',en:'broth'},{kh:'មីសុប',en:'noodle soup'},
  ]},
  { id: 'school', icon: '🏫', name: 'សាលារៀន', en: 'School', words: [
    {kh:'សៀវភៅ',en:'book'},{kh:'ប៊ិច',en:'pen'},{kh:'សាលា',en:'school'},
    {kh:'សិស្ស',en:'student'},{kh:'ខ្មៅដៃ',en:'pencil'},{kh:'បន្ទប់',en:'room'},
    {kh:'មេរៀន',en:'lesson'},{kh:'ក្រដាស',en:'paper'},{kh:'កៅអី',en:'chair'},
    {kh:'គ្រូ',en:'teacher'},{kh:'តុ',en:'desk'},{kh:'ក្ដារខៀន',en:'blackboard'},
  ]},
  { id: 'family', icon: '👨‍👩‍👧', name: 'គ្រួសារ', en: 'Family', words: [
    {kh:'ឪពុក',en:'father'},{kh:'ម្ដាយ',en:'mother'},{kh:'បងប្រុស',en:'older brother'},
    {kh:'បងស្រី',en:'older sister'},{kh:'ជីដូន',en:'grandmother'},{kh:'ជីតា',en:'grandfather'},
    {kh:'កូនប្រុស',en:'son'},{kh:'កូនស្រី',en:'daughter'},{kh:'ប្អូនប្រុស',en:'younger brother'},
    {kh:'ប្អូនស្រី',en:'younger sister'},{kh:'ប្ដី',en:'husband'},{kh:'ប្រពន្ធ',en:'wife'},
  ]},
  { id: 'body', icon: '🧍', name: 'រាងកាយ', en: 'Body', words: [
    {kh:'ក្បាល',en:'head'},{kh:'ភ្នែក',en:'eye'},{kh:'ច្រមុះ',en:'nose'},
    {kh:'ត្រចៀក',en:'ear'},{kh:'មាត់',en:'mouth'},{kh:'ស្មា',en:'shoulder'},
    {kh:'ដៃ',en:'hand'},{kh:'ជើង',en:'foot'},{kh:'ចង្កេះ',en:'waist'},
    {kh:'ក',en:'neck'},{kh:'ខ្នង',en:'back'},
  ]},
  { id: 'fruits', icon: '🍎', name: 'ផ្លែឈើ', en: 'Fruits', words: [
    {kh:'ស្វាយ',en:'mango'},{kh:'ចេក',en:'banana'},{kh:'ដូង',en:'coconut'},
    {kh:'ល្ហុង',en:'papaya'},{kh:'ម្នាស់',en:'pineapple'},{kh:'ឪឡឹក',en:'watermelon'},
    {kh:'ក្រូច',en:'orange'},{kh:'ទទឹម',en:'pomegranate'},{kh:'ផ្លែប៉ោម',en:'apple'},
    {kh:'ទំពាំងបាយជូរ',en:'grape'},{kh:'ស្ដៅ',en:'guava'},{kh:'មៀន',en:'longan'},
  ]},
  { id: 'vegetables', icon: '🥬', name: 'បន្លែ', en: 'Vegetables', words: [
    {kh:'ត្រកួន',en:'morning glory'},{kh:'ស្ពៃ',en:'cabbage'},{kh:'ការ៉ុត',en:'carrot'},
    {kh:'ត្រសក់',en:'cucumber'},{kh:'ខ្ទឹមស',en:'garlic'},{kh:'ខ្ទឹមក្រហម',en:'shallot'},
    {kh:'ដំឡូង',en:'potato'},{kh:'ប៉េងប៉ោះ',en:'tomato'},{kh:'ត្រប់',en:'eggplant'},
    {kh:'ល្ពៅ',en:'pumpkin'},{kh:'ខ្ទឹម',en:'onion'},{kh:'ម្ទេស',en:'chili'},
  ]},
  { id: 'weather', icon: '🌤️', name: 'អាកាសធាតុ', en: 'Weather', words: [
    {kh:'ភ្លៀង',en:'rain'},{kh:'ផ្គរ',en:'thunder'},{kh:'ត្រជាក់',en:'cold'},
    {kh:'ក្ដៅ',en:'hot'},{kh:'ខ្យល់',en:'wind'},{kh:'ពពក',en:'cloud'},
    {kh:'ព្រះអាទិត្យ',en:'sun'},{kh:'ទឹកកក',en:'ice'},{kh:'ធូលី',en:'dust'},
    {kh:'ឧតុនិយម',en:'climate'},
  ]},
]
