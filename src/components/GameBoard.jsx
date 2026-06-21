import { useRef, useEffect, useState, useCallback } from 'react'
import { Sound } from '../engine/sound'

function linePath(sr, sc, r, c) {
  const dr = r-sr, dc = c-sc
  if (dr === 0 && dc === 0) return [[sr, sc]]
  let stepR, stepC, len
  if (dr === 0)                      { stepR=0; stepC=Math.sign(dc); len=Math.abs(dc) }
  else if (dc === 0)                 { stepR=Math.sign(dr); stepC=0; len=Math.abs(dr) }
  else if (Math.abs(dr)===Math.abs(dc)) { stepR=Math.sign(dr); stepC=Math.sign(dc); len=Math.abs(dr) }
  else return null
  const path = []
  for (let k = 0; k <= len; k++) path.push([sr+stepR*k, sc+stepC*k])
  return path
}

export default function GameBoard({ puzzle, foundSet, hintCells, onPathComplete, shakeKey, GameLang }) {
  const boardRef    = useRef()
  const dragging    = useRef(false)
  const startRC     = useRef(null)
  const [selecting, setSelecting] = useState([])
  const [shaking,   setShaking]   = useState(false)

  // Fit font to board size
  useEffect(() => {
    if (!puzzle || !boardRef.current) return
    function fit() {
      if (!boardRef.current) return
      const N = puzzle.size
      const w = boardRef.current.clientWidth || boardRef.current.getBoundingClientRect().width
      const cell = w / N
      const scale = GameLang.fontScale * (N >= 14 ? 0.82 : N >= 12 ? 0.91 : 1)
      boardRef.current.style.fontSize = Math.max(9, cell * scale) + 'px'
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [puzzle, GameLang.fontScale])

  // Shake on wrong
  useEffect(() => {
    if (shakeKey <= 0) return
    setShaking(true)
    const t = setTimeout(() => setShaking(false), 320)
    return () => clearTimeout(t)
  }, [shakeKey])

  const cellFromPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y)
    const cell = el?.closest('[data-r]')
    if (!cell || !boardRef.current?.contains(cell)) return null
    return { r: +cell.dataset.r, c: +cell.dataset.c }
  }, [])

  function onPointerDown(e) {
    if (!puzzle) return
    const cell = e.target.closest('[data-r]')
    if (!cell) return
    e.preventDefault()
    boardRef.current?.setPointerCapture(e.pointerId)
    Sound.resume(); Sound.click()
    dragging.current = true
    const r = +cell.dataset.r, c = +cell.dataset.c
    startRC.current = [r, c]
    setSelecting([[r, c]])
  }

  function onPointerMove(e) {
    if (!dragging.current || !e.buttons) return
    const pt = cellFromPoint(e.clientX, e.clientY)
    if (!pt) return
    const [sr, sc] = startRC.current
    const path = linePath(sr, sc, pt.r, pt.c)
    if (path) setSelecting(path)
  }

  function onPointerUp() {
    if (!dragging.current) return
    dragging.current = false
    const path = [...selecting]
    setSelecting([])
    startRC.current = null
    if (path.length >= 2) onPathComplete(path)
  }

  if (!puzzle) {
    return (
      <div className="board-wrap d-flex align-items-center justify-content-center"
           style={{ aspectRatio: '1/1', borderRadius: 20,
                    background: 'var(--kh-board-bg)', border: '1px solid var(--kh-cell-border)' }}>
        <div className="spinner-border text-secondary" role="status" />
      </div>
    )
  }

  const N = puzzle.size
  const selectSet = new Set(selecting.map(([r,c]) => r+','+c))
  const foundCellSet = new Set()
  puzzle.placements.forEach(p => { if (foundSet.has(p.kh)) p.path.forEach(([r,c]) => foundCellSet.add(r+','+c)) })
  const hintSet = new Set((hintCells || []).map(([r,c]) => r+','+c))

  // Count how many words use each cell (for "multi" colour)
  const cellWordCount = {}
  puzzle.placements.forEach(p => {
    if (foundSet.has(p.kh)) {
      p.path.forEach(([r,c]) => { const k = r+','+c; cellWordCount[k] = (cellWordCount[k]||0)+1 })
    }
  })

  return (
    <div className="board-wrap" style={{ position: 'relative' }}>
      <div
        ref={boardRef}
        className={`board${shaking ? ' shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, gridTemplateRows: `repeat(${N}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="grid"
        aria-label="Word search grid"
      >
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const key   = r+','+c
            const isSel = selectSet.has(key)
            const isFound = foundCellSet.has(key)
            const isHint  = hintSet.has(key)
            const isMulti = (cellWordCount[key] || 0) > 1
            let cls = 'cell'
            if (isSel)   cls += ' selecting'
            if (isFound) cls += isMulti ? ' found multi' : ' found'
            if (isHint)  cls += ' hint'
            return (
              <div key={key} className={cls} data-r={r} data-c={c} role="gridcell">
                {puzzle.grid[r][c]}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

