import { useEffect, useRef } from "react";
import type {
  ApiResponseEnvelope,
  JsonObject,
  JsonPrimitive,
} from "../api/types";
import { StatusBadge } from "./StatusBadge";

export interface EvidenceSnapshot {
  readonly operation: string;
  readonly response: ApiResponseEnvelope<JsonObject>;
}

interface EvidenceDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly evidence: EvidenceSnapshot | null;
  readonly onFetchReceipt: (() => Promise<void>) | null;
  readonly fetchingReceipt: boolean;
}

const EVIDENCE_ROWS = [
  {
    label: "AWS request",
    keys: ["requestId", "awsRequestId"],
  },
  {
    label: "Run",
    keys: ["runId"],
  },
  {
    label: "Session",
    keys: ["sessionId", "sourceSessionId", "recalledFromSessionId"],
  },
  {
    label: "CockroachDB memory",
    keys: ["memoryId", "recalledMemoryId", "eventId", "summaryId"],
  },
  {
    label: "Vector evidence",
    keys: ["vectorId", "vectorDistance", "embeddingModel"],
  },
  {
    label: "Midnight receipt",
    keys: ["midnightReceiptId", "midnightTransactionId", "proofReceiptId"],
  },
  {
    label: "Projection generation",
    keys: ["projectionGeneration", "activeGenerationId", "generationId"],
  },
  {
    label: "Operation receipt",
    keys: ["receiptId"],
  },
  {
    label: "Protected fields returned",
    keys: ["protectedFieldsReturned"],
  },
  {
    label: "Managed MCP verification",
    keys: ["managedMcpReceiptId", "mcpInspectionId"],
  },
] as const;

function primitiveAtAllowedKey(
  value: unknown,
  allowedKeys: readonly string[],
): JsonPrimitive | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  for (const [key, childValue] of Object.entries(value)) {
    if (
      allowedKeys.includes(key) &&
      (typeof childValue === "string" ||
        typeof childValue === "number" ||
        typeof childValue === "boolean" ||
        childValue === null)
    ) {
      return childValue;
    }
  }

  for (const childValue of Object.values(value)) {
    const nestedMatch = primitiveAtAllowedKey(childValue, allowedKeys);
    if (nestedMatch !== undefined) {
      return nestedMatch;
    }
  }
  return undefined;
}

function evidenceValue(
  evidence: EvidenceSnapshot | null,
  allowedKeys: readonly string[],
): JsonPrimitive | undefined {
  if (!evidence) {
    return undefined;
  }
  if (allowedKeys.includes("requestId") && evidence.response.requestId) {
    return evidence.response.requestId;
  }
  return primitiveAtAllowedKey(evidence.response.data, allowedKeys);
}

export function EvidenceDrawer({
  open,
  onClose,
  evidence,
  onFetchReceipt,
  fetchingReceipt,
}: EvidenceDrawerProps) {
  const dialogReference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogReference.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      className="evidence-drawer"
      ref={dialogReference}
      onClose={onClose}
      aria-labelledby="evidence-drawer-title"
    >
      <div className="evidence-drawer__header">
        <div>
          <p className="eyebrow">Read-only evidence</p>
          <h2 id="evidence-drawer-title">What the API actually returned</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="visually-hidden">Close evidence drawer</span>
        </button>
      </div>

      <p className="evidence-drawer__boundary">
        Expected fixture values are never substituted for service evidence. A field
        stays <strong>NOT AVAILABLE</strong> until a real API response supplies it.
      </p>

      <dl className="evidence-list">
        {EVIDENCE_ROWS.map((row) => {
          const value = evidenceValue(evidence, row.keys);
          return (
            <div className="evidence-list__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {value === undefined || value === null ? (
                  <StatusBadge label="NOT AVAILABLE" compact />
                ) : (
                  <code>{String(value)}</code>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="evidence-drawer__footer">
        <p>
          {evidence
            ? `${evidence.operation} · HTTP ${evidence.response.httpStatus} · ${evidence.response.receivedAt}`
            : "No operational API response has been received in this browser session."}
        </p>
        <button
          className="button button--secondary"
          type="button"
          disabled={!onFetchReceipt || fetchingReceipt}
          onClick={() => void onFetchReceipt?.()}
        >
          {fetchingReceipt ? "Retrieving receipt…" : "Retrieve receipt from API"}
        </button>
      </div>
    </dialog>
  );
}
