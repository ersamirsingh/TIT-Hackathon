import { Link } from "react-router-dom";
import MotionPage from "../components/MotionPage.jsx";

export default function NotFoundPage() {
  return (
    <MotionPage className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-xl rounded-[2.5rem] p-10 text-center">
        <p className="section-label">404</p>
        <h1 className="display-font mt-4 text-5xl text-base-100">This route is off the grid.</h1>
        <p className="mt-4 text-base leading-8 text-base-content/65">
          The page you requested does not exist in the current workspace.
        </p>
        <Link className="k-btn mt-8" to="/">
          Return home
        </Link>
      </div>
    </MotionPage>
  );
}
