import { useState } from 'react'
import { StartScreen } from './stromlinien/StartScreen'
import { StromlinienGame } from './stromlinien/StromlinienGame'
import type { RegionCell } from './stromlinien/types'

/*
 * Der aktuelle Kern ist der Stromlinien-Loop (Port der Prototypen
 * stromlinien-epoche1 + start-screen-v2): Auf der gestalteten Weltkarte
 * (Alpenrhein, Landquart bis Konstanz) formt man ein Gebiet und spielt
 * darin Epoche I. Der frühere Recherche-Loop ("Shadows of Truth") liegt
 * weiter unter src/game + src/components.
 */
function App() {
  const [region, setRegion] = useState<RegionCell[] | null>(null)
  return region ? (
    <StromlinienGame region={region} onExit={() => setRegion(null)} />
  ) : (
    <StartScreen onStart={setRegion} />
  )
}

export default App
