const filters = document.querySelectorAll("[data-filter]");
const rows = document.querySelectorAll("[data-sport-row]");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const sport = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("primary", item === button));
    rows.forEach((row) => {
      row.hidden = sport !== "all" && row.dataset.sportRow !== sport;
    });
  });
});

const relativeTimes = document.querySelectorAll("[data-updated-at]");

function renderRelativeTimes() {
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const now = Date.now();
  relativeTimes.forEach((node) => {
    const then = new Date(node.dataset.updatedAt).getTime();
    const minutes = Math.round((then - now) / 60000);
    node.textContent = formatter.format(minutes, "minute");
  });
}

renderRelativeTimes();
