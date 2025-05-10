import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Djppr Crossword',
  description: 'Created by Rizky',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800">{children}</body>
    </html>
  )
}
