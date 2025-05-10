"use client"

import React, { useEffect, useRef } from "react"
import { useCrossword } from "@/context/crossword-context"
import { Cell } from "@/components/cell"

export function CrosswordGrid() {
  const { state, dispatch } = useCrossword()
  const gridRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.activeCell) return

      const { key } = e
      const { row, col } = state.activeCell

      // Handle arrow keys
      if (key === "ArrowUp") {
        e.preventDefault()
        dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "up" } })
      } else if (key === "ArrowDown") {
        e.preventDefault()
        dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "down" } })
      } else if (key === "ArrowLeft") {
        e.preventDefault()
        dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "left" } })
      } else if (key === "ArrowRight") {
        e.preventDefault()
        dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "right" } })
      }
      // Handle letter input
      else if (/^[a-zA-Z]$/.test(key)) {
        dispatch({
          type: "SET_CELL_VALUE",
          payload: { row, col, value: key.toUpperCase() },
        })

        // Move to the next cell after setting the value
        setTimeout(() => {
          // Find the active clue to determine which direction to move
          const activeClue = [...state.clues.across, ...state.clues.down].find((clue) => clue.id === state.activeClueId)

          if (activeClue) {
            dispatch({
              type: "MOVE_ACTIVE_CELL",
              payload: { direction: "next" },
            })
          }
        }, 0)
      }
      // Handle backspace
      else if (key === "Backspace") {
        // Clear the current cell
        dispatch({
          type: "SET_CELL_VALUE",
          payload: { row, col, value: "" },
        })

        // Move to the previous cell
        dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "prev" } })
      }
      // Handle tab to move between clues
      else if (key === "Tab") {
        e.preventDefault()

        // Get all clues
        const allClues = [...state.clues.across, ...state.clues.down]

        // Find the index of the current clue
        const currentIndex = allClues.findIndex((clue) => clue.id === state.activeClueId)

        if (currentIndex !== -1) {
          // Calculate the next clue index (with wrap-around)
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + allClues.length) % allClues.length
            : (currentIndex + 1) % allClues.length

          // Set the active clue
          dispatch({
            type: "SET_ACTIVE_CLUE",
            payload: allClues[nextIndex].id,
          })
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.activeCell, state.activeClueId, state.clues, dispatch])

  // Calculate cell size based on grid dimensions
  const cellSize = 40 // Base cell size
  const gridWidth = state.grid[0]?.length * cellSize || 0
  const gridHeight = state.grid.length * cellSize || 0

  return (
    <div
      ref={gridRef}
      className="relative mx-auto overflow-auto bg-card rounded-lg shadow-md"
      style={{
        width: "100%",
        maxWidth: `${gridWidth}px`,
        height: "100%",
        maxHeight: `${gridHeight}px`,
      }}
      role="grid"
      aria-label="Crossword puzzle grid"
    >
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${state.grid[0]?.length || 0}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${state.grid.length || 0}, ${cellSize}px)`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        {state.grid.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((cell, colIndex) => (
              <Cell key={`cell-${rowIndex}-${colIndex}`} cell={cell} row={rowIndex} col={colIndex} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
