/**
 * Talonic API credential for the n8n community node.
 *
 * Holds the Talonic API key and injects `Authorization: Bearer <key>`
 * into every request. The `test` block lets n8n's "Test" button verify
 * the key against a cheap endpoint (`GET /v1/credits`).
 */
import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow"

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
      required: true,
      description:
        "Your Talonic API key (starts with tlnc_). Get one at https://app.talonic.com.",
    },
  ]

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "={{ 'Bearer ' + $credentials.apiKey }}",
      },
    },
  }

  test: ICredentialTestRequest = {
    request: {
      baseURL: "https://api.talonic.com",
      url: "/v1/credits",
    },
  }
}
