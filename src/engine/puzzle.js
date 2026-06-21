const DIRS = {
  easy: [[0,1],[1,0]],
  diag: [[0,1],[1,0],[1,1],[1,-1]],
  hard: [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]],
}

const shuffle = a => {
  const b = [...a]
  for (let i = b.length-1; i > 0; i--) {
    const j = (Math.random()*(i+1))|0;
    [b[i],b[j]] = [b[j],b[i]]
  }
  return b
}

export function generatePuzzle(words, size, dirsMode, randomFiller) {
  const dirs = DIRS[dirsMode] || DIRS.hard
  const longest = words.reduce((m, w) => Math.max(m, w.cells.length), 0)
  size = Math.max(size, longest + 1, 6)
  const ordered = [...words].sort((a, b) => b.cells.length - a.cells.length)

  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null))
    const placements = []; let ok = true
    for (const w of ordered) {
      if (!placeOne(grid, size, w, dirs, placements)) { ok = false; break }
    }
    if (!ok) continue
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (grid[r][c] === null) grid[r][c] = randomFiller()
    return { grid, size, placements }
  }
  return generatePuzzle(words, size + 1, dirsMode, randomFiller)
}

function placeOne(grid, size, w, dirs, placements) {
  const cells = w.cells, L = cells.length
  const dirList = shuffle([...dirs])
  for (let t = 0; t < 200; t++) {
    const [dr, dc] = dirList[t % dirList.length]
    const r0 = (Math.random() * size) | 0, c0 = (Math.random() * size) | 0
    const rEnd = r0 + dr*(L-1), cEnd = c0 + dc*(L-1)
    if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue
    let fits = true; const path = []
    for (let k = 0; k < L; k++) {
      const r = r0+dr*k, c = c0+dc*k, ex = grid[r][c]
      if (ex !== null && ex !== cells[k]) { fits = false; break }
      path.push([r, c])
    }
    if (!fits) continue
    path.forEach(([r,c], k) => { grid[r][c] = cells[k] })
    placements.push({ kh: w.kh, en: w.en || '', cells, path })
    return true
  }
  return false
}
