import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { fontFamily, theme } from "../theme";

/**
 * Stylized recreation of the SchoolPurse dashboard for the feature scenes.
 * Variant `arrears` highlights the Arrears card in red, `payments` slides in
 * a "payment received" tick, `reports` animates the bar chart.
 */
interface Props {
  variant: "overview" | "arrears" | "payments" | "reports";
  delay?: number;
}

export const DashboardMock: React.FC<Props> = ({ variant, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 18, mass: 0.7 },
  });
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const y = interpolate(enter, [0, 1], [40, 0]);

  return (
    <div
      style={{
        width: 1280,
        borderRadius: 24,
        background: theme.bgAlt,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)`,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          background: theme.navyDeep,
          padding: "28px 18px",
          color: theme.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: theme.sky,
              opacity: 0.18,
            }}
          />
          <div
            style={{
              fontFamily,
              fontSize: 18,
              fontWeight: 700,
              color: theme.white,
            }}
          >
            School<span style={{ color: theme.sky }}>Purse</span>
          </div>
        </div>
        <div style={{ height: 1, background: theme.borderSoft, margin: "24px 0" }} />
        {[
          { label: "Overview", active: variant === "overview" },
          { label: "Payments", active: variant === "payments" },
          { label: "Arrears", active: variant === "arrears", badge: 11 },
          { label: "Students" },
          { label: "Expenses" },
          { label: "Reports & P&L", active: variant === "reports" },
          { label: "Settings" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              fontFamily,
              fontSize: 14,
              padding: "10px 12px",
              borderRadius: 8,
              color: item.active ? theme.sky : theme.textMuted,
              background: item.active ? "rgba(56,189,248,0.10)" : "transparent",
              fontWeight: item.active ? 600 : 500,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: theme.red,
                  color: theme.white,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {item.badge}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 36px", minHeight: 620 }}>
        <DashboardContent variant={variant} delay={delay + 8} />
      </div>
    </div>
  );
};

const DashboardContent: React.FC<Props> = ({ variant, delay = 0 }) => {
  const frame = useCurrentFrame();
  const local = frame - (delay ?? 0);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div
            style={{
              fontFamily,
              fontSize: 22,
              fontWeight: 700,
              color: theme.white,
            }}
          >
            {variant === "arrears"
              ? "Arrears"
              : variant === "payments"
                ? "Payments"
                : variant === "reports"
                  ? "Reports & P&L"
                  : "Overview"}
          </div>
          <div style={{ fontFamily, fontSize: 12, color: theme.textMuted }}>
            Friday, 22 May 2026
          </div>
        </div>
        <div
          style={{
            fontFamily,
            background: theme.navy,
            color: theme.white,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          + New Registration
        </div>
      </div>

      <div style={{ height: 24 }} />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Kpi label="TODAY" value="$320" highlight={false} delay={local} />
        <Kpi label="THIS MONTH" value="$4,820" delay={local + 4} />
        <Kpi
          label="OUTSTANDING"
          value="$13,360"
          highlight={variant === "arrears"}
          danger
          delay={local + 8}
        />
        <Kpi label="NET" value="$3,180" delay={local + 12} />
      </div>

      <div style={{ height: 24 }} />

      {variant === "reports" ? (
        <BarChart delay={local + 16} />
      ) : variant === "arrears" ? (
        <ArrearsTable delay={local + 16} />
      ) : variant === "payments" ? (
        <PaymentsList delay={local + 16} />
      ) : (
        <BarChart delay={local + 16} />
      )}
    </>
  );
};

const Kpi: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
  delay: number;
}> = ({ label, value, highlight, danger, delay }) => {
  const t = interpolate(delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        background: theme.bgAlt,
        border: `1px solid ${highlight ? theme.red : theme.border}`,
        borderLeftWidth: 3,
        borderLeftColor: danger ? theme.red : theme.sky,
        borderRadius: 12,
        padding: 16,
        position: "relative",
        opacity: t,
        transform: `translateY(${interpolate(t, [0, 1], [16, 0])}px)`,
        boxShadow: highlight ? `0 0 0 2px ${theme.red}44` : undefined,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 10,
          letterSpacing: "0.08em",
          fontWeight: 700,
          color: theme.textMuted,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 26,
          fontWeight: 700,
          marginTop: 6,
          color: danger ? theme.red : theme.white,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
};

const BarChart: React.FC<{ delay: number }> = ({ delay }) => {
  const data = [42, 58, 35, 70, 52, 88];
  const labels = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return (
    <div
      style={{
        background: theme.bgAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: 24,
        height: 320,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 600,
          color: theme.white,
        }}
      >
        Income vs Expenses
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 11,
          color: theme.textMuted,
          marginTop: 2,
        }}
      >
        Last 6 months
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 18,
          height: 220,
          marginTop: 20,
        }}
      >
        {data.map((v, i) => {
          const barDelay = delay - i * 3;
          const grow = interpolate(barDelay, [0, 16], [0, v], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${grow}%`,
                  background: `linear-gradient(180deg, ${theme.sky} 0%, ${theme.navy} 100%)`,
                  borderRadius: "6px 6px 0 0",
                  boxShadow: `0 0 16px ${theme.sky}33`,
                }}
              />
              <div
                style={{
                  fontFamily,
                  fontSize: 11,
                  color: theme.textMuted,
                }}
              >
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ArrearsTable: React.FC<{ delay: number }> = ({ delay }) => {
  const rows = [
    { name: "Zara Khumalo", class: "Grade 1", balance: "$405.00", status: "CRITICAL" },
    { name: "Test Pupil", class: "Grade 3", balance: "$180.00", status: "CRITICAL" },
    { name: "Gladys Moyo", class: "Grade 5", balance: "$220.00", status: "OVERDUE" },
  ];
  return (
    <div
      style={{
        background: theme.bgAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.border}`,
          fontFamily,
          fontSize: 14,
          fontWeight: 600,
          color: theme.white,
        }}
      >
        Students in arrears
      </div>
      {rows.map((r, i) => {
        const rowDelay = delay - i * 6;
        const t = interpolate(rowDelay, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={r.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              padding: "14px 20px",
              borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : "none",
              opacity: t,
              transform: `translateX(${interpolate(t, [0, 1], [-20, 0])}px)`,
              fontFamily,
              fontSize: 13,
            }}
          >
            <span style={{ color: theme.white, fontWeight: 600 }}>{r.name}</span>
            <span style={{ color: theme.textMuted }}>{r.class}</span>
            <span style={{ color: theme.red, fontWeight: 700, textAlign: "right" }}>
              {r.balance}
            </span>
            <span
              style={{
                color: theme.red,
                background: theme.redSoft,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "4px 10px",
                borderRadius: 999,
                justifySelf: "end",
                alignSelf: "center",
              }}
            >
              {r.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PaymentsList: React.FC<{ delay: number }> = ({ delay }) => {
  const rows = [
    { receipt: "KA-2026-000001", name: "Zara Khumalo", amount: "$200.00", method: "Cash" },
    { receipt: "KA-2026-000002", name: "Test Pupil", amount: "$50.00", method: "Cash" },
    { receipt: "KA-2026-000003", name: "Gladys Moyo", amount: "$80.00", method: "Cash" },
  ];
  return (
    <div
      style={{
        background: theme.bgAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.border}`,
          fontFamily,
          fontSize: 14,
          fontWeight: 600,
          color: theme.white,
        }}
      >
        Recent payments
      </div>
      {rows.map((r, i) => {
        const rowDelay = delay - i * 6;
        const t = interpolate(rowDelay, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={r.receipt}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.4fr 1fr 0.8fr 0.8fr",
              padding: "14px 20px",
              borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : "none",
              opacity: t,
              transform: `translateX(${interpolate(t, [0, 1], [-20, 0])}px)`,
              fontFamily,
              fontSize: 13,
              alignItems: "center",
            }}
          >
            <span style={{ color: theme.textMuted, fontFamily: "monospace" }}>
              {r.receipt}
            </span>
            <span style={{ color: theme.white, fontWeight: 600 }}>{r.name}</span>
            <span style={{ color: theme.textMuted }}>{r.method}</span>
            <span style={{ color: theme.sky, fontWeight: 700, textAlign: "right" }}>
              {r.amount}
            </span>
            <span
              style={{
                color: theme.green,
                background: theme.greenSoft,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "4px 10px",
                borderRadius: 999,
                justifySelf: "end",
              }}
            >
              PAID
            </span>
          </div>
        );
      })}
    </div>
  );
};
