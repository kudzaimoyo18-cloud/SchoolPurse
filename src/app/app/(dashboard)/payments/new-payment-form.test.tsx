import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewPaymentForm, type OutstandingLine } from "./new-payment-form";

// ─── Mocks ─────────────────────────────────────────────────────────────────
// We isolate the form from the server boundary so tests focus on the UI
// contract: what the bursar sees, what gets sent to recordPayment, and
// which toasts fire.

const recordPayment = vi.fn();
const quickAddStudent = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("./actions", () => ({
  recordPayment: (...args: unknown[]) => recordPayment(...args),
}));

vi.mock("@/app/app/(dashboard)/students/quick-add-action", () => ({
  quickAddStudent: (...args: unknown[]) => quickAddStudent(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

// ─── Fixtures ──────────────────────────────────────────────────────────────

const SCHOOL_FEES: OutstandingLine = {
  id: "line-1",
  description: "Term 2 school fees",
  balance: 250,
  invoice_period: "Term 2",
  due_date: "2026-05-01",
};

const REGISTRATION: OutstandingLine = {
  id: "line-2",
  description: "Registration",
  balance: 50,
  invoice_period: null,
  due_date: null,
};

const STUDENT_WITH_DEBT = {
  id: "stu-1",
  name: "Tendai Moyo",
  class_name: "Grade 5",
  outstanding_lines: [SCHOOL_FEES, REGISTRATION],
};

const STUDENT_CLEAN = {
  id: "stu-2",
  name: "Tariro Ndlovu",
  class_name: "Grade 7",
  outstanding_lines: [], // → credit-payment flow
};

const STUDENTS = [STUDENT_WITH_DEBT, STUDENT_CLEAN];

const CLASSES = [
  { id: "cls-1", name: "Grade 1", level: "primary" as const },
  { id: "cls-2", name: "Form 2", level: "secondary" as const },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function renderForm(overrides: Partial<Parameters<typeof NewPaymentForm>[0]> = {}) {
  return render(
    <NewPaymentForm
      students={STUDENTS}
      classes={CLASSES}
      defaultOpen
      {...overrides}
    />,
  );
}

async function pickStudent(
  user: ReturnType<typeof userEvent.setup>,
  fullName: string,
) {
  // The "Add new student" affordance shows `Add new student : "Tendai"` when
  // search has a value — its accessible name then matches any regex like
  // `/Tendai/` and conflicts with the option button. Anchor the regex to the
  // start of the student's full name so only the option is matched.
  const search = screen.getByLabelText("Student");
  await user.click(search);
  await user.type(search, fullName.split(" ")[0]);
  const option = await screen.findByRole("button", {
    name: new RegExp(`^${fullName}`),
  });
  await user.click(option);
}

beforeEach(() => {
  recordPayment.mockReset();
  quickAddStudent.mockReset();
  routerRefresh.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  // Vitest doesn't expose `afterEach` as a global by default, so RTL's
  // auto-cleanup never fires. Without this, each render stacks a new
  // form into the DOM and queries like `getByLabelText("Student")` find
  // multiple matches. Calling cleanup explicitly fixes the test isolation.
  cleanup();
  vi.clearAllMocks();
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("NewPaymentForm — open/close", () => {
  test("renders only a 'Record payment' trigger button when collapsed", () => {
    render(<NewPaymentForm students={STUDENTS} classes={CLASSES} />);
    expect(
      screen.getByRole("button", { name: /record payment/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Student")).not.toBeInTheDocument();
  });

  test("clicking the trigger button opens the form", async () => {
    const user = userEvent.setup();
    render(<NewPaymentForm students={STUDENTS} classes={CLASSES} />);
    await user.click(screen.getByRole("button", { name: /record payment/i }));
    expect(screen.getByLabelText("Student")).toBeInTheDocument();
  });

  test("the close (X) button collapses the form back to a trigger button", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByLabelText("Student")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /record payment/i }),
    ).toBeInTheDocument();
  });
});

describe("NewPaymentForm — student picker", () => {
  test("typing a name filters the dropdown to matching students", async () => {
    const user = userEvent.setup();
    renderForm();
    const search = screen.getByLabelText("Student");
    await user.click(search);
    await user.type(search, "Tendai");

    expect(
      await screen.findByRole("button", { name: /Tendai Moyo/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tariro Ndlovu/ }),
    ).not.toBeInTheDocument();
  });

  test("shows a 'No matches' hint when search yields nothing", async () => {
    const user = userEvent.setup();
    renderForm();
    const search = screen.getByLabelText("Student");
    await user.click(search);
    await user.type(search, "Nonexistent");
    expect(await screen.findByText(/no matches/i)).toBeInTheDocument();
  });

  test("picking a student fills the search input with name + class", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    expect(screen.getByLabelText("Student")).toHaveValue(
      "Tendai Moyo · Grade 5",
    );
  });
});

describe("NewPaymentForm — allocation math", () => {
  test("shows allocation table with one row per outstanding line", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    expect(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Amount paid for Registration"),
    ).toBeInTheDocument();
  });

  test("Receipt total starts at $0.00 with no allocations entered", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  test("Receipt total updates live as allocations are entered", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");

    const feeInput = screen.getByLabelText("Amount paid for Term 2 school fees");
    const regInput = screen.getByLabelText("Amount paid for Registration");

    await user.type(feeInput, "100");
    expect(screen.getByText("$100.00")).toBeInTheDocument();

    await user.type(regInput, "25");
    // Live total = $100 + $25 = $125
    expect(screen.getByText("$125.00")).toBeInTheDocument();
  });

  test("'Pay full' button fills the exact outstanding balance for that line", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");

    // SCHOOL_FEES.balance = 250. The "Pay full" link is in the same row.
    const feeRow = screen
      .getByLabelText("Amount paid for Term 2 school fees")
      .closest("li");
    expect(feeRow).not.toBeNull();
    const payFull = within(feeRow as HTMLElement).getByRole("button", {
      name: /pay full/i,
    });
    await user.click(payFull);

    expect(screen.getByLabelText("Amount paid for Term 2 school fees")).toHaveValue(
      250,
    );
    // The line balance label is also "$250.00", so anchor the receipt-total
    // assertion to the "Receipt total" region to avoid the duplicate-text trap.
    const totalLabel = screen.getByText(/receipt total/i);
    const totalBlock = totalLabel.closest("div") as HTMLElement;
    expect(within(totalBlock).getByText("$250.00")).toBeInTheDocument();
  });

  test("flags overpayment with an 'Exceeds balance' warning", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");

    // SCHOOL_FEES.balance = 250 — type more than that.
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "500",
    );
    expect(screen.getByText(/exceeds balance/i)).toBeInTheDocument();
  });
});

describe("NewPaymentForm — credit (no outstanding) flow", () => {
  test("students with no outstanding lines see a Credit amount field instead", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tariro Ndlovu");
    expect(screen.getByLabelText(/credit amount/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/amount paid for/i),
    ).not.toBeInTheDocument();
  });
});

describe("NewPaymentForm — submit gating", () => {
  test("submit button is disabled when no student is selected", () => {
    renderForm();
    const submit = screen.getByRole("button", { name: /record .* issue receipt/i });
    expect(submit).toBeDisabled();
  });

  test("submit button stays disabled when total is $0", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    const submit = screen.getByRole("button", {
      name: /record .* issue receipt/i,
    });
    expect(submit).toBeDisabled();
  });

  test("submit button enables once a positive allocation is entered", async () => {
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "100",
    );
    const submit = screen.getByRole("button", {
      name: /record .* issue receipt/i,
    });
    expect(submit).toBeEnabled();
  });
});

describe("NewPaymentForm — submission", () => {
  test("sends correct student_id, amount, and allocations to recordPayment", async () => {
    recordPayment.mockResolvedValue({
      ok: true,
      paymentId: "pay-1",
      receiptNumber: "R-0001",
    });
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "100",
    );
    await user.type(
      screen.getByLabelText("Amount paid for Registration"),
      "25",
    );
    await user.click(
      screen.getByRole("button", { name: /record .* issue receipt/i }),
    );

    expect(recordPayment).toHaveBeenCalledTimes(1);
    const formData = recordPayment.mock.calls[0][0] as FormData;
    expect(formData.get("student_id")).toBe("stu-1");
    expect(formData.get("amount_usd")).toBe("125");
    expect(JSON.parse(String(formData.get("allocations")))).toEqual([
      { invoice_line_id: "line-1", amount_usd: 100 },
      { invoice_line_id: "line-2", amount_usd: 25 },
    ]);
  });

  test("omits zero-amount allocations from the payload", async () => {
    // Bursar enters $100 against fees, leaves Registration blank.
    // Payload must contain only the fee allocation, not a zero row.
    recordPayment.mockResolvedValue({
      ok: true,
      paymentId: "pay-1",
      receiptNumber: "R-0001",
    });
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "100",
    );
    await user.click(
      screen.getByRole("button", { name: /record .* issue receipt/i }),
    );

    const formData = recordPayment.mock.calls[0][0] as FormData;
    const allocs = JSON.parse(String(formData.get("allocations"))) as Array<{
      invoice_line_id: string;
    }>;
    expect(allocs).toHaveLength(1);
    expect(allocs[0].invoice_line_id).toBe("line-1");
  });

  test("shows success toast and triggers router.refresh on successful save", async () => {
    recordPayment.mockResolvedValue({
      ok: true,
      paymentId: "pay-1",
      receiptNumber: "R-1234",
    });
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "100",
    );
    await user.click(
      screen.getByRole("button", { name: /record .* issue receipt/i }),
    );

    expect(await screen.findByText(/Receipt R-1234 issued/)).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith("Receipt R-1234 issued");
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  test("shows error toast and does NOT refresh on failed save", async () => {
    recordPayment.mockResolvedValue({
      ok: false,
      error: "Could not allocate payment",
    });
    const user = userEvent.setup();
    renderForm();
    await pickStudent(user, "Tendai Moyo");
    await user.type(
      screen.getByLabelText("Amount paid for Term 2 school fees"),
      "100",
    );
    await user.click(
      screen.getByRole("button", { name: /record .* issue receipt/i }),
    );

    expect(toastError).toHaveBeenCalledWith("Could not allocate payment");
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});

describe("NewPaymentForm — quick-add student", () => {
  test("clicking 'Add new student' opens the inline mini-form", async () => {
    const user = userEvent.setup();
    renderForm();
    const search = screen.getByLabelText("Student");
    await user.click(search);
    await user.type(search, "Brand");
    await user.click(
      await screen.findByRole("button", { name: /add new student/i }),
    );

    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last name")).toBeInTheDocument();
  });

  test("requires both first and last name before submitting", async () => {
    const user = userEvent.setup();
    renderForm();
    const search = screen.getByLabelText("Student");
    await user.click(search);
    await user.type(search, "Solo");
    await user.click(
      await screen.findByRole("button", { name: /add new student/i }),
    );

    // The search typed "Solo" — it lands in First name; Last name stays empty.
    await user.click(screen.getByRole("button", { name: /add & select/i }));

    expect(toastError).toHaveBeenCalledWith(
      "Both first and last name are required",
    );
    expect(quickAddStudent).not.toHaveBeenCalled();
  });

  test("successful quick-add picks the new student into the form", async () => {
    quickAddStudent.mockResolvedValue({
      ok: true,
      student: { id: "stu-new", name: "Brand New", class_name: null },
    });
    const user = userEvent.setup();
    renderForm();
    const search = screen.getByLabelText("Student");
    await user.click(search);
    await user.type(search, "Brand");
    await user.click(
      await screen.findByRole("button", { name: /add new student/i }),
    );

    // "Brand" → First name; type a last name then submit.
    await user.type(screen.getByPlaceholderText("Last name"), "New");
    await user.click(screen.getByRole("button", { name: /add & select/i }));

    expect(quickAddStudent).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalled();
    // The new student becomes the picked one — search input reflects it.
    expect(screen.getByLabelText("Student")).toHaveValue("Brand New");
  });
});
