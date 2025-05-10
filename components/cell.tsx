"use client"
import { useCrossword } from "@/context/crossword-context"
import type { CellData } from "@/context/crossword-context"
import { useRef, useEffect } from "react"

interface CellProps {
  cell: CellData
  row: number
  col: number
}

export function Cell({ cell, row, col }: CellProps) {
  const { dispatch, validateCell, state } = useCrossword()
  // Ref for the hidden input to trigger mobile keyboard
  const inputRef = useRef<HTMLInputElement>(null)

  if (cell.isBlank) {
    return <div className="bg-gray-200 border border-gray-300" data-blank="true" />
  }

  // Focus the hidden input when the cell becomes active
  useEffect(() => {
    if (cell.isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [cell.isActive])

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
    // Immediately focus input to open mobile keyboard
    if (inputRef.current) inputRef.current.focus()
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
      {/* Hidden input to trigger mobile keyboard */}
      {cell.isActive && !state.viewOnly && (
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          pattern="[A-Za-z]"
          maxLength={1}
          autoComplete="off"
          className="absolute inset-0 w-full h-full bg-background text-transparent caret-current outline-none border-none z-20 pointer-events-auto"
          value={cell.value}
          onChange={(e) => {
            const v = e.target.value.slice(-1)
            if (/^[a-zA-Z]$/.test(v)) {
              dispatch({ type: "SET_CELL_VALUE", payload: { row, col, value: v } })
              setTimeout(() => dispatch({ type: "MOVE_ACTIVE_CELL", payload: { direction: "next" } }), 0)
            }
          }}
        />
      )}

      {/* Clue number */}
      {clueNumber && <span className="absolute text-xs font-medium text-gray-500 top-0.5 left-0.5">{clueNumber}</span>}

      {/* Cell value */}
      <span className="text-xl font-bold">{cell.value}</span>
    </div>
  )
}
