import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "./guards";

const auth = vi.hoisted(() => ({
  user: { mustChangePassword: true },
  isAuthenticated: true,
  isLoading: false,
}));
vi.mock("./providers", () => ({ useAuth: () => auth }));
vi.mock("@/features/account/pages/ChangePasswordPage", () => ({
  ChangePasswordPage: () => <h1>Restricted password form</h1>,
}));

describe("restricted password routing", () => {
  it.each(["/dashboard", "/login"])(
    "admits only the password form from %s",
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<p>Ordinary workspace</p>} />
              <Route
                path="/account/security/password"
                element={<p>Ordinary account layout</p>}
              />
            </Route>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<p>Login</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("Restricted password form")).toBeInTheDocument();
      expect(screen.queryByText("Ordinary workspace")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Ordinary account layout"),
      ).not.toBeInTheDocument();
    },
  );
});
