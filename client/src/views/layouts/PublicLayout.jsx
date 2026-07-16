import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="floating-blur one" />
      <div className="floating-blur two" />
      <div className="page-wrap">
        <Outlet />
      </div>
    </div>
  );
}
