function EmailMethodSection({
  useCustomSMTP,
  setUseCustomSMTP,
}: {
  useCustomSMTP: boolean
  setUseCustomSMTP: (v: boolean) => void
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Email Sending</h2>

      <div className="p-4 border rounded-md bg-gray-50">
        <p className="font-medium">Flux Mail (Default)</p>
        <p className="text-sm text-gray-600 mt-1">
          • 25 emails / month
          <br />
          • No setup required
        </p>
      </div>

      {/* <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={useCustomSMTP}
          onChange={() => setUseCustomSMTP(!useCustomSMTP)}
        />
        Use my email provider (1000 emails / month free)
      </label> */}
    </section>
  )
}

export default EmailMethodSection;