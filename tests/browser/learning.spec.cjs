const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function home(page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your next chapter." }),
  ).toBeVisible();
}
async function navigate(page, name) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function answerQuiz(page) {
  for (const question of await page.locator(".practice-quiz fieldset").all()) {
    if (await question.locator('input[type="radio"]').count())
      await question.locator(".answer-option").first().click();
    else await question.locator("input").fill("A hybrid model");
  }
  await page.getByRole("button", { name: "Periksa jawaban" }).click();
  await expect(
    page.getByRole("button", { name: "Selesai belajar" }),
  ).toBeVisible();
}
test("first-run grammar progress persists, review cannot double-award, goal is editable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await home(page);
  await page.getByLabel("Sesuaikan ritmemu").selectOption("20");
  await page.getByRole("button", { name: "Mulai lesson", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Articles", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Materi cadangan aktif", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Langsung ke quiz" }).click();
  await expect(
    page.getByRole("button", { name: "Periksa jawaban" }),
  ).toBeDisabled();
  await answerQuiz(page);
  await expect(page.locator(".xp-mini")).toHaveText("20 XP");
  await page.getByRole("button", { name: "Ulangi quiz" }).click();
  await answerQuiz(page);
  await expect(page.locator(".xp-mini")).toHaveText("20 XP");
  await page.getByRole("button", { name: "Selesai belajar" }).click();
  await expect(
    page.getByText("Target tercapai. Kerja bagus hari ini."),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".xp-mini")).toHaveText("20 XP");
  await expect(page.getByLabel("Sesuaikan ritmemu")).toHaveValue("20");
  await expect(page.locator(".continue-copy h2")).toHaveText("Present perfect");
  expect(errors).toEqual([]);
});
test("all grammar topics open, including validated local fallback", async ({
  page,
}) => {
  await home(page);
  const names = [
    "Articles",
    "Present perfect",
    "Passive voice",
    "Conditionals",
    "Relative clauses",
    "Modal verbs",
    "Reported speech",
    "Gerunds & infinitives",
  ];
  for (const name of names) {
    await page.locator(".lesson-row").filter({ hasText: name }).click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator(".practice-quiz fieldset").first()).toBeVisible();
    for (const details of await page.locator("details").all()) {
      await details.locator("summary").click();
      await expect(details).toHaveAttribute("open", "");
    }
    await page
      .getByRole("button", { name: "Jalur belajar", exact: true })
      .last()
      .click();
  }
});
test("vocabulary decks, flashcards and recall actions work", async ({
  page,
}) => {
  await home(page);
  await navigate(page, "Vocabulary");
  for (const name of [
    "Academic English",
    "Everyday English",
    "At work",
    "Our environment",
    "Technology",
    "Society",
    "B2 Core",
    "C1 Advanced",
  ]) {
    await page
      .locator(".deck-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) })
      .click();
    await expect(page.locator(".word-front h2")).toBeVisible();
    await page.getByRole("button", { name: "Tampilkan makna" }).click();
    await expect(page.locator(".definition")).not.toBeEmpty();
    if (name === "Academic English") {
      await page.getByRole("button", { name: "Sudah paham" }).click();
      await expect(page.locator(".xp-mini")).toHaveText("5 XP");
      await page.getByRole("button", { name: "Sebelumnya" }).click();
      await page.getByRole("button", { name: "Tampilkan makna" }).click();
      await expect(
        page.getByRole("button", { name: "Sudah direview" }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "Lewati" }).click();
    }
    await page.getByRole("button", { name: "Semua deck" }).click();
  }
  await page.goto("/flashcards");
  await expect(
    page.getByRole("heading", { name: "Make every word count." }),
  ).toBeVisible();
});
test("reading supports matching, short answers, filters and completion", async ({
  page,
}) => {
  await home(page);
  await navigate(page, "Reading");
  await expect(page.locator(".reading-item")).toHaveCount(2);
  await page.getByLabel("Level bacaan").selectOption("beginner");
  await expect(page.locator(".reading-item")).toHaveCount(1);
  await page.locator(".reading-item").first().click();
  await expect(page.locator(".practice-quiz fieldset")).toHaveCount(5);
  await answerQuiz(page);
  await page.getByRole("button", { name: "Selesai belajar" }).click();
  await page.getByLabel("Level bacaan").selectOption("all");
  await page.locator(".reading-item").first().click();
  await expect(page.locator(".practice-quiz fieldset")).toHaveCount(7);
  await page.locator("details summary").click();
  await answerQuiz(page);
  await expect(page.locator(".xp-mini")).toHaveText("50 XP");
});
test("placement progresses by question, reviews results and returns to learning", async ({
  page,
}) => {
  await page.goto("/pretest");
  const answers = [1, 1, 2, 1, 0, 1, 1, 0];
  for (let i = 0; i < answers.length; i++) {
    await page.locator(".answer-option").nth(answers[i]).click();
    await page
      .getByRole("button", {
        name: i === 7 ? "Lihat hasil" : "Berikutnya",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".result-score")).toContainText("8");
  await page.getByRole("button", { name: "Review jawaban" }).click();
  await expect(page.locator(".answer-explanation")).toBeVisible();
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await page.getByRole("button", { name: "Sebelumnya" }).click();
  await page.getByRole("link", { name: "Ruang belajar" }).click();
  await expect(
    page.getByRole("heading", { name: "Your next chapter." }),
  ).toBeVisible();
});
test("conversation and writing handle offline feedback honestly", async ({
  page,
}) => {
  await home(page);
  await navigate(page, "Conversation");
  await page
    .getByRole("button", { name: "Make your case", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Everyday life", exact: true })
    .click();
  await page.getByRole("button", { name: "At work", exact: true }).click();
  await page.route("**/api/chat", (route) => route.abort());
  await page
    .getByLabel("Pesan bahasa Inggris")
    .fill("I work with a small team. We plan our projects together.");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Pesanmu tetap",
  );
  await expect(page.locator(".xp-mini")).toHaveText("0 XP");
  await page.unroute("**/api/chat");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await expect(page.locator(".message.tutor")).toContainText("mode cadangan", {
    timeout: 25000,
  });
  await expect(page.locator(".xp-mini")).toHaveText("5 XP");
  await navigate(page, "Writing lab");
  await expect(
    page.getByRole("button", { name: "Review tulisan" }),
  ).toBeDisabled();
  await page
    .getByLabel("Your draft")
    .fill(
      "Cities should improve public transport because reliable buses help people travel to work. This can reduce traffic and give residents more time with their families.",
    );
  await page.getByRole("button", { name: "Review tulisan" }).click();
  await expect(page.locator(".writing-feedback")).toContainText(
    "bukan evaluasi personal",
    { timeout: 25000 },
  );
  await expect(page.locator(".rubric-scores")).toHaveCount(0);
  const saved = await page.evaluate(() =>
    localStorage.getItem("englishup.v2.progress"),
  );
  expect(saved).not.toContain("Cities should");
  expect(saved).not.toContain("I work with");
  await navigate(page, "Progres saya");
  await expect(page.locator(".activity-list li")).toHaveCount(2);
});
test("mobile menu supports keyboard, routes fit small screens and zoom-equivalent width", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await home(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 760) {
      const opener = page.getByRole("button", { name: "Buka navigasi" });
      await opener.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
      await opener.click();
      await navigate(page, "Vocabulary");
      await expect(
        page.getByRole("heading", { name: "Make every word count." }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator(".deck-card").first().click();
      await page.getByRole("button", { name: "Tampilkan makna" }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
test("WCAG AA checks pass for dashboard, practice, library and placement", async ({
  page,
}) => {
  await home(page);
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.html),
      })),
    ).toEqual([]);
  };
  await check();
  await page.getByRole("button", { name: "Mulai lesson", exact: true }).click();
  await expect(page.locator(".practice-quiz")).toBeVisible();
  await check();
  await navigate(page, "Vocabulary");
  await check();
  await navigate(page, "Reading");
  await expect(page.locator(".reading-item").first()).toBeVisible();
  await check();
  await page.goto("/pretest");
  await expect(page.locator(".placement-quiz")).toBeVisible();
  await check();
});
test("corrupt stored progress is preserved and browser storage denial is explained", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("englishup.v2.progress", "broken-json"),
  );
  await home(page);
  await expect(page.locator("main [role=alert]")).toContainText(
    "data lama tetap disimpan",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("englishup.v2.progress")),
  ).toBe("broken-json");
});
