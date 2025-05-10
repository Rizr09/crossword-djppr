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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cell.isActive && inputRef.current) inputRef.current.focus()
  }, [cell.isActive])

  // Determine if blank cell for styling
  const baseClasses = cell.isBlank
    ? "relative flex items-center justify-center border border-gray-300 bg-gray-200"
    : `relative flex items-center justify-center border border-border bg-background transition-colors duration-150
       ${cell.isActive ? "bg-blue-300 ring-2 ring-blue-500 z-10" : ""}
       ${cell.isHighlighted && !cell.isActive ? "bg-blue-100" : ""}
       ${validateCell(row, col) && cell.value !== "" ? "ring-1 ring-green-500" : ""}
       ${!validateCell(row, col) && cell.value !== "" ? "ring-1 ring-red-500" : ""}
       ${cell.value ? "text-foreground" : "text-transparent"}
       ${state.viewOnly ? "cursor-default" : "cursor-pointer"}`

  const handleDivClick = () => {
    if (cell.isBlank || state.viewOnly) return
    if (cell.isActive && cell.clueIds.length > 1) {
      dispatch({ type: "TOGGLE_CLUE_DIRECTION", payload: { row, col } })
    } else {
      dispatch({ type: "SET_ACTIVE_CELL", payload: { row, col } })
    }
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div
      className={baseClasses}
      onClick={handleDivClick}
      role="cell"
      aria-selected={cell.isActive}
      aria-label={`Baris ${row + 1}, Kolom ${col + 1}${cell.clueNumber ? `, Nomor petunjuk ${cell.clueNumber}` : ""}`}
      tabIndex={state.viewOnly || cell.isBlank ? -1 : 0}
    >
      {/* Render hidden input and content only for fillable cells */}
      {!cell.isBlank && cell.isActive && !state.viewOnly && (
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          pattern="[A-Za-z]"
          maxLength={1}
          autoComplete="off"
          className="absolute inset-0 w-full h-full bg-background text-transparent caret-current outline-none border-none z-20"
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
      {/* Clue number for fillable cells */}
      {!cell.isBlank && cell.clueNumber && (
        <span className="absolute text-xs font-medium text-gray-500 top-0.5 left-0.5">
          {cell.clueNumber}
        </span>
      )}
      {/* Display cell value */}
      {!cell.isBlank && <span className="text-xl font-bold">{cell.value}</span>}
    </div>
  )
}
