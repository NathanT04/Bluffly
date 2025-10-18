import { useState } from 'react'
import NavBar from '../components/NavBar'
import HomeTab from '../components/tabs/HomeTab'
import SimulationTab from '../components/tabs/SimulationTab'
import AnalyzerTab from '../components/tabs/AnalyzerTab'
import LessonsTab from '../components/tabs/LessonsTab'

export default function Homepage() {
  const [active, setActive] = useState('Home')

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Right-half poker table image */}
      <div aria-hidden className="absolute inset-y-0 right-0 w-1/2">
        <img
          src="https://images.unsplash.com/photo-1598970434795-0c54fe7c0643?q=80&w=1600&auto=format&fit=crop"
          alt="Poker table with dark felt, cards, and chips"
          className="h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-gray-800/80 via-gray-900/40 to-transparent" />
      </div>

      {/* Ambient glow */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-gray-600/25 blur-3xl" />
      </div>

      {/* Top chrome */}
      <div className="sticky top-0 z-20 border-b border-gray-600/80 bg-gray-900/70 backdrop-blur">
        <NavBar active={active} onChange={setActive} />
        <div className="h-1 bg-gradient-to-r from-gray-700 via-red-600 to-gray-800" />
      </div>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20">
        <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-gray-300 to-gray-100 bg-clip-text text-transparent drop-shadow">
          Bluffly
        </h1>
        <p className="mt-8 max-w-3xl text-2xl leading-relaxed text-gray-300/90">
          Practice your poker skills, learn optimal strategies, <br />
          and build your confidence at the table.
        </p>

        <div className="mt-10">
          <button className="rounded-xl border-2 border-red-600 bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow hover:bg-red-500 focus-visible:outline-red-400 transition-all duration-200">
            Register
          </button>
        </div>

        {/* Demo area to show tab content */}
        <section className="mt-16 rounded-2xl border border-gray-700 bg-gray-800/50 p-6 backdrop-blur">
          {active === 'Home' && <HomeTab />}
          {active === 'Simulation' && <SimulationTab />}
          {active === 'Analyzer' && <AnalyzerTab />}
          {active === 'Lessons' && <LessonsTab />}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10">
        <div className="text-xs text-gray-500">© {new Date().getFullYear()} Bluffly</div>
      </footer>
    </div>
  )
}