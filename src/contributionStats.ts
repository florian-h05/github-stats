import { Octokit } from "@octokit/rest";
import { writeFileSync } from "fs";
import { fetchAllCommits, fetchAllRepos } from "./utils";

// mandatory arguments
const TOKEN = process.env.GITHUB_TOKEN ?? "";
let ORG: string = "";

// optional arguments
let SINCE: Date | undefined;
let UNTIL: Date | undefined;
let OUTFILE: string = "out/contributionStats.json";

// parse command line arguments
process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith("--org=")) {
    ORG = arg.replace("--org=", "");
  }
  if (arg.startsWith("--since=")) {
    SINCE = new Date(arg.replace("--since=", ""));
  }
  if (arg.startsWith("--until=")) {
    UNTIL = new Date(arg.replace("--until=", ""));
  }
  if (arg.startsWith("--out=")) {
    OUTFILE = arg.replace("--out=", "");
  }
});

// argument validation
if (!ORG || !TOKEN) {
  console.error(
    "Usage: npm run contributionStats -- --org=organization [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--out=filename.json]",
  );
  console.error(
    "Make sure to set the GITHUB_TOKEN in .env file or as an environment variable.",
  );
  process.exit(1);
}

const octokit = new Octokit({ auth: TOKEN });

interface RepoStats {
  name: string;
  contributors_count: number;
  top_contributors: string[];
  commit_count: number;
}

interface OrgStats {
  repositories: number;
  repos: RepoStats[];
  unique_contributors_count: number;
  total_commits_count: number;
}

async function main() {
  console.info(
    `Gathering stats for org: ${ORG} in time range: ${SINCE || "all time"} to ${UNTIL || "now"}`,
  );
  const repos = await fetchAllRepos(octokit, ORG);
  console.debug(
    `Repos for org ${ORG} (${repos.length}): ${repos.map((r) => r.name).join(", ")}`,
  );

  const orgStats: OrgStats = {
    repositories: repos.length,
    repos: [],
    unique_contributors_count: 0,
    total_commits_count: 0,
  };
  const orgUniqueContributors = new Set<string>();

  await Promise.all(
    repos.map(async (repo) => {
      // Commits, with optional time range
      const commits = await fetchAllCommits(
        octokit,
        ORG,
        repo.name,
        SINCE,
        UNTIL,
      );
      console.debug(`${repo.name}: ${commits.length} commits`);

      // Contributors of commits
      const uniqueContributors = new Set<string>();
      const commitsPerContributor = new Map<string, number>();

      function handleContributor(commiter: string | undefined) {
        if (!commiter) return;
        uniqueContributors.add(commiter);
        orgUniqueContributors.add(commiter);
        commitsPerContributor.set(
          commiter,
          (commitsPerContributor.get(commiter) ?? 0) + 1,
        );
      }

      commits.forEach((commit) =>
        handleContributor(commit.author?.login ?? commit.commit.author?.email),
      );
      const topContributors = Array.from(commitsPerContributor.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([contributor]) => contributor);
      console.debug(`${repo.name}: ${uniqueContributors.size} contributors`);

      orgStats.repos.push({
        name: repo.name,
        contributors_count: uniqueContributors.size,
        top_contributors: topContributors,
        commit_count: commits.length,
      });

      orgStats.total_commits_count += commits.length;
    }),
  );

  orgStats.unique_contributors_count = orgUniqueContributors.size;

  writeFileSync(OUTFILE, JSON.stringify(orgStats, null, 2), {
    encoding: "utf-8",
  });
  console.log(`\n===== Stats written to ${OUTFILE} =====`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
