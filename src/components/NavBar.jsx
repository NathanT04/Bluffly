/**
 * NavBar
 * Centered pill-style navigation bar.
 * Props:
 *  - active: string ('Home' | 'Simulation' | 'Analyzer' | 'Lessons')
 *  - onChange: function(label) -> void
 */
export default function NavBar({ active, onChange }) {
  const items = ['Home','Simulation','Analyzer','Lessons']
  return (
    <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-center">
      <nav className="flex items-center gap-4 md:gap-6 rounded-2xl border border-gray-600/70 bg-gray-800/60 px-3 py-2 shadow-lg">
        {items.map((label) => {
          const isActive = active === label
          return (
            <button
              key={label}
              onClick={() => onChange(label)}
              className={
                `relative rounded-xl px-6 py-2 text-base md:text-lg font-medium transition-all duration-200 ` +
                (isActive
                  ? 'bg-gray-700/80 text-red-300 border border-red-500 shadow tab-active-underline'
                  : 'text-gray-200 border border-transparent hover:border-red-500/60 hover:text-red-400 hover:bg-gray-700/40')
              }
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}