import { useState } from "react"
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
import { ApiKey } from "@/types/flux"

export function buildApiKey({
  productCode,
  keyType,
  environment,
  keyHash,
}: {
  productCode: string
  keyType: "public" | "secret"
  environment: "live" | "test"
  keyHash: string
}) {
  return `${productCode}_${keyType}_${environment}_${keyHash}`
}

export function getLast4FromKeyHash(keyHash: string): string {
  if (!keyHash || keyHash.length < 4) return ""
  return keyHash.slice(-4)
}

export function getMaskedApiKey({
  productCode,
  keyType,
  environment,
  keyHash,
}: {
  productCode: string
  keyType: string
  environment: string
  keyHash: string
}) {
  const last4 = getLast4FromKeyHash(keyHash)
  return `${productCode}_${keyType}_${environment}_****${last4}`
}


function ApiKeyRow({
  label,
  description,
  keyValue,
  maskedValue,
  warning,
  canReveal = false,
  onRegenerate,
}: {
  label: string
  description: string
  keyValue: string
  maskedValue: string
  warning?: string
  canReveal?: boolean
  onRegenerate: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(keyValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 5000)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      <div className="flex gap-2">
        <input
          value={visible ? keyValue : maskedValue}
          readOnly
          className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
        />

        {canReveal && (
          <button
            onClick={() => setVisible(!visible)}
            className="px-3 py-2 border rounded-md"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}

        <button
          onClick={handleCopy}
          className={`px-3 py-2 border rounded-md ${
            copied ? "bg-green-100 border-green-400" : ""
          }`}
        >
          {copied ? "Copied" : <Copy size={14} />}
        </button>

        <button
          onClick={onRegenerate}
          className="px-3 py-2 border rounded-md"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-sm text-gray-600">{description}</p>

      {warning && (
        <p className="text-sm text-red-600">{warning}</p>
      )}
    </div>
  )
}


export function ApiKeySection({
  apiKeys,
  onRegenerate,
}: {
  apiKeys: ApiKey[]
  onRegenerate: () => void
}) {
  const publicKey = apiKeys.find(k => k.keyType === "public")
  const secretKey = apiKeys.find(k => k.keyType === "secret")

  if (!publicKey || !secretKey) return null

  const publicBuilt = buildApiKey(publicKey)
  const secretBuilt = buildApiKey(secretKey)

  const publicMasked = getMaskedApiKey(publicKey)
  const secretMasked = getMaskedApiKey(secretKey)

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium">API Keys</h2>

      <ApiKeyRow
        label="Public API Key"
        description="Safe to use in browsers. Restricted by allowed domains."
        keyValue={publicBuilt}
        maskedValue={publicMasked}
        canReveal={true}
        onRegenerate={onRegenerate}
      />

      <ApiKeyRow
        label="Secret API Key"
        description="Use only in server-side environments."
        warning="Keep this key secret. Never expose it in client-side code."
        keyValue={secretBuilt}
        maskedValue={secretMasked}
        canReveal={true}
        onRegenerate={onRegenerate}
      />
    </section>
  )
}

