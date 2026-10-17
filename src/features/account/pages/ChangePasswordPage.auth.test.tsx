import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordPage } from "./ChangePasswordPage";

const mocks = vi.hoisted(() => ({
  user: { hasPassword: true },
  refreshUser: vi.fn(),
  complete: vi.fn(),
  change: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@/app/providers", () => ({
  useAuth: () => ({ user: mocks.user, refreshUser: mocks.refreshUser }),
}));
vi.mock("@/services/api/tokenStore", () => ({
  tokenStore: { completePasswordChange: mocks.complete },
}));
vi.mock("../services/account.service", () => ({
  accountService: { changePassword: mocks.change, setPassword: mocks.set },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.hasPassword = true;
  mocks.change.mockResolvedValue(undefined);
  mocks.set.mockResolvedValue(undefined);
});

function submit() {
  if (mocks.user.hasPassword)
    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "Old-Fixture-42!" },
    });
  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "New-Fixture-42!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm New Password"), {
    target: { value: "New-Fixture-42!" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", {
      name: mocks.user.hasPassword ? "Update Password" : "Set Password",
    }),
  );
}
describe("forced credential remediation", () => {
  it("clears the restricted state only after a successful password change and reloads identity", async () => {
    render(<ChangePasswordPage />);
    submit();
    await waitFor(() => expect(mocks.refreshUser).toHaveBeenCalledTimes(1));
    expect(mocks.change).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPassword: "Old-Fixture-42!",
        newPassword: "New-Fixture-42!",
      }),
    );
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });
  it("supports initial password setting for an account without a password", async () => {
    mocks.user.hasPassword = false;
    render(<ChangePasswordPage />);
    submit();
    await waitFor(() => expect(mocks.refreshUser).toHaveBeenCalledTimes(1));
    expect(mocks.set).toHaveBeenCalledWith("New-Fixture-42!");
    expect(mocks.change).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });
  it("retains the restriction on a rejected credential change", async () => {
    mocks.change.mockRejectedValueOnce(new Error("rejected"));
    render(<ChangePasswordPage />);
    submit();
    expect(
      await screen.findByText(
        "Failed to update password. Please check your current password.",
      ),
    ).toBeInTheDocument();
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.refreshUser).not.toHaveBeenCalled();
  });
});
