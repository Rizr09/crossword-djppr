"use client"
import { useCrossword } from "@/context/crossword-context"
import type { ClueData } from "@/context/crossword-context"
import { Check, X } from "lucide-react"

export function CluesPanel() {
  const { state, dispatch, isClueComplete, isClueCorrect } = useCrossword()

  const handleClueClick = (clueId: string) => {
    if (!state.viewOnly) {
      dispatch({ type: "SET_ACTIVE_CLUE", payload: clueId })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-auto bg-background rounded-lg shadow-md md:flex-row">
      {/* Across Clues */}
      <div className="flex-1">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Mendatar</h2>
        <ul className="space-y-2">
          {state.clues.across.map((clue) => (
            <ClueItem
              key={clue.id}
              clue={clue}
              isActive={clue.id === state.activeClueId}
              isComplete={isClueComplete(clue.id)}
              isCorrect={isClueCorrect(clue.id)}
              onClick={() => handleClueClick(clue.id)}
              viewOnly={state.viewOnly}
            />
          ))}
        </ul>
      </div>

      {/* Down Clues */}
      <div className="flex-1">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Menurun</h2>
        <ul className="space-y-2">
          {state.clues.down.map((clue) => (
            <ClueItem
              key={clue.id}
              clue={clue}
              isActive={clue.id === state.activeClueId}
              isComplete={isClueComplete(clue.id)}
              isCorrect={isClueCorrect(clue.id)}
              onClick={() => handleClueClick(clue.id)}
              viewOnly={state.viewOnly}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

interface ClueItemProps {
  clue: ClueData
  isActive: boolean
  isComplete: boolean
  isCorrect: boolean
  onClick: () => void
  viewOnly: boolean
}

function ClueItem({ clue, isActive, isComplete, isCorrect, onClick, viewOnly }: ClueItemProps) {
  const { state } = useCrossword()
  const number = state.grid[clue.startRow][clue.startCol].clueNumber

  return (
    <li
      className={`
        p-2 rounded-md transition-colors
        ${isActive ? "bg-blue-200 font-semibold" : "hover:bg-muted"}
        ${isComplete && isCorrect ? "text-green-700" : ""}
        ${isComplete && !isCorrect ? "text-red-700" : ""}
        ${viewOnly ? "cursor-default" : "cursor-pointer"}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className={`${isActive ? "font-semibold" : "font-medium"} text-foreground`}>
          {number}. {clue.text}
        </span>
        {isComplete && (
          <span className="ml-2">
            {isCorrect ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{clue.length} huruf</div>
    </li>
  )
}
