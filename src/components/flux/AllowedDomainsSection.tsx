import { useEffect, useState } from "react"
import { Plus, X, Check } from "lucide-react"
import api from "@/lib/api"

type AllowedDomain = {
  id: string
  projectId: string
  domain: string
  createdAt: string
}

type Props = {
  projectId: string
}

export default function AllowedDomainsSection({ projectId }: Props) {
  const [domains, setDomains] = useState<AllowedDomain[]>([])
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadDomains()
  }, [])

  /* -----------------------
     Load domains
  ------------------------ */
  const loadDomains = async () => {
    const res = await api.fluxDomains.list(projectId)
    setDomains(res.data.data || [])
  }

  const addDomain = async () => {
    const value = input.trim()
    if (!value) return
    if (domains.some(d => d.domain === value)) return

    try {
      setSaving(true)

      const res = await api.fluxDomains.add(projectId, value)
      const created: AllowedDomain = res.data.data

      setDomains(prev => [...prev, created])
      setInput("")
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  const removeDomain = async (domain: AllowedDomain) => {
    try {
      setSaving(true)

      await api.fluxDomains.remove(projectId, domain.id)

      setDomains(prev => prev.filter(d => d.id !== domain.id))
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Allowed Website URLs</h2>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />

        <button
          onClick={addDomain}
          disabled={saving}
          className="px-3 py-2 border rounded-md"
        >
          <Plus size={16} />
        </button>

        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check size={14} />
            Saved
          </span>
        )}
      </div>

      {/* Domains list */}
      {domains.length > 0 && (
        <div className="space-y-2">
          {domains.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between border px-3 py-2 rounded-md text-sm"
            >
              <span>{d.domain}</span>

              <button
                onClick={() => removeDomain(d)}
                disabled={saving}
                className="text-gray-500 hover:text-black"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Public API requests are allowed only from these domains.
      </p>
    </section>
  )
}
