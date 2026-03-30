import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen">
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
