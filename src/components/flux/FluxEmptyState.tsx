function FluxEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <section className="space-y-4 border rounded-md p-6 bg-gray-50">
      <h2 className="text-lg font-medium">
        Get started with Flux
      </h2>

      <p className="text-sm text-gray-600">
        Generate API keys to start sending emails using Flux.
      </p>

      <button
        onClick={onGenerate}
        className="px-4 py-2 bg-black text-white rounded-md"
      >
        Generate API Keys
      </button>
    </section>
  )
}

export { FluxEmptyState }