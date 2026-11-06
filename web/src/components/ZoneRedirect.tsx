import { Navigate, useParams } from "react-router-dom";
import { useApi } from "../api/ApiContext";

export function ZoneRedirect() {
  const { zones } = useApi();
  const { id } = useParams();
  if (id) return <Navigate to={`/zones/${id}`} replace />;
  if (zones.length > 0) return <Navigate to={`/zones/${zones[0].id}`} replace />;
  return <div className="empty">No zones</div>;
}
