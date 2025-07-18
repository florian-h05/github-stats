import { Octokit } from "@octokit/rest";
import { writeFileSync } from "fs";
import { fetchAllPullRequests } from "./utils";

// mandatory arguments
const TOKEN = process.env.GITHUB_TOKEN ?? "";
let OWNER: string = "";
let REPO: string = "";

// optional arguments
let MILESTONE: string | undefined;
let OUTFILE: string = "out/pullRequestTagsCounter.json";

// parse command line arguments
process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith("--owner=")) {
    OWNER = arg.replace("--owner=", "");
  }
  if (arg.startsWith("--repo=")) {
    REPO = arg.replace("--repo=", "");
  }
  if (arg.startsWith("--milestone=")) {
    MILESTONE = arg.replace("--milestone=", "");
  }
  if (arg.startsWith("--out=")) {
    OUTFILE = arg.replace("--out=", "");
  }
});

// argument validation
if (!OWNER || !REPO || !TOKEN) {
  console.error(
    "Usage: npm run pullRequestTagsCounter -- --owner=owner --repo=repository [--milestone=milestone] [--out=filename.json]",
  );
  console.error(
    "Make sure to set the GITHUB_TOKEN in .env file or as an environment variable.",
  );
  process.exit(1);
}

const octokit = new Octokit({ auth: TOKEN });

interface PullRequestStats {
  tags: Record<string, number>;
  total: number;
}

async function main() {
  console.info(
    `Gathering pull request stats for org: ${OWNER}, repo: ${REPO}, milestone: ${MILESTONE ?? "all"}`,
  );

  const pullRequests = await fetchAllPullRequests(
    octokit,
    OWNER,
    REPO,
    "merged",
  );

  const stats: PullRequestStats = {
    tags: {},
    total: 0,
  };

  for (const pr of pullRequests) {
    if (MILESTONE && pr.milestone?.title !== MILESTONE) {
      continue;
    }

    stats.total++;

    if (pr.labels.length > 0) {
      for (const label of pr.labels) {
        if (!stats.tags[label.name]) {
          stats.tags[label.name] = 0;
        }
        stats.tags[label.name]++;
      }
    }
  }

  writeFileSync(OUTFILE, JSON.stringify(stats, null, 2), {
    encoding: "utf-8",
  });
  console.log(`\n===== Stats written to ${OUTFILE} =====`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
