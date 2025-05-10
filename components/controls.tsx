"use client"
import { useCrossword } from "@/context/crossword-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, Lightbulb } from "lucide-react"

export function Controls() {
  const { dispatch, state } = useCrossword()

  const handleNewPuzzle = () => {
    if (window.confirm("Apakah Anda yakin ingin memulai teka-teki baru? Progres Anda saat ini akan hilang.")) {
      dispatch({ type: "NEW_PUZZLE" })
    }
  }

  const handleHint = () => {
    if (state.activeCell && state.activeClueId) {
      dispatch({
        type: "USE_HINT",
        payload: {
          clueId: state.activeClueId,
        },
      })
    } else {
      alert("Silakan pilih kotak terlebih dahulu untuk mendapatkan petunjuk.")
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleHint}
        className="flex items-center gap-1 bg-secondary hover:bg-secondary/80"
        disabled={state.viewOnly}
      >
        <Lightbulb className="w-4 h-4" />
        <span>Petunjuk</span>
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={handleNewPuzzle}
        className="flex items-center gap-1 bg-destructive hover:bg-destructive/90"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Teka-teki Baru</span>
      </Button>
    </div>
  )
}
