"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { FluxEmptyState } from "@/components/flux/FluxEmptyState"
import { FluxConfiguredState } from "@/components/flux/FluxConfiguredState"
import { Project, ApiKey } from "@/types/flux"


export default function FluxDashboardPage() {
  const [useCustomSMTP, setUseCustomSMTP] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [isLoadingKeys, setIsLoadingKeys] = useState(false)

  useEffect(() => {
    loadProject()
  }, [])

  const loadProject = async () => {
    try {
      setIsLoadingProject(true)

      const response = await api.projects.getMyProject()
      const { project, subscription } = response.data.data

      setProject(project)
      setSubscriptionId(subscription.id)
    } catch (err) {
      console.error("Failed to load project", err)
    } finally {
      setIsLoadingProject(false)
    }
  }

  useEffect(() => {
    if (!project?.id) return

    loadApiKeys(project.id)
  }, [project?.id])

  const loadApiKeys = async (projectId: string) => {
    try {
      setIsLoadingKeys(true)

      const response = await api.fluxApiKeys.list(projectId)
      setApiKeys(response.data.data)
    } catch (err) {
      console.error("Failed to load API keys", err)
    } finally {
      setIsLoadingKeys(false)
    }
  }

  const generateApiKeys = async () => {
    if (!project?.id) return
    if (!subscriptionId) return

    try {
      const response = await api.fluxApiKeys.generate({projectId: project.id, subscriptionId})

      console.log("Public key:", response.data.data.publicKey)
      console.log("Secret key:", response.data.data.secretKey)

      // reload masked list
      await loadApiKeys(project.id)
    } catch (err) {
      console.error("Failed to generate API keys", err)
    }
  }

  const hasApiKeys = apiKeys.length > 0

  if (isLoadingProject) {
    return <div>Loading Flux dashboard...</div>
  }

  if (!project) {
    return <div>No project found</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
  <h1 className="text-2xl font-semibold">Flux Dashboard</h1>

  {!hasApiKeys ? (
    <FluxEmptyState onGenerate={generateApiKeys} />
  ) : (
    <FluxConfiguredState
      projectId={project.id}
      apiKeys={apiKeys}
      useCustomSMTP={useCustomSMTP}
      setUseCustomSMTP={setUseCustomSMTP}
    />
  )}
</div>

  )
}
