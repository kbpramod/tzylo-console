import SmtpConfig from "./SmtpConfig";
import AllowedDomainsSection from "./AllowedDomainsSection";
import EmailMethodSection from "./EmailMethodSection";
import { ApiKeySection } from "./ApiKeySection";
import { ApiKey } from "@/types/flux";

function SecurityNote() {
  return (
    <section className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
      SMTP credentials are encrypted at rest and never logged.
      They are used only to send emails on your behalf and are accessible
      only to you.
    </section>
  )
}

function ActionsSection() {
  return (
    <div className="flex gap-3">
      <button className="px-4 py-2 border rounded-md">
        Send Test Email
      </button>
    </div>
  )
}


export function FluxConfiguredState({
  projectId,
  apiKeys,
  useCustomSMTP,
  setUseCustomSMTP,
}: {
  projectId: string
  apiKeys: ApiKey[]
  useCustomSMTP: boolean
  setUseCustomSMTP: (v: boolean) => void
}) {

  return (
    <>
      <ApiKeySection apiKeys={apiKeys} onRegenerate={() => {}}/>
      <AllowedDomainsSection projectId={projectId} />
      <EmailMethodSection
        useCustomSMTP={useCustomSMTP}
        setUseCustomSMTP={setUseCustomSMTP}
      />
      {useCustomSMTP && <SmtpConfig projectId={projectId}/>}
      <SecurityNote />
      <ActionsSection />
    </>
  )
}
