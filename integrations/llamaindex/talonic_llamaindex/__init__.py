"""Talonic tool for LlamaIndex (Python).

SCAFFOLD — not yet fully implemented or published. See integrations/PLAN.md.

This wraps Talonic's ``POST /v1/extract`` as a LlamaIndex ``FunctionTool`` so
an agent can turn any document into schema-validated JSON.

Unlike the TypeScript adapters (which wrap the ``@talonic/node`` SDK), the
Python adapter should wrap the forthcoming Talonic Python SDK once it exists;
until then it can call the REST endpoint directly with ``httpx``/``requests``.
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

# from llama_index.core.tools import FunctionTool  # noqa: ERA001  (uncomment when implementing)


TALONIC_API_BASE = os.environ.get("TALONIC_API_BASE", "https://api.talonic.com")

EXTRACT_TOOL_NAME = "talonic_extract_document"

EXTRACT_TOOL_DESCRIPTION = (
    "Extract structured, schema-validated JSON from a document (PDF, image, "
    "spreadsheet, Word, email, and more) using Talonic. Use this whenever you "
    "need to turn an unstructured document into reliable structured data with "
    "per-field confidence scores. Provide exactly one document source "
    "(file_url, document_id, or base64 file). Provide a target schema to pin "
    "the output shape, or omit it to let Talonic auto-discover the fields."
)


def extract_document(
    file_url: Optional[str] = None,
    document_id: Optional[str] = None,
    file_base64: Optional[str] = None,
    filename: Optional[str] = None,
    schema: Optional[dict[str, Any]] = None,
    schema_id: Optional[str] = None,
    instructions: Optional[str] = None,
    *,
    api_key: Optional[str] = None,
) -> str:
    """Call Talonic ``POST /v1/extract`` and return trimmed JSON.

    SCAFFOLD: this function documents the exact mapping the implementation
    must follow. The body raises until implemented so the contract is
    explicit and testable.

    Mapping to ``/v1/extract`` multipart form fields:
      - ``file_url``    -> form field ``file_url``
      - ``document_id`` -> form field ``document_id``
      - ``file_base64`` -> decode, attach as the ``file`` part (needs ``filename``)
      - ``schema``      -> JSON-encode into the ``schema`` form field
      - ``schema_id``   -> form field ``schema_id``
      - ``instructions``-> form field ``instructions``

    Validation (mirror the TS adapters):
      - exactly one of file_url / document_id / file_base64
      - file_base64 requires filename
      - schema and schema_id are mutually exclusive

    Returns a JSON string with:
      ``{ extraction_id, data, confidence, schema, document }``.
    """
    _ = (
        file_url,
        document_id,
        file_base64,
        filename,
        schema,
        schema_id,
        instructions,
        api_key,
    )
    raise NotImplementedError(
        "talonic_llamaindex is a scaffold. Implement against the Talonic "
        "Python SDK (preferred) or the /v1/extract REST endpoint. "
        "See integrations/PLAN.md."
    )


def talonic_extract_tool(api_key: Optional[str] = None):  # -> FunctionTool
    """Build a LlamaIndex ``FunctionTool`` wrapping :func:`extract_document`.

    SCAFFOLD. Reference implementation once llama-index-core is a dependency::

        from functools import partial
        from llama_index.core.tools import FunctionTool

        return FunctionTool.from_defaults(
            fn=partial(extract_document, api_key=api_key),
            name=EXTRACT_TOOL_NAME,
            description=EXTRACT_TOOL_DESCRIPTION,
        )
    """
    _ = api_key
    raise NotImplementedError(
        "talonic_llamaindex is a scaffold. See integrations/PLAN.md."
    )


__all__ = [
    "extract_document",
    "talonic_extract_tool",
    "EXTRACT_TOOL_NAME",
    "EXTRACT_TOOL_DESCRIPTION",
    "TALONIC_API_BASE",
]

# Keep json imported in the scaffold so implementers see it is available
# for encoding the schema field and the trimmed result.
_ = json
