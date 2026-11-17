import ghpages from "gh-pages";

const message = `Publish built site to GitHub Pages

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;

ghpages.publish("dist", { branch: "pages", message }, error => {
  if (error) {
    console.error("GitHub Pages deployment failed:", error);
    process.exitCode = 1;
    return;
  }

  console.log("Published dist/ to the pages branch.");
});
