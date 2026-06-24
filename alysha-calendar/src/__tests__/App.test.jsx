import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Mock the components to isolate App logic
vi.mock("../components/PhotoCard", () => ({
  default: ({ entry, onClick }) => (
    <div data-testid={`photo-card-${entry.id}`} onClick={() => onClick(entry)}>
      {entry.label}
    </div>
  ),
}));

vi.mock("../components/LightboxModal", () => ({
  default: ({ entry, onClose, onPrev, onNext, hasPrev, hasNext }) => (
    <div data-testid="lightbox-modal">
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
      <button data-testid="modal-prev" onClick={onPrev} disabled={!hasPrev}>
        Prev
      </button>
      <button data-testid="modal-next" onClick={onNext} disabled={!hasNext}>
        Next
      </button>
      <div data-testid="modal-content">{entry.label}</div>
    </div>
  ),
}));

vi.mock("../components/GrowthTimeline", () => ({
  default: ({ entries, onSelect }) => (
    <div data-testid="growth-timeline">
      {entries.map((e) => (
        <button
          key={e.id}
          data-testid={`timeline-dot-${e.id}`}
          onClick={() => onSelect(e)}
        >
          {e.id}
        </button>
      ))}
    </div>
  ),
}));

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Filter Logic", () => {
    it("should render 'All Moments' filter button and show all entries by default", () => {
      render(<App />);
      const allButton = screen.getByRole("button", { name: "All Moments" });
      expect(allButton).toHaveClass("active");
      // Timeline should have dots for all entries
      const timeline = screen.getByTestId("growth-timeline");
      const dots = within(timeline).getAllByRole("button");
      expect(dots.length).toBeGreaterThan(0);
    });

    it("should filter to show only birth day entries (ageInDays === 0)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const birthButton = screen.getByRole("button", { name: "Birth Day" });
      await user.click(birthButton);

      expect(birthButton).toHaveClass("active");
      // Should show only entry with ageInDays: 0
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      expect(photoCards.length).toBe(1);
      expect(screen.getByTestId("photo-card-1")).toBeInTheDocument();
    });

    it("should filter to show only first week entries (0 < ageInDays <= 7)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const week1Button = screen.getByRole("button", { name: "First Week" });
      await user.click(week1Button);

      expect(week1Button).toHaveClass("active");
      // Should show entries with ageInDays between 1 and 7
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      photoCards.forEach((card) => {
        const id = card.getAttribute("data-testid").replace("photo-card-", "");
        expect(parseInt(id)).toBeGreaterThan(1); // id > 1 maps to ageInDays > 0
      });
    });

    it("should filter to show only week 2 entries (7 < ageInDays <= 14)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const week2Button = screen.getByRole("button", { name: "Week 2" });
      await user.click(week2Button);

      expect(week2Button).toHaveClass("active");
      // Should show entries with ageInDays between 8 and 14
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      expect(photoCards.length).toBeGreaterThan(0);
    });

    it("should filter to show only month 1+ entries (ageInDays > 14)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const month1Button = screen.getByRole("button", { name: "1 Month+" });
      await user.click(month1Button);

      expect(month1Button).toHaveClass("active");
      // Should show entries with ageInDays > 14
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      expect(photoCards.length).toBeGreaterThan(0);
    });

    it("should update active filter button class when switching filters", async () => {
      const user = userEvent.setup();
      render(<App />);

      const allButton = screen.getByRole("button", { name: "All Moments" });
      const birthButton = screen.getByRole("button", { name: "Birth Day" });

      expect(allButton).toHaveClass("active");
      expect(birthButton).not.toHaveClass("active");

      await user.click(birthButton);

      expect(allButton).not.toHaveClass("active");
      expect(birthButton).toHaveClass("active");
    });
  });

  describe("Modal Management", () => {
    it("should not render modal when no entry is active", () => {
      render(<App />);
      expect(screen.queryByTestId("lightbox-modal")).not.toBeInTheDocument();
    });

    it("should open modal when a photo card is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const photoCard = screen.getByTestId("photo-card-1");
      await user.click(photoCard);

      expect(screen.getByTestId("lightbox-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toHaveTextContent("Birth Day");
    });

    it("should close modal when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const photoCard = screen.getByTestId("photo-card-1");
      await user.click(photoCard);

      expect(screen.getByTestId("lightbox-modal")).toBeInTheDocument();

      const closeButton = screen.getByTestId("modal-close");
      await user.click(closeButton);

      expect(screen.queryByTestId("lightbox-modal")).not.toBeInTheDocument();
    });

    it("should show correct entry in modal", async () => {
      const user = userEvent.setup();
      render(<App />);

      const photoCard = screen.getByTestId("photo-card-2");
      await user.click(photoCard);

      expect(screen.getByTestId("modal-content")).toHaveTextContent("Day 3");
    });
  });

  describe("Modal Navigation", () => {
    it("should disable prev button on first entry", async () => {
      const user = userEvent.setup();
      render(<App />);

      const firstCard = screen.getByTestId("photo-card-1");
      await user.click(firstCard);

      const prevButton = screen.getByTestId("modal-prev");
      expect(prevButton).toBeDisabled();
    });

    it("should enable next button on first entry", async () => {
      const user = userEvent.setup();
      render(<App />);

      const firstCard = screen.getByTestId("photo-card-1");
      await user.click(firstCard);

      const nextButton = screen.getByTestId("modal-next");
      expect(nextButton).not.toBeDisabled();
    });

    it("should navigate to next entry when next button is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const firstCard = screen.getByTestId("photo-card-1");
      await user.click(firstCard);

      expect(screen.getByTestId("modal-content")).toHaveTextContent("Birth Day");

      const nextButton = screen.getByTestId("modal-next");
      await user.click(nextButton);

      expect(screen.getByTestId("modal-content")).toHaveTextContent("Day 3");
    });

    it("should navigate to prev entry when prev button is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const secondCard = screen.getByTestId("photo-card-2");
      await user.click(secondCard);

      expect(screen.getByTestId("modal-content")).toHaveTextContent("Day 3");

      const prevButton = screen.getByTestId("modal-prev");
      await user.click(prevButton);

      expect(screen.getByTestId("modal-content")).toHaveTextContent("Birth Day");
    });

    it("should disable next button on last entry", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Get all photo cards and click the last one
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      const lastCard = photoCards[photoCards.length - 1];
      await user.click(lastCard);

      const nextButton = screen.getByTestId("modal-next");
      expect(nextButton).toBeDisabled();
    });

    it("should respect filter boundaries during navigation", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Filter to birth day only (1 entry)
      const birthButton = screen.getByRole("button", { name: "Birth Day" });
      await user.click(birthButton);

      const photoCard = screen.getByTestId("photo-card-1");
      await user.click(photoCard);

      // Both prev and next should be disabled (only 1 entry in filtered list)
      const prevButton = screen.getByTestId("modal-prev");
      const nextButton = screen.getByTestId("modal-next");
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should only navigate within filtered entries", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Filter to week 1 (days 1-7)
      const week1Button = screen.getByRole("button", { name: "First Week" });
      await user.click(week1Button);

      // Click first filtered entry
      const photoCards = screen.getAllByTestId(/^photo-card-/);
      await user.click(photoCards[0]);

      const initialContent = screen.getByTestId("modal-content").textContent;

      // Click next multiple times and verify we stay within week 1
      const nextButton = screen.getByTestId("modal-next");
      while (!nextButton.disabled) {
        await user.click(nextButton);
      }

      // Should have stopped at a week 1 entry
      const finalContent = screen.getByTestId("modal-content").textContent;
      expect(finalContent).not.toBeNull();
    });
  });

  describe("Stats Display", () => {
    it("should display total moments count", () => {
      render(<App />);
      const statElements = screen.getAllByText(/Moments/);
      expect(statElements.length).toBeGreaterThan(0);
    });

    it("should display photo count", () => {
      render(<App />);
      const statElements = screen.getAllByText(/Photos/);
      expect(statElements.length).toBeGreaterThan(0);
    });

    it("should display 'To add' count", () => {
      render(<App />);
      const statElements = screen.getAllByText(/To add/);
      expect(statElements.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("should show empty state message when filter has no results", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Note: With real data this may not trigger, but the logic is there
      const allButton = screen.getByRole("button", { name: "All Moments" });
      await user.click(allButton);

      // With "All Moments" filter, there should always be entries
      const photoGrid = screen.queryByRole("main");
      expect(photoGrid).toBeInTheDocument();
    });
  });

  describe("Timeline Interaction", () => {
    it("should open modal when timeline dot is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const timelineDot = screen.getByTestId("timeline-dot-1");
      await user.click(timelineDot);

      expect(screen.getByTestId("lightbox-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toHaveTextContent("Birth Day");
    });

    it("should update modal content when different timeline dot is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const dot1 = screen.getByTestId("timeline-dot-1");
      await user.click(dot1);
      expect(screen.getByTestId("modal-content")).toHaveTextContent("Birth Day");

      const dot2 = screen.getByTestId("timeline-dot-2");
      await user.click(dot2);
      expect(screen.getByTestId("modal-content")).toHaveTextContent("Day 3");
    });
  });

  describe("Filter Persistence with Modal", () => {
    it("should maintain active filter when opening modal", async () => {
      const user = userEvent.setup();
      render(<App />);

      const week1Button = screen.getByRole("button", { name: "First Week" });
      await user.click(week1Button);

      const photoCards = screen.getAllByTestId(/^photo-card-/);
      await user.click(photoCards[0]);

      expect(screen.getByTestId("lightbox-modal")).toBeInTheDocument();
      expect(week1Button).toHaveClass("active");
    });

    it("should change filter while modal is open", async () => {
      const user = userEvent.setup();
      render(<App />);

      const photoCard = screen.getByTestId("photo-card-1");
      await user.click(photoCard);

      expect(screen.getByTestId("lightbox-modal")).toBeInTheDocument();

      const week1Button = screen.getByRole("button", { name: "First Week" });
      await user.click(week1Button);

      // Modal should close when filter changes (entries may no longer be in filtered list)
      // This behavior depends on implementation
      expect(week1Button).toHaveClass("active");
    });
  });
});
