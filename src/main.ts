import { Commands } from "./types";
import {
  getOrganizationStats,
  getPullRequestStats,
  getRepoContributionStats,
  writeToFile,
} from "./utils";
import { Octokit } from "@octokit/rest";

const githubToken = process.env.GITHUB_TOKEN ?? "";
if (!githubToken) {
  console.error(
    "GITHUB_TOKEN is not set. Please set it in your environment or .env file.",
  );
  process.exit(1);
}

// mandatory arguments
const command = process.argv[2];
let owner = "";

// optional arguments
let repo: string | undefined;
let since: Date | undefined;
let until: Date | undefined;
let milestone: string | undefined;
let outFile: string = `out/${command}.json`;

// parse command line arguments
process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith("--owner=")) {
    owner = arg.replace("--owner=", "");
  }
  if (arg.startsWith("--repo=")) {
    repo = arg.replace("--repo=", "");
  }
  if (arg.startsWith("--since=")) {
    since = new Date(arg.replace("--since=", ""));
  }
  if (arg.startsWith("--until=")) {
    until = new Date(arg.replace("--until=", ""));
  }
  if (arg.startsWith("--milestone=")) {
    milestone = arg.replace("--milestone=", "");
  }
  if (arg.startsWith("--out=")) {
    outFile = arg.replace("--out=", "");
  }
});

const helpMessage = `Usage: npm run main -- <command> -- --owner=owner [--repo=repository] [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--milestone=milestone] [--out=filename.json]
Available commands: ${Commands.CONTRIBUTION_STATS}, ${Commands.PULL_REQUEST_STATS}`;

// validate mandatory arguments
if (
  !command ||
  ![Commands.CONTRIBUTION_STATS, Commands.PULL_REQUEST_STATS].includes(
    command,
  ) ||
  !owner
) {
  console.error("Invalid command or missing owner.");
  console.info(helpMessage);
  process.exit(1);
}

const octokit = new Octokit({ auth: githubToken });

async function main() {
  switch (command) {
    case Commands.CONTRIBUTION_STATS:
      if (!repo) {
        writeToFile(
          await getOrganizationStats(octokit, owner, since, until),
          outFile,
        );
      } else {
        writeToFile(
          await getRepoContributionStats(
            octokit,
            { owner, name: repo },
            since,
            until,
          ),
          outFile,
        );
      }
      break;
    case Commands.PULL_REQUEST_STATS:
      if (!repo) {
        console.error(
          `Repository name is required for ${Commands.PULL_REQUEST_STATS}.`,
        );
        process.exit(1);
      }
      writeToFile(
        await getPullRequestStats(octokit, { owner, name: repo }, milestone),
        outFile,
      );
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.info(helpMessage);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Failed to start main", error);
  process.exit(1);
});
