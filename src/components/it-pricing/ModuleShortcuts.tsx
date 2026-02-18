"use client"

import { Tag, CreditCard, Building2 } from "lucide-react"

interface ModuleShortcutsProps {
  currentModule: 'sales' | 'rental' | 'services'
  onModuleChange: (module: 'sales' | 'rental' | 'services') => void
}

export function ModuleShortcuts({ currentModule, onModuleChange }: ModuleShortcutsProps) {
  const modules = [
    {
      id: 'sales' as const,
      name: 'Venda',
      icon: Tag,
    },
    {
      id: 'rental' as const,
      name: 'Locação',
      icon: CreditCard,
    },
    {
      id: 'services' as const,
      name: 'Serviços',
      icon: Building2,
    }
  ]

  const baseButtonClass =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all h-9 px-3"

  return (
    <div className="mb-8 max-w-lg mx-auto">
      <div className="flex space-x-2 glass-card p-1.5 rounded-lg shadow-inner tech-glow">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = currentModule === module.id
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              type="button"
              className={`${baseButtonClass} flex-1 ${isActive ? "btn-3d active" : "btn-3d-secondary"}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {module.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
