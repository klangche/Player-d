import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { routes } from "../routes";

export function Sidebar() {
  const location = useLocation();
  const [zoneNames] = useState<string[]>(["Living Room", "Kitchen", "Showroom"]);

  return (
    <nav className="sidebar">
      <div className="sidebar-title">Player-d</div>
      <div className="sidebar-group">
        <div className="sidebar-group-label">Zones</div>
        {zoneNames.map((name) => (
          <Link key={name} to={routes.zone("zone-living")}>
            {name}
          </Link>
        ))}
      </div>
      <div className="sidebar-group">
        <div className="sidebar-group-label">Pinned</div>
        <Link to={routes.dante}>Dante Controller</Link>
        <Link to={routes.zoneMixer}>Zone Mixer</Link>
      </div>
      <div className="sidebar-group">
        <div className="sidebar-group-label">System</div>
        <Link to={routes.settings}>Settings</Link>
      </div>
      <div className="sidebar-active">{location.pathname}</div>
    </nav>
  );
}
