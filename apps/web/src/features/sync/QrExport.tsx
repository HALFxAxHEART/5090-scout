import { useEffect, useState } from "react";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";
import { encodeRecordToPayload, renderQrDataUrl } from "../../lib/qr";

export function QrExport({ record, onClose }: { record: SubmitScoutingRecordInput; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const payload = encodeRecordToPayload(record);
    renderQrDataUrl(payload).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [record]);

  return (
    <div className="card qr-wrap">
      <p>
        Match {record.matchKey} — Team {record.scoutedTeamKey.replace("frc", "")}
      </p>
      {dataUrl ? <img src={dataUrl} alt="Scouting record QR code" width={320} height={320} /> : <p className="muted">Generating…</p>}
      <p className="muted">Hold this up to the sync station&apos;s camera on the Scan tab.</p>
      <button type="button" className="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
