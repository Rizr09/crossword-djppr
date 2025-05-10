"use client"
import { useState, useEffect } from "react"
import { CrosswordProvider } from "@/context/crossword-context"
import { CrosswordGrid } from "@/components/crossword-grid"
import { CluesPanel } from "@/components/clues-panel"
import { Controls } from "@/components/controls"
import { RulesModal } from "@/components/rules-modal"
import { CompletionModal } from "@/components/completion-modal"
import { useCrossword } from "@/context/crossword-context"

function CrosswordApp() {
  const { state, dispatch } = useCrossword()
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Check if this is the first time the user is playing
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem("crossword-has-played")
    if (!hasPlayedBefore) {
      setShowRulesModal(true)
      localStorage.setItem("crossword-has-played", "true")
    }
  }, [])

  // Update elapsed time every second
  useEffect(() => {
    // If the puzzle is complete, use the stored completion time
    if (state.isComplete && state.completionTime !== null) {
      setElapsedTime(state.completionTime)
      return
    }

    // Otherwise, update the timer
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - state.startTime) / 1000)
      setElapsedTime(seconds)
    }, 1000)

    return () => clearInterval(interval)
  }, [state.startTime, state.isComplete, state.completionTime])

  // Check if the puzzle is complete
  useEffect(() => {
    if (state.isComplete && !showCompletionModal && !state.viewOnly) {
      setShowCompletionModal(true)
    }
  }, [state.isComplete, showCompletionModal, state.viewOnly])

  const handleNewPuzzle = () => {
    if (window.confirm("Apakah Anda yakin ingin memulai teka-teki baru? Progres Anda saat ini akan hilang.")) {
      setShowCompletionModal(false)
      dispatch({ type: "NEW_PUZZLE" })
      dispatch({ type: "SET_VIEW_ONLY", payload: false })
    }
  }

  const handleViewOnly = () => {
    dispatch({ type: "SET_VIEW_ONLY", payload: true })
    setShowCompletionModal(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 bg-card shadow-sm">
        <div className="container flex items-center justify-between mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Teka-teki Silang DJPPR</h1>
          <div className="flex items-center gap-4">
            <Controls />
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 gap-4 p-4 md:flex-row">
        <div className="flex-1 md:order-1">
          <div className="flex items-center justify-center p-4">
            <CrosswordGrid />
          </div>
        </div>

        <div className="flex-1 md:order-2">
          <CluesPanel />
        </div>
      </main>

      <footer className="p-4 text-center text-muted-foreground bg-card shadow-sm">
        <p>© {new Date().getFullYear()} /rizr09</p>
      </footer>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onNewPuzzle={handleNewPuzzle}
        onViewOnly={handleViewOnly}
        stats={{
          timeElapsed: elapsedTime,
          hintsUsed: state.hintsUsed,
        }}
      />
    </div>
  )
}

export default function CrosswordPage() {
  return (
    <CrosswordProvider>
      <CrosswordApp />
    </CrosswordProvider>
  )
}
