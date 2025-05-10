import { v4 as uuidv4 } from "uuid"
import type { ClueData, CellData, Direction, CrosswordState } from "@/context/crossword-context"

// Database of clues about fixed income in Indonesian
const CLUE_POOL = [
  { text: "Surat utang yang diterbitkan oleh pemerintah", answer: "OBLIGASI" },
  { text: "Pembayaran berkala dari obligasi", answer: "KUPON" },
  { text: "Risiko perubahan suku bunga", answer: "DURASI" },
  { text: "Nilai yang dibayarkan saat jatuh tempo", answer: "POKOK" },
  { text: "Obligasi yang tidak membayar kupon", answer: "ZEROCOUPON" },
  { text: "Lembaga yang menilai kelayakan kredit", answer: "RATINGAGEN" },
  { text: "Obligasi dengan jaminan aset", answer: "SECURED" },
  { text: "Obligasi tanpa jaminan", answer: "UNSECURED" },
  { text: "Tingkat pengembalian hingga jatuh tempo", answer: "YTM" },
  { text: "Risiko gagal bayar", answer: "KREDIT" },
  { text: "Obligasi yang dapat ditukar dengan saham", answer: "KONVERSI" },
  { text: "Pasar untuk perdagangan obligasi", answer: "SEKUNDER" },
  { text: "Obligasi dengan suku bunga mengambang", answer: "FLOATING" },
  { text: "Obligasi dengan suku bunga tetap", answer: "FIXED" },
  { text: "Selisih imbal hasil antara dua obligasi", answer: "SPREAD" },
  { text: "Tanggal berakhirnya obligasi", answer: "JATUHTEMPO" },
  { text: "Obligasi yang dapat ditarik kembali", answer: "CALLABLE" },
  { text: "Obligasi yang dapat dijual kembali", answer: "PUTABLE" },
  { text: "Surat utang jangka pendek", answer: "SPN" },
  { text: "Obligasi pemerintah untuk ritel", answer: "ORI" },
  { text: "Obligasi korporasi", answer: "KORPORASI" },
  { text: "Obligasi syariah", answer: "SUKUK" },
  { text: "Suku bunga acuan Bank Indonesia", answer: "BIRATE" },
  { text: "Kurva yang menunjukkan hubungan yield dan tenor", answer: "YIELDCURVE" },
  { text: "Risiko inflasi pada obligasi", answer: "INFLASI" },
  { text: "Obligasi dengan peringkat tinggi", answer: "INVESTMENT" },
  { text: "Obligasi dengan peringkat rendah", answer: "JUNK" },
  { text: "Strategi investasi obligasi hingga jatuh tempo", answer: "HOLDTOMATURITY" },
  { text: "Obligasi yang diterbitkan dalam mata uang asing", answer: "GLOBAL" },
  { text: "Obligasi yang diterbitkan dalam mata uang lokal", answer: "DOMESTIK" },
]

export function generateCrossword(): CrosswordState {
  // 1. Select 10 random clues
  const selectedClues = getRandomClues(CLUE_POOL, 10)

  // 2. Initialize an empty grid (25x25 should be enough for most puzzles)
  const gridSize = 25
  const centerPoint = Math.floor(gridSize / 2)
  const grid: (string | null)[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null))

  // 3. Place clues on the grid
  const placedClues: ClueData[] = []

  // Place the first word horizontally in the center
  const firstClue = selectedClues[0]
  const firstClueId = uuidv4()
  const firstWord = firstClue.answer
  const startCol = centerPoint - Math.floor(firstWord.length / 2)

  // Add the first word to the grid
  for (let i = 0; i < firstWord.length; i++) {
    grid[centerPoint][startCol + i] = firstWord[i]
  }

  // Add the first clue to our placed clues
  placedClues.push({
    id: firstClueId,
    text: firstClue.text,
    answer: firstWord,
    direction: "across",
    startRow: centerPoint,
    startCol: startCol,
    length: firstWord.length,
  })

  // 4. Try to place the remaining words
  for (let i = 1; i < selectedClues.length; i++) {
    const clue = selectedClues[i]
    const word = clue.answer

    // Find the best placement for this word
    const placement = findBestPlacement(grid, word, placedClues)

    if (placement) {
      const { row, col, direction } = placement
      const clueId = uuidv4()

      // Place the word on the grid
      if (direction === "across") {
        for (let j = 0; j < word.length; j++) {
          grid[row][col + j] = word[j]
        }
      } else {
        for (let j = 0; j < word.length; j++) {
          grid[row + j][col] = word[j]
        }
      }

      // Add to placed clues
      placedClues.push({
        id: clueId,
        text: clue.text,
        answer: word,
        direction,
        startRow: row,
        startCol: col,
        length: word.length,
      })
    }
  }

  // 5. Convert to final state format
  // Find the bounds of the actual puzzle
  let minRow = grid.length
  let maxRow = 0
  let minCol = grid[0].length
  let maxCol = 0

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] !== null) {
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
      }
    }
  }

  // Add some padding
  minRow = Math.max(0, minRow - 1)
  minCol = Math.max(0, minCol - 1)
  maxRow = Math.min(grid.length - 1, maxRow + 1)
  maxCol = Math.min(grid[0].length - 1, maxCol + 1)

  // Create the final grid
  const finalGrid: CellData[][] = []
  for (let row = minRow; row <= maxRow; row++) {
    const rowData: CellData[] = []
    for (let col = minCol; col <= maxCol; col++) {
      const isBlank = grid[row][col] === null
      rowData.push({
        row: row - minRow,
        col: col - minCol,
        value: "",
        solution: grid[row][col] || "",
        isActive: false,
        isHighlighted: false,
        isBlank,
        clueIds: [],
      })
    }
    finalGrid.push(rowData)
  }

  // Adjust clue positions and add clue references to cells
  const adjustedClues: ClueData[] = placedClues.map((clue) => ({
    ...clue,
    startRow: clue.startRow - minRow,
    startCol: clue.startCol - minCol,
  }))

  // Add clue IDs to cells
  for (const clue of adjustedClues) {
    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === "across" ? clue.startRow : clue.startRow + i
      const col = clue.direction === "across" ? clue.startCol + i : clue.startCol

      if (row >= 0 && row < finalGrid.length && col >= 0 && col < finalGrid[0].length) {
        finalGrid[row][col].clueIds.push(clue.id)
      }
    }
  }

  // Add clue numbers to cells
  let clueNumber = 1
  for (let row = 0; row < finalGrid.length; row++) {
    for (let col = 0; col < finalGrid[0].length; col++) {
      const cell = finalGrid[row][col]
      if (!cell.isBlank) {
        // Check if this cell is the start of any clue
        const isStartOfAcross = adjustedClues.some(
          (clue) => clue.direction === "across" && clue.startRow === row && clue.startCol === col,
        )

        const isStartOfDown = adjustedClues.some(
          (clue) => clue.direction === "down" && clue.startRow === row && clue.startCol === col,
        )

        if (isStartOfAcross || isStartOfDown) {
          cell.clueNumber = clueNumber++
        }
      }
    }
  }

  // Separate clues by direction
  const acrossClues = adjustedClues
    .filter((clue) => clue.direction === "across")
    .sort((a, b) => {
      // Find the clue number for each clue
      const aCell = finalGrid[a.startRow][a.startCol]
      const bCell = finalGrid[b.startRow][b.startCol]
      return (aCell.clueNumber || 0) - (bCell.clueNumber || 0)
    })

  const downClues = adjustedClues
    .filter((clue) => clue.direction === "down")
    .sort((a, b) => {
      // Find the clue number for each clue
      const aCell = finalGrid[a.startRow][a.startCol]
      const bCell = finalGrid[b.startRow][b.startCol]
      return (aCell.clueNumber || 0) - (bCell.clueNumber || 0)
    })

  return {
    grid: finalGrid,
    clues: {
      across: acrossClues,
      down: downClues,
    },
    activeClueId: null,
    activeCell: null,
    isComplete: false,
    startTime: Date.now(),
    completionTime: null,
    hintsUsed: 0,
    viewOnly: false,
  }
}

// Helper function to select random clues
function getRandomClues(pool: { text: string; answer: string }[], count: number) {
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Find the best placement for a word
function findBestPlacement(grid: (string | null)[][], word: string, placedClues: ClueData[]) {
  let bestPlacement = null
  let bestScore = -1

  // Try to place the word by intersecting with existing words
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]

    // Check each cell in the grid for matching letters
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === letter) {
          // Try placing horizontally
          if (isValidPlacement(grid, word, row, col - i, "across")) {
            const score = calculatePlacementScore(grid, word, row, col - i, "across")
            if (score > bestScore) {
              bestScore = score
              bestPlacement = { row, col: col - i, direction: "across" as Direction }
            }
          }

          // Try placing vertically
          if (isValidPlacement(grid, word, row - i, col, "down")) {
            const score = calculatePlacementScore(grid, word, row - i, col, "down")
            if (score > bestScore) {
              bestScore = score
              bestPlacement = { row: row - i, col, direction: "down" as Direction }
            }
          }
        }
      }
    }
  }

  return bestPlacement
}

// Check if a word can be placed at the given position
function isValidPlacement(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction,
): boolean {
  const gridSize = grid.length

  // Check if the word fits on the grid
  if (direction === "across") {
    if (startCol < 0 || startCol + word.length > gridSize) return false
  } else {
    if (startRow < 0 || startRow + word.length > gridSize) return false
  }

  // Check if the placement conflicts with existing letters
  for (let i = 0; i < word.length; i++) {
    const row = direction === "across" ? startRow : startRow + i
    const col = direction === "across" ? startCol + i : startCol

    // If the cell already has a letter, it must match
    if (grid[row][col] !== null && grid[row][col] !== word[i]) {
      return false
    }

    // Check adjacent cells (no words should be side by side without intersection)
    if (grid[row][col] === null) {
      // Check cells above, below, left, and right
      const adjacentCells = [
        { r: row - 1, c: col },
        { r: row + 1, c: col },
        { r: row, c: col - 1 },
        { r: row, c: col + 1 },
      ]

      for (const adj of adjacentCells) {
        if (
          adj.r >= 0 &&
          adj.r < gridSize &&
          adj.c >= 0 &&
          adj.c < gridSize &&
          grid[adj.r][adj.c] !== null &&
          // Exception: allow adjacent cells in the direction of the word
          !(
            (direction === "across" && adj.r === row && (adj.c === col - 1 || adj.c === col + 1)) ||
            (direction === "down" && adj.c === col && (adj.r === row - 1 || adj.r === row + 1))
          )
        ) {
          return false
        }
      }
    }
  }

  return true
}

// Calculate a score for a placement (higher is better)
function calculatePlacementScore(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction,
): number {
  let score = 0

  // Count intersections with existing words
  for (let i = 0; i < word.length; i++) {
    const row = direction === "across" ? startRow : startRow + i
    const col = direction === "across" ? startCol + i : startCol

    if (grid[row][col] === word[i]) {
      score += 1
    }
  }

  return score
}
