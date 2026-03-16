export const MOCK_DEVICES = [
  { id: "dev_001", name: "Microgrid Alpha", location: "Village Ramnagar", panels: 12, status: "online", createdAt: "2024-01-15" },
  { id: "dev_002", name: "Solar Array Beta", location: "District Pune", panels: 8, status: "degraded", createdAt: "2024-02-20" },
  { id: "dev_003", name: "Microgrid Gamma", location: "Taluka Nashik", panels: 6, status: "offline", createdAt: "2024-03-10" },
];

export const MOCK_ALERTS = [
  { id: 1, time: "10:32 AM", deviceId: "panel_01", type: "Efficiency Alert", message: "Panel efficiency dropped below 60% threshold", status: "Warning", severity: "high" },
  { id: 2, time: "09:47 AM", deviceId: "panel_03", type: "Voltage Spike", message: "Voltage exceeded 22V — possible inverter issue", status: "Critical", severity: "critical" },
];