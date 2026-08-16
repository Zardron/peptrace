import { AlertCircle, Eye, EyeOff, LoaderCircle, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  PeptraceApiClient,
  PeptraceApiError,
  type PlatformSecretLockerSummary,
  type ProvisionedPlatformSecret
} from "@peptrace/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientVault = PlatformSecretLockerSummary["companies"][number];
type LabelRow = { key: string; value: string };

export function PlatformSecretDialog({
  api,
  client,
  onClose,
  onCreated
}: {
  api: PeptraceApiClient;
  client: ClientVault;
  onClose: () => void;
  onCreated: (result: ProvisionedPlatformSecret) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [isValueVisible, setIsValueVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const normalizedLabels: Record<string, string> = {};
    for (const row of labels) {
      const key = row.key.trim();
      const labelValue = row.value.trim();
      if (!key && !labelValue) continue;
      if (!key || !labelValue) {
        setError("Each label needs both a key and a value.");
        return;
      }
      if (key in normalizedLabels) {
        setError(`The label key ${key} is duplicated.`);
        return;
      }
      normalizedLabels[key] = labelValue;
    }

    setIsSubmitting(true);
    try {
      const result = await api.provisionPlatformSecret({
        tenantId: client.tenantId,
        name: name.trim(),
        description: description.trim() || undefined,
        labels: normalizedLabels,
        value
      });
      onCreated(result);
    } catch (requestError) {
      setError(getProvisionError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="secret-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }} role="presentation">
      <section aria-labelledby="secret-dialog-title" aria-modal="true" className="secret-dialog" role="dialog">
        <div className="secret-dialog-header">
          <div className="secret-dialog-title-group">
            <span className="secret-dialog-icon"><ShieldCheck size={20} strokeWidth={2} /></span>
            <div>
              <p>{client.tenantName}</p>
              <h2 id="secret-dialog-title">Add encrypted secret</h2>
            </div>
          </div>
          <Button aria-label="Close" className="icon-button compact" disabled={isSubmitting} onClick={onClose} title="Close" type="button" variant="outline" size="icon">
            <X size={17} strokeWidth={2} />
          </Button>
        </div>

        <form className="secret-dialog-form" onSubmit={submit}>
          <div className="secret-dialog-notice">
            <ShieldCheck size={18} strokeWidth={2} />
            <span>The value is encrypted before storage and cannot be viewed from the superadmin panel after creation.</span>
          </div>

          {error && (
            <div className="secret-dialog-error" role="alert">
              <AlertCircle size={18} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <label className="form-field">
            <span>Secret name</span>
            <Input
              autoFocus
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
              pattern="[A-Za-z][A-Za-z0-9_-]*"
              placeholder="PAYMENT_API_KEY"
              required
              value={name}
            />
            <small>Start with a letter; use letters, numbers, underscores, or hyphens.</small>
          </label>

          <label className="form-field">
            <span>Description (optional)</span>
            <Input maxLength={1000} onChange={(event) => setDescription(event.target.value)} placeholder="Production payment service credential" value={description} />
          </label>

          <label className="form-field">
            <span>Initial secret value</span>
            <span className="secret-value-shell">
              <textarea
                autoComplete="new-password"
                data-masked={!isValueVisible}
                maxLength={65_536}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter the value once"
                required
                rows={5}
                value={value}
              />
              <button aria-label={isValueVisible ? "Hide secret value" : "Show secret value"} onClick={() => setIsValueVisible((current) => !current)} title={isValueVisible ? "Hide value" : "Show value"} type="button">
                {isValueVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
            <small>Maximum encrypted payload: 64 KB.</small>
          </label>

          <div className="secret-label-section">
            <div className="secret-label-heading">
              <div>
                <strong>Labels</strong>
                <span>Optional metadata for filtering and ownership.</span>
              </div>
              <Button className="secondary-button" onClick={() => setLabels((current) => [...current, { key: "", value: "" }])} type="button" variant="outline">
                <Plus size={16} strokeWidth={2} />
                <span>Add label</span>
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="secret-label-list">
                {labels.map((row, index) => (
                  <div className="secret-label-row" key={index}>
                    <Input aria-label={`Label ${index + 1} key`} onChange={(event) => setLabels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} placeholder="environment" value={row.key} />
                    <Input aria-label={`Label ${index + 1} value`} onChange={(event) => setLabels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="production" value={row.value} />
                    <Button aria-label={`Remove label ${index + 1}`} className="icon-button compact" onClick={() => setLabels((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove label" type="button" variant="outline" size="icon">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="secret-dialog-actions">
            <Button className="secondary-button" disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle className="button-spinner" size={17} /> : <ShieldCheck size={17} strokeWidth={2} />}
              <span>{isSubmitting ? "Encrypting secret" : "Create encrypted secret"}</span>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function getProvisionError(error: unknown): string {
  if (error instanceof PeptraceApiError && error.payload && typeof error.payload === "object" && "message" in error.payload) {
    const message = (error.payload as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return "Could not create the secret. Please try again.";
}
