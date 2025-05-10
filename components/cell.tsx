"use client"
import { useCrossword } from "@/context/crossword-context"
import type { CellData } from "@/context/crossword-context"

interface CellProps {
  cell: CellData
  row: number
  col: number
}

export function Cell({ cell, row, col }: CellProps) {
  const { dispatch, validateCell, state } = useCrossword()

  if (cell.isBlank) {
    return <div className="bg-gray-200 border border-gray-300" data-blank="true" />
  }

  // Find the clue number for this cell
  const clueNumber = cell.clueNumber

  // Determine cell styling based on state
  const isValid = cell.value !== "" && validateCell(row, col)
  const isInvalid = cell.value !== "" && !validateCell(row, col)

  const handleClick = () => {
    // Don't allow interaction in view-only mode
    if (state.viewOnly) return

    if (cell.isActive && cell.clueIds.length > 1) {
      // If the cell is already active and has multiple clues, toggle between them
      dispatch({ type: "TOGGLE_CLUE_DIRECTION", payload: { row, col } })
    } else {
      dispatch({ type: "SET_ACTIVE_CELL", payload: { row, col } })
    }
  }

  return (
    <div
      className={`
        relative flex items-center justify-center 
        border border-border bg-background
        transition-colors duration-150
        ${cell.isActive ? "bg-blue-300 ring-2 ring-blue-500 z-10" : ""}
        ${cell.isHighlighted && !cell.isActive ? "bg-blue-100" : ""}
        ${isValid ? "ring-1 ring-green-500" : ""}
        ${isInvalid ? "ring-1 ring-red-500" : ""}
        ${cell.value ? "text-foreground" : "text-transparent"}
        ${state.viewOnly ? "cursor-default" : "cursor-pointer"}
      `}
      onClick={handleClick}
      role="cell"
      aria-selected={cell.isActive}
      aria-label={`Baris ${row + 1}, Kolom ${col + 1}${clueNumber ? `, Nomor petunjuk ${clueNumber}` : ""}`}
      tabIndex={state.viewOnly ? -1 : 0}
    >
      {/* Clue number */}
      {clueNumber && <span className="absolute text-xs font-medium text-muted-foreground top-0.5 left-0.5">{clueNumber}</span>}

      {/* Cell value */}
      <span className="text-xl font-bold">{cell.value}</span>

      {/* Hidden input for mobile keyboard - only show when not in view-only mode */}
      {cell.isActive && !state.viewOnly && (
        <input
          type="text"
          className="absolute inset-0 w-full h-full opacity-0"
          maxLength={1}
          autoFocus
          value={cell.value}
          onChange={(e) => {
            const value = e.target.value.slice(-1)
            if (/^[a-zA-Z]$/.test(value)) {
              dispatch({
                type: "SET_CELL_VALUE",
                payload: { row, col, value },
              })

              // Move to the next cell after setting the value
              setTimeout(() => {
                dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "next" } })
              }, 0)
            }
          }}
        />
      )}
    </div>
  )
}
