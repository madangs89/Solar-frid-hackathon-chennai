import { MOCK_ALERTS } from "../utils/mockData";

export default function AlertsPage(){

  return (
    <div style={{padding:40}}>
      <h2>Alerts</h2>

      {MOCK_ALERTS.map(a=>(
        <div key={a.id}>
          {a.type} - {a.message}
        </div>
      ))}

    </div>
  );
}