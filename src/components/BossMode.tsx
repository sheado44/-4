"use client";

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS = 18;

const CELLS: Record<string, string> = {
  A1: "Region",
  B1: "Owner",
  C1: "Account",
  D1: "Stage",
  E1: "Q3",
  F1: "Q4",
  G1: "Variance",
  H1: "Notes",
  A2: "Northeast",
  B2: "Patel",
  C2: "Northwind",
  D2: "Commit",
  E2: "184,200",
  F2: "191,400",
  G2: "3.9%",
  H2: "Renewal 9/30",
  A3: "Midwest",
  B3: "Chen",
  C3: "Contoso",
  D3: "Best case",
  E3: "96,110",
  F3: "102,000",
  G3: "6.1%",
  H3: "Waiting legal",
  A4: "West",
  B4: "Okoye",
  C4: "Fabrikam",
  D4: "Pipeline",
  E4: "61,450",
  F4: "74,800",
  G4: "21.7%",
  H4: "Demo Friday",
  A5: "South",
  B5: "Nguyen",
  C5: "Tailspin",
  D5: "Commit",
  E5: "128,900",
  F5: "130,000",
  G5: "0.9%",
  H5: "No change",
  A7: "Total",
  E7: "470,660",
  F7: "498,200",
  G7: "5.9%",
  A9: "Notes",
  B9: "Do not share outside the working group.",
};

export default function BossMode({
  on,
  onClose,
}: {
  on: boolean;
  onClose: () => void;
}) {
  if (!on) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#F3F3F3", color: "#1F1F1F", fontFamily: "Segoe UI, Calibri, Arial, sans-serif" }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="h-8 flex items-center px-3 text-xs"
        style={{ background: "#217346", color: "white" }}
      >
        <button type="button" onClick={onClose} className="mr-3 opacity-90 hover:opacity-100">
          File
        </button>
        <span className="opacity-90">Home</span>
        <span className="mx-3 opacity-90">Insert</span>
        <span className="opacity-90">Data</span>
        <span className="ml-auto opacity-90">regional_forecast.xlsx</span>
      </div>

      <div className="h-9 flex items-center gap-2 px-3 text-xs border-b" style={{ background: "#E6E6E6", borderColor: "#C8C8C8" }}>
        <span style={{ color: "#666" }}>fx</span>
        <div className="flex-1 h-6 px-2 flex items-center" style={{ background: "white", border: "1px solid #C8C8C8" }}>
          SUM(E2:E5)
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="w-8 border text-center font-normal" style={{ background: "#F0F0F0", borderColor: "#D0D0D0" }} />
              {COLS.map((c) => (
                <th
                  key={c}
                  className="border text-center font-normal py-1"
                  style={{ background: "#F0F0F0", borderColor: "#D0D0D0", minWidth: 110 }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, i) => i + 1).map((r) => (
              <tr key={r}>
                <td
                  className="border text-center"
                  style={{ background: "#F0F0F0", borderColor: "#D0D0D0", color: "#666" }}
                >
                  {r}
                </td>
                {COLS.map((c) => {
                  const key = `${c}${r}`;
                  const val = CELLS[key] || "";
                  const header = r === 1;
                  const total = r === 7;
                  return (
                    <td
                      key={key}
                      className="border px-2 py-1"
                      style={{
                        borderColor: "#D0D0D0",
                        background: header ? "#E2EFDA" : total ? "#FFF2CC" : "white",
                        fontWeight: header || total ? 600 : 400,
                        textAlign: c >= "E" && c <= "G" && r > 1 ? "right" : "left",
                      }}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="h-6 flex items-center justify-between px-3 text-[10px]"
        style={{ background: "#217346", color: "white" }}
      >
        <span>Ready</span>
        <button type="button" onClick={onClose} className="underline">
          Esc
        </button>
      </div>
    </div>
  );
}

