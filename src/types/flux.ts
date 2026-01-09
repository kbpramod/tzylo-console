export type apiKeyData = {
    projectId: string
    subscriptionId: string
}

export type Project = {
  id: string
  name: string
}

export type ApiKey = {
  id: string
  productCode: string
  environment: "live" | "test"
  keyType: "public" | "secret"
  keyHash: string
  isActive: boolean
}