import { useState } from "react";
import { MOCK_DEVICES } from "../utils/mockData";

export default function DevicesPage() {

  const [devices,setDevices] = useState(MOCK_DEVICES);

  return (
    <div style={{padding:40}}>
      <h2>Devices</h2>

      {devices.map(d=>(
        <div key={d.id}>
          {d.name} - {d.location}
        </div>
      ))}

    </div>
  );
}