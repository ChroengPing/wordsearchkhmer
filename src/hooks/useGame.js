import { useReducer, useEffect, useRef, useCallback } from 'react'
import { generatePuzzle } from '../engine/puzzle'
import { Sound } from '../engine/sound'

const REWARDS = [
  { icon: '🥉', label: 'Bronze badge' },
  { icon: '🎨', label: 'Category unlocked' },
  { icon: '🥈', label: 'Silver badge' },
  { icon: '⚡', label: 'Speed solver' },
  { icon: '🥇', label: 'Gold badge' },
  { icon: '👑', label: 'Word master' },
]

const shuffle = a => {
  const b = [...a]
  for (let i = b.length-1; i > 0; i--) {
    const j = (Math.random()*(i+1))|0;[b[i],b[j]]=[b[j],b[i]]
  }
  return b
}

function sizeForLevel(lvl)  { return 8 + lvl }
function dirsForLevel(lvl)  { return lvl < 2 ? 'easy' : lvl < 4 ? 'diag' : 'hard' }
function wordCountForLevel(lvl, bankLen) { return Math.min(bankLen, 5 + lvl) }

const initState = {
  catIdx: 0, lvlIdx: 0,
  puzzle: null,
  foundSet: new Set(),
  clearedSet: new Set(), starsMap: {},
  score: 0, seconds: 0, coins: 0, streak: 0, bestStreak: 0,
  hintsLeft: 3, finished: false,
  isAdmin: false,
  winData: null,
  hintCells: null,
  lastFloat: null,  // { text, id } — triggers float popup in UI
}

function reducer(state, action) {
  switch (action.type) {

    case 'INIT_PERSIST':
      return { ...state, clearedSet: action.clearedSet, starsMap: action.starsMap, isAdmin: action.isAdmin }

    case 'LOAD': {
      return {
        ...state,
        catIdx: action.catIdx, lvlIdx: action.lvlIdx,
        puzzle: action.puzzle,
        foundSet: new Set(),
        score: 0, seconds: 0, coins: 0, streak: 0, bestStreak: 0,
        hintsLeft: 3, finished: false,
        winData: null, hintCells: null, lastFloat: null,
      }
    }

    case 'TICK':
      return state.finished ? state : { ...state, seconds: state.seconds + 1 }

    case 'WRONG':
      return { ...state, streak: 0 }

    case 'FOUND': {
      const mult    = 1 + state.streak
      const pts     = 100 * mult
      const newFoundSet = new Set(state.foundSet)
      newFoundSet.add(action.kh)
      const newStreak     = state.streak + 1
      const newScore      = state.score + pts
      const newCoins      = state.coins + action.cellCount
      const newBestStreak = Math.max(state.bestStreak, newStreak)
      const floatText     = '+' + pts + (mult > 1 ? '  ×' + mult : '')

      if (newFoundSet.size < state.puzzle.placements.length) {
        return {
          ...state,
          foundSet: newFoundSet,
          score: newScore, coins: newCoins, streak: newStreak, bestStreak: newBestStreak,
          lastFloat: { text: floatText, id: Date.now() },
        }
      }

      // All words found → win!
      const fast    = state.seconds < 25 + state.lvlIdx * 10
      const noHints = state.hintsLeft === 3
      let stars = 1
      if (fast || noHints) stars = 2
      if (fast && noHints) stars = 3

      const bonus      = Math.max(0, 300 - state.seconds * 2) + state.hintsLeft * 30
      const coinReward = 8 + state.lvlIdx * 2 + stars * 3
      const finalScore = newScore + bonus
      const finalCoins = newCoins + coinReward
      const levelKey   = action.levelKey

      const newCleared = new Set(state.clearedSet)
      newCleared.add(levelKey)
      const newStarsMap = { ...state.starsMap }
      if ((newStarsMap[levelKey] || 0) < stars) newStarsMap[levelKey] = stars

      return {
        ...state,
        foundSet: newFoundSet,
        score: finalScore, coins: finalCoins,
        streak: newStreak, bestStreak: newBestStreak,
        finished: true,
        clearedSet: newCleared, starsMap: newStarsMap,
        lastFloat: { text: floatText, id: Date.now() },
        winData: {
          stars, score: finalScore, time: state.seconds,
          coins: finalCoins, coinReward, bestStreak: newBestStreak,
          xp: finalScore + stars * 25,
          wordCount: state.puzzle.placements.length,
          hasNextLvl: state.lvlIdx < 4,
          allDone: state.lvlIdx >= 4 && state.catIdx >= action.totalCats - 1,
          nextLvlNum: state.lvlIdx + 2,
          reward: REWARDS[Math.min(state.lvlIdx, REWARDS.length - 1)],
        },
      }
    }

    case 'HINT':
      return { ...state, hintsLeft: state.hintsLeft - 1, hintCells: action.cells, streak: 0 }

    case 'CLEAR_HINT':
      return { ...state, hintCells: null }

    case 'SET_ADMIN':
      return { ...state, isAdmin: action.v }

    case 'DISMISS_WIN':
      return { ...state, winData: null }

    default:
      return state
  }
}

export function useGame({ GameLang, CATEGORIES }) {
  const [state, dispatch] = useReducer(reducer, initState)
  const langId = GameLang.id

  // Load persistence on mount
  useEffect(() => {
    try {
      const cs = new Set(JSON.parse(localStorage.getItem(`ws_cleared_${langId}`) || '[]'))
      const sm = JSON.parse(localStorage.getItem(`ws_stars_${langId}`) || '{}')
      const ia = sessionStorage.getItem('ws_admin') === '1'
      dispatch({ type: 'INIT_PERSIST', clearedSet: cs, starsMap: sm, isAdmin: ia })
    } catch(e) {
      dispatch({ type: 'INIT_PERSIST', clearedSet: new Set(), starsMap: {}, isAdmin: false })
    }
  }, [langId])

  // Timer
  useEffect(() => {
    if (!state.puzzle || state.finished) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [!!state.puzzle, state.finished])

  // Side effects: found word sounds + win sound + persist on win
  const prevFoundSize = useRef(0)
  useEffect(() => {
    const newSize = state.foundSet.size
    if (newSize > prevFoundSize.current) {
      if (state.finished) {
        Sound.win()
        try {
          localStorage.setItem(`ws_cleared_${langId}`, JSON.stringify([...state.clearedSet]))
          localStorage.setItem(`ws_stars_${langId}`, JSON.stringify(state.starsMap))
        } catch(e) {}
      } else {
        Sound.found()
        GameLang.speak(GameLang.ui.rightMsg)
      }
    }
    prevFoundSize.current = newSize
  }, [state.foundSet])

  const loadLevel = useCallback((catIdx, lvlIdx) => {
    const cat = CATEGORIES[catIdx]
    if (!cat) return
    const dirsMode = dirsForLevel(lvlIdx)
    const count    = wordCountForLevel(lvlIdx, cat.words.length)
    const bank     = cat.words
      .map(w => ({ kh: w.kh, en: w.en || '', cells: GameLang.segment(w.kh) }))
      .filter(w => w.cells.length >= 2)
    const words  = shuffle([...bank]).slice(0, count)
    const size   = sizeForLevel(lvlIdx)
    const puzzle = generatePuzzle(words, size, dirsMode, GameLang.randomFiller)
    dispatch({ type: 'LOAD', catIdx, lvlIdx, puzzle })
    try { localStorage.setItem(`ws_lastCat_${langId}`, cat.id) } catch(e) {}
  }, [CATEGORIES, GameLang, langId])

  const evaluatePath = useCallback((path, currentState) => {
    const s = currentState || state
    if (!s.puzzle || s.finished || path.length < 2) return null
    const seq = path.map(([r,c]) => s.puzzle.grid[r][c]).join('|')
    for (const p of s.puzzle.placements) {
      if (s.foundSet.has(p.kh)) continue
      if (seq === p.cells.join('|') || seq === [...p.cells].reverse().join('|')) {
        dispatch({
          type: 'FOUND',
          kh: p.kh,
          cellCount: p.cells.length,
          levelKey: `${CATEGORIES[s.catIdx].id}-${s.lvlIdx}`,
          totalCats: CATEGORIES.length,
        })
        return p
      }
    }
    Sound.wrong()
    dispatch({ type: 'WRONG' })
    return null
  }, [state, CATEGORIES])

  const useHint = useCallback(() => {
    if (state.hintsLeft <= 0 || state.finished || !state.puzzle) return
    const unfound = state.puzzle.placements.filter(p => !state.foundSet.has(p.kh))
    if (!unfound.length) return
    const target = unfound[(Math.random() * unfound.length) | 0]
    Sound.hint()
    dispatch({ type: 'HINT', cells: target.path.slice(0, 2) })
    setTimeout(() => dispatch({ type: 'CLEAR_HINT' }), 3400)
  }, [state.hintsLeft, state.finished, state.puzzle, state.foundSet])

  const playCustom = useCallback((words, size, dirsMode) => {
    const bank = words
      .map(w => ({ kh: w.kh, en: w.en || '', cells: GameLang.segment(w.kh) }))
      .filter(w => w.cells.length >= 2)
    if (bank.length < 2) return false
    const puzzle = generatePuzzle(bank, size || 0, dirsMode || 'hard', GameLang.randomFiller)
    dispatch({ type: 'LOAD', catIdx: -1, lvlIdx: 0, puzzle })
    return true
  }, [GameLang])

  const setAdmin = useCallback((v) => {
    dispatch({ type: 'SET_ADMIN', v })
    try { if (v) sessionStorage.setItem('ws_admin', '1'); else sessionStorage.removeItem('ws_admin') } catch(e) {}
  }, [])

  return {
    state,
    loadLevel,
    evaluatePath,
    useHint,
    restart:    () => loadLevel(state.catIdx, state.lvlIdx),
    regenerate: () => loadLevel(state.catIdx, state.lvlIdx),
    next: () => {
      if (state.lvlIdx < 4) loadLevel(state.catIdx, state.lvlIdx + 1)
      else if (state.catIdx < CATEGORIES.length - 1) loadLevel(state.catIdx + 1, 0)
    },
    setAdmin,
    playCustom,
    dismissWin: () => dispatch({ type: 'DISMISS_WIN' }),
  }
}
