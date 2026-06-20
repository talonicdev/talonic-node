/**
 * Talonic API credential for the n8n community node — SCAFFOLD.
 *
 * @ts-nocheck — `n8n-workflow` is a peer not installed in this scaffold.
 */
// @ts-nocheck
import type { ICredentialType, INodeProperties } from "n8n-workflow"

export class TalonicApi implements ICredentialType {
  name = "talonicApi"
  displayName = "Talonic API"
  documentationUrl = "https://talonic.com/docs"
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      description: "Your Talonic API key (starts with tlnc_). Get one at https://app.talonic.com.",
    },
  ]

  // Injects `Authorization: Bearer tlnc_...` into every request.
  authenticate = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "={{ 'Bearer ' + $credentials.apiKey }}",
      },
    },
  }

  // Lets n8n's "Test" button verify the key against a cheap endpoint.
  test = {
    request: {
      baseURL: "https://api.talonic.com",
      url: "/v1/credits",
    },
  }
}
