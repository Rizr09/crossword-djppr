"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Clock, Lightbulb } from "lucide-react"
import Confetti from "react-confetti"

interface CompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onNewPuzzle: () => void
  onViewOnly: () => void
  stats: {
    timeElapsed: number
    hintsUsed: number
  }
}

export function CompletionModal({ isOpen, onClose, onNewPuzzle, onViewOnly, stats }: CompletionModalProps) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.15}
      />

      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-lg">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-foreground">Teka-teki Selesai!</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          <Trophy className="w-16 h-16 mb-4 text-yellow-500" />
          <h3 className="mb-6 text-2xl font-bold text-gray-800">Selamat!</h3>

          <div className="flex flex-col w-full gap-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium text-gray-700">Waktu</span>
              </div>
              <span className="text-lg font-semibold text-blue-700">{formatTime(stats.timeElapsed)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                <span className="font-medium text-gray-700">Petunjuk Digunakan</span>
              </div>
              <span className="text-lg font-semibold text-yellow-700">{stats.hintsUsed}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={onViewOnly}
            className="border-border bg-background text-foreground hover:bg-muted"
          >
            Kembali
          </Button>
          <Button onClick={onNewPuzzle} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Teka-teki Baru
          </Button>
        </div>
      </div>
    </div>
  )
}
