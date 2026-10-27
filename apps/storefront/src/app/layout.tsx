import { getBaseURL } from "@lib/util/env"
import MotionProvider from "@/components/motion-provider"
import { cn } from "@/lib/utils"
import { Metadata } from "next"
import { Archivo, Outfit } from "next/font/google"
import "styles/globals.css"

// Tipografías de la marca: Archivo (con el eje de anchura, para los titulares
// en mayúsculas) y Outfit para el texto.
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
})

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: extensiones como LanguageTool añaden atributos a <html>
    <html
      lang="es"
      data-mode="light"
      className={cn(display.variable, body.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body className="font-sans antialiased">
        <MotionProvider>
          <main className="relative">{props.children}</main>
        </MotionProvider>
      </body>
    </html>
  )
}
