"use client"

import type React from "react"
import { createContext, useContext, useEffect, useReducer } from "react"
import { generateCrossword } from "@/lib/crossword-generator"

// Types
export type Direction = "across" | "down"

export interface ClueData {
  id: string
  text: string
  answer: string
  direction: Direction
  startRow: number
  startCol: number
  length: number
}

export interface CellData {
  row: number
  col: number
  value: string
  solution: string
  isActive: boolean
  isHighlighted: boolean
  isBlank: boolean
  clueIds: string[] // References to clues this cell belongs to
  clueNumber?: number // Optional clue number for display
}

export interface CrosswordState {
  grid: CellData[][]
  clues: {
    across: ClueData[]
    down: ClueData[]
  }
  activeClueId: string | null
  activeCell: { row: number; col: number } | null
  isComplete: boolean
  startTime: number
  completionTime: number | null // Store completion time
  hintsUsed: number
  viewOnly: boolean // New state to track if puzzle is in view-only mode
}

type CrosswordAction =
  | { type: "NEW_PUZZLE" }
  | { type: "SET_ACTIVE_CELL"; payload: { row: number; col: number } }
  | { type: "SET_ACTIVE_CLUE"; payload: string }
  | { type: "SET_CELL_VALUE"; payload: { row: number; col: number; value: string } }
  | { type: "MOVE_ACTIVE_CELL"; payload: { direction: "up" | "down" | "left" | "right" | "next" | "prev" } }
  | { type: "VALIDATE_PUZZLE" }
  | { type: "LOAD_SAVED_PUZZLE"; payload: CrosswordState }
  | { type: "USE_HINT"; payload: { clueId: string } }
  | { type: "TOGGLE_CLUE_DIRECTION"; payload: { row: number; col: number } }
  | { type: "SET_VIEW_ONLY"; payload: boolean } // New action to set view-only mode

interface CrosswordContextType {
  state: CrosswordState
  dispatch: React.Dispatch<CrosswordAction>
  validateCell: (row: number, col: number) => boolean
  isClueComplete: (clueId: string) => boolean
  isClueCorrect: (clueId: string) => boolean
}

const CrosswordContext = createContext<CrosswordContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = "crossword-puzzle-state"

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function crosswordReducer(state: CrosswordState, action: CrosswordAction): CrosswordState {
  // If in view-only mode, only allow certain actions
  if (state.viewOnly) {
    switch (action.type) {
      case "NEW_PUZZLE":
      case "SET_VIEW_ONLY":
        // These actions are allowed in view-only mode
        break
      default:
        // Block other actions in view-only mode
        return state
    }
  }

  switch (action.type) {
    case "USE_HINT": {
      const { clueId } = action.payload
      const clue = [...state.clues.across, ...state.clues.down].find((c) => c.id === clueId)

      if (!clue || !state.activeCell) return state

      const { row, col } = state.activeCell
      const cell = state.grid[row][col]

      // If the cell already has the correct value, find another cell in the same clue
      if (cell.value === cell.solution) {
        // Find all cells for this clue
        const clueCells = []
        for (let i = 0; i < clue.length; i++) {
          const cellRow = clue.direction === "across" ? clue.startRow : clue.startRow + i
          const cellCol = clue.direction === "across" ? clue.startCol + i : clue.startCol

          if (cellRow >= 0 && cellRow < state.grid.length && cellCol >= 0 && cellCol < state.grid[0].length) {
            const currentCell = state.grid[cellRow][cellCol]
            if (currentCell.value !== currentCell.solution) {
              clueCells.push({ row: cellRow, col: cellCol })
            }
          }
        }

        // If there are empty cells, pick one randomly
        if (clueCells.length > 0) {
          const randomCell = clueCells[Math.floor(Math.random() * clueCells.length)]

          // Update the grid with the hint
          const newGrid = state.grid.map((r, rIndex) =>
            r.map((c, cIndex) => {
              if (rIndex === randomCell.row && cIndex === randomCell.col) {
                return { ...c, value: c.solution }
              }
              return c
            }),
          )

          const newState = {
            ...state,
            grid: newGrid,
            hintsUsed: state.hintsUsed + 1,
          }

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
          return newState
        }
      } else {
        // Reveal the current cell
        const newGrid = state.grid.map((r, rIndex) =>
          r.map((c, cIndex) => {
            if (rIndex === row && cIndex === col) {
              return { ...c, value: c.solution }
            }
            return c
          }),
        )

        const newState = {
          ...state,
          grid: newGrid,
          hintsUsed: state.hintsUsed + 1,
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
        return newState
      }

      return state
    }

    case "NEW_PUZZLE": {
      const newState = generateCrossword()
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "SET_ACTIVE_CELL": {
      const { row, col } = action.payload
      if (row < 0 || row >= state.grid.length || col < 0 || col >= state.grid[0].length) {
        return state
      }

      const cell = state.grid[row][col]
      if (cell.isBlank) return state

      // Find the active clue based on the cell
      let activeClueId = state.activeClueId
      if (cell.clueIds.length > 0) {
        if (!activeClueId || !cell.clueIds.includes(activeClueId)) {
          activeClueId = cell.clueIds[0]
        }
      }

      // Update highlighted cells based on the active clue
      const newGrid = state.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
        })),
      )

      // Set the active cell
      newGrid[row][col].isActive = true

      // Highlight cells for the active clue
      if (activeClueId) {
        const activeClue = [...state.clues.across, ...state.clues.down].find((clue) => clue.id === activeClueId)

        if (activeClue) {
          for (let i = 0; i < activeClue.length; i++) {
            const highlightRow = activeClue.direction === "across" ? activeClue.startRow : activeClue.startRow + i
            const highlightCol = activeClue.direction === "across" ? activeClue.startCol + i : activeClue.startCol

            if (
              highlightRow >= 0 &&
              highlightRow < newGrid.length &&
              highlightCol >= 0 &&
              highlightCol < newGrid[0].length
            ) {
              newGrid[highlightRow][highlightCol].isHighlighted = true
            }
          }
        }
      }

      const newState = {
        ...state,
        grid: newGrid,
        activeCell: { row, col },
        activeClueId,
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "SET_ACTIVE_CLUE": {
      const clueId = action.payload
      const clue = [...state.clues.across, ...state.clues.down].find((c) => c.id === clueId)

      if (!clue) return state

      // Update highlighted cells based on the active clue
      const newGrid = state.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
        })),
      )

      // Highlight cells for the active clue
      for (let i = 0; i < clue.length; i++) {
        const highlightRow = clue.direction === "across" ? clue.startRow : clue.startRow + i
        const highlightCol = clue.direction === "across" ? clue.startCol + i : clue.startCol

        if (
          highlightRow >= 0 &&
          highlightRow < newGrid.length &&
          highlightCol >= 0 &&
          highlightCol < newGrid[0].length
        ) {
          newGrid[highlightRow][highlightCol].isHighlighted = true
        }
      }

      // Set the first cell as active
      newGrid[clue.startRow][clue.startCol].isActive = true

      const newState = {
        ...state,
        grid: newGrid,
        activeClueId: clueId,
        activeCell: { row: clue.startRow, col: clue.startCol },
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "SET_CELL_VALUE": {
      const { row, col, value } = action.payload
      if (row < 0 || row >= state.grid.length || col < 0 || col >= state.grid[0].length) {
        return state
      }

      const cell = state.grid[row][col]
      if (cell.isBlank) return state

      // Update the cell value
      const newGrid = state.grid.map((r, rIndex) =>
        r.map((c, cIndex) => {
          if (rIndex === row && cIndex === col) {
            return { ...c, value: value.toUpperCase() }
          }
          return c
        }),
      )

      // Check if the puzzle is complete
      const isComplete = newGrid.every((row) => row.every((cell) => cell.isBlank || cell.value === cell.solution))

      const newState = {
        ...state,
        grid: newGrid,
        isComplete: isComplete,
        // If puzzle is complete, store the completion time
        completionTime:
          isComplete && !state.isComplete ? Math.floor((Date.now() - state.startTime) / 1000) : state.completionTime,
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "MOVE_ACTIVE_CELL": {
      if (!state.activeCell) return state

      const { row, col } = state.activeCell
      const { direction } = action.payload

      let newRow = row
      let newCol = col

      if (direction === "up") newRow = row - 1
      else if (direction === "down") newRow = row + 1
      else if (direction === "left") newCol = col - 1
      else if (direction === "right") newCol = col + 1
      else if (direction === "next" || direction === "prev") {
        // Move to the next/prev cell in the current clue
        const activeClue = [...state.clues.across, ...state.clues.down].find((clue) => clue.id === state.activeClueId)

        if (activeClue) {
          const offset = direction === "next" ? 1 : -1

          if (activeClue.direction === "across") {
            newCol = col + offset

            // Wrap around within the clue
            if (newCol < activeClue.startCol) {
              newCol = activeClue.startCol + activeClue.length - 1
            } else if (newCol >= activeClue.startCol + activeClue.length) {
              newCol = activeClue.startCol
            }
          } else if (activeClue.direction === "down") {
            newRow = row + offset

            // Wrap around within the clue
            if (newRow < activeClue.startRow) {
              newRow = activeClue.startRow + activeClue.length - 1
            } else if (newRow >= activeClue.startRow + activeClue.length) {
              newRow = activeClue.startRow
            }
          }
        }
      }

      // Ensure the new cell is within bounds and not blank
      if (newRow < 0 || newRow >= state.grid.length || newCol < 0 || newCol >= state.grid[0].length) {
        return state
      }

      const newCell = state.grid[newRow][newCol]
      if (newCell.isBlank) {
        return state
      }

      return crosswordReducer(state, { type: "SET_ACTIVE_CELL", payload: { row: newRow, col: newCol } })
    }

    case "VALIDATE_PUZZLE": {
      const newGrid = state.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
        })),
      )

      const newState = {
        ...state,
        grid: newGrid,
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "TOGGLE_CLUE_DIRECTION": {
      const { row, col } = action.payload
      const cell = state.grid[row][col]

      if (cell.clueIds.length <= 1) return state

      // Find the current active clue
      const activeClue = [...state.clues.across, ...state.clues.down].find((clue) => clue.id === state.activeClueId)

      if (!activeClue) return state

      // Find a clue in the other direction
      const currentDirection = activeClue.direction
      const newDirection = currentDirection === "across" ? "down" : "across"

      // Find a clue in the new direction that includes this cell
      const newClue = [...state.clues[newDirection]].find((clue) => {
        // Check if this cell is part of the clue
        if (newDirection === "across") {
          return clue.startRow === row && col >= clue.startCol && col < clue.startCol + clue.length
        } else {
          return clue.startCol === col && row >= clue.startRow && row < clue.startRow + clue.length
        }
      })

      if (!newClue) return state

      // Update highlighted cells based on the new active clue
      const newGrid = state.grid.map((r) =>
        r.map((c) => ({
          ...c,
          isActive: false,
          isHighlighted: false,
        })),
      )

      // Set the active cell
      newGrid[row][col].isActive = true

      // Highlight cells for the new active clue
      for (let i = 0; i < newClue.length; i++) {
        const highlightRow = newClue.direction === "across" ? newClue.startRow : newClue.startRow + i
        const highlightCol = newClue.direction === "across" ? newClue.startCol + i : newClue.startCol

        if (
          highlightRow >= 0 &&
          highlightRow < newGrid.length &&
          highlightCol >= 0 &&
          highlightCol < newGrid[0].length
        ) {
          newGrid[highlightRow][highlightCol].isHighlighted = true
        }
      }

      const newState = {
        ...state,
        grid: newGrid,
        activeClueId: newClue.id,
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    }

    case "SET_VIEW_ONLY": {
      // Clear highlights and active state when toggling view-only
      const clearedGrid = state.grid.map(row =>
        row.map(cell => ({ ...cell, isActive: false, isHighlighted: false }))
      )
      return {
        ...state,
        grid: clearedGrid,
        activeClueId: null,
        activeCell: null,
        viewOnly: action.payload,
      }
    }

    default:
      return state
  }
}

function validateCell(state: CrosswordState) {
  return (row: number, col: number) => {
    const cell = state.grid[row][col]
    return cell.value === cell.solution
  }
}

function isClueComplete(state: CrosswordState) {
  return (clueId: string) => {
    const clue = [...state.clues.across, ...state.clues.down].find((c) => c.id === clueId)
    if (!clue) return false

    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === "across" ? clue.startRow : clue.startRow + i
      const col = clue.direction === "across" ? clue.startCol + i : clue.startCol

      if (row < 0 || row >= state.grid.length || col < 0 || col >= state.grid[0].length) return false

      if (state.grid[row][col].value === "") {
        return false
      }
    }

    return true
  }
}

function isClueCorrect(state: CrosswordState) {
  return (clueId: string) => {
    const clue = [...state.clues.across, ...state.clues.down].find((c) => c.id === clueId)
    if (!clue) return false

    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === "across" ? clue.startRow : clue.startRow + i
      const col = clue.direction === "across" ? clue.startCol + i : clue.startCol

      if (row < 0 || row >= state.grid.length || col < 0 || col >= state.grid[0].length) return false

      if (state.grid[row][col].value !== state.grid[row][col].solution) {
        return false
      }
    }

    return true
  }
}

export function CrosswordProvider({ children }: { children: React.ReactNode }) {
  const savedState = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null
  const initialState: CrosswordState = savedState
    ? JSON.parse(savedState)
    : {
        ...generateCrossword(),
        viewOnly: false,
        completionTime: null,
      }
  const [state, dispatch] = useReducer(crosswordReducer, initialState)

  useEffect(() => {
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        // Ensure viewOnly property exists
        if (parsedState.viewOnly === undefined) {
          parsedState.viewOnly = false
        }
        // Ensure completionTime property exists
        if (parsedState.completionTime === undefined) {
          parsedState.completionTime = null
        }
        dispatch({ type: "LOAD_SAVED_PUZZLE", payload: parsedState })
      } catch (e) {
        console.error("Failed to load saved state from localStorage", e)
        // If loading fails, generate a new puzzle
        dispatch({ type: "NEW_PUZZLE" })
      }
    } else {
      dispatch({ type: "NEW_PUZZLE" })
    }
  }, [])

  const contextValue: CrosswordContextType = {
    state,
    dispatch,
    validateCell: validateCell(state),
    isClueComplete: isClueComplete(state),
    isClueCorrect: isClueCorrect(state),
  }

  return <CrosswordContext.Provider value={contextValue}>{children}</CrosswordContext.Provider>
}

export function useCrossword(): CrosswordContextType {
  const context = useContext(CrosswordContext)
  if (!context) {
    throw new Error("useCrossword must be used within a CrosswordProvider")
  }
  return context
}
