"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="w-full max-w-md p-6 mx-4 bg-white border border-gray-200 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Cara Bermain</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-foreground">
          <p>Selamat datang di Teka-teki Silang! Berikut cara bermainnya:</p>

          <div className="space-y-2">
            <h3 className="font-semibold">Kontrol Dasar</h3>
            <ul className="pl-5 space-y-1 list-disc">
              <li>Klik pada kotak untuk memilihnya</li>
              <li>Ketik huruf untuk mengisi teka-teki</li>
              <li>Klik pada petunjuk untuk menyorot kotaknya</li>
              <li>Klik dua kali pada persimpangan untuk beralih antara mendatar dan menurun</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Navigasi Keyboard</h3>
            <ul className="pl-5 space-y-1 list-disc">
              <li>Tombol panah untuk berpindah antar kotak</li>
              <li>Tab untuk berpindah antar petunjuk</li>
              <li>Backspace untuk menghapus huruf</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Petunjuk</h3>
            <p>
              Jika Anda kesulitan, gunakan tombol Petunjuk untuk mengungkapkan sebuah huruf. Tapi gunakan dengan bijak -
              tujuannya adalah menyelesaikan teka-teki dengan sesedikit mungkin petunjuk!
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary/90">Mulai Bermain</Button>
        </div>
      </div>
    </div>
  )
}
