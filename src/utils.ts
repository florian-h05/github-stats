import { OrgStats, PullRequestStats, RepoId, RepoStats } from "./types";
import { fetchAllCommits, fetchAllPullRequests, fetchAllRepos } from "./api";
import { writeFileSync } from "fs";

export async function getRepoContributionStats(
  octokit: any,
  repo: RepoId,
  since?: Date,
  until?: Date,
): Promise<RepoStats> {
  const commits = await fetchAllCommits(
    octokit,
    repo.owner,
    repo.name,
    since,
    until,
  );
  console.debug(`${repo.name}: ${commits.length} commits`);

  const uniqueContributors = new Set<string>();
  const commitsPerContributor = new Map<string, number>();

  function handleContributor(commiter: string | undefined) {
    if (!commiter) return;
    uniqueContributors.add(commiter);
    commitsPerContributor.set(
      commiter,
      (commitsPerContributor.get(commiter) ?? 0) + 1,
    );
  }

  commits.forEach((commit) =>
    handleContributor(commit.author?.login ?? commit.commit.author?.email),
  );
  const topContributors = {} as Record<string, number>;
  Array.from(commitsPerContributor.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([contributor, commit]) => {
      topContributors[contributor] = commit;
    });
  console.debug(`${repo.name}: ${uniqueContributors.size} contributors`);

  const stats: RepoStats = {
    repo,
    contributor_count: uniqueContributors.size,
    contributors: Array.from(uniqueContributors),
    top_contributors_by_commits: topContributors,
    commit_count: commits.length,
  };

  if (since && until) {
    stats.time_range = {
      since: since,
      until: until,
    };
  }

  return stats;
}

export async function getPullRequestStats(
  octokit: any,
  repo: RepoId,
  milestone?: string,
): Promise<PullRequestStats> {
  const pullRequests = await fetchAllPullRequests(
    octokit,
    repo.owner,
    repo.name,
    "merged",
  );

  const stats: PullRequestStats = {
    repo,
    tags: {},
    pr_count: 0,
    milestone,
  };

  for (const pr of pullRequests) {
    if (milestone && pr.milestone?.title !== milestone) {
      continue;
    }

    stats.pr_count++;

    if (pr.labels.length > 0) {
      for (const label of pr.labels) {
        if (!stats.tags[label.name]) {
          stats.tags[label.name] = 0;
        }
        stats.tags[label.name]++;
      }
    }
  }

  return stats;
}

export async function getOrganizationStats(
  octokit: any,
  org: string,
  since?: Date,
  until?: Date,
): Promise<OrgStats> {
  const repos = await fetchAllRepos(octokit, org);

  const repoStatsPromises = repos.map((repo) =>
    getRepoContributionStats(
      octokit,
      { owner: org, name: repo.name },
      since,
      until,
    ),
  );

  const repoStats = await Promise.all(repoStatsPromises);
  const uniqueContributors = new Set<string>();
  let totalCommitCount = 0;

  repoStats.forEach((repoStat) => {
    repoStat.contributors.forEach((contributor) => {
      uniqueContributors.add(contributor);
    });
    totalCommitCount += repoStat.commit_count;
  });

  const orgStats: OrgStats = {
    repository_count: repos.length,
    repositories: repoStats,
    unique_contributor_count: uniqueContributors.size,
    total_commit_count: totalCommitCount,
  };
  if (since && until) {
    orgStats.time_range = {
      since: since,
      until: until,
    };
  }

  return orgStats;
}

/**
 * Writes the given data to a file in JSON format using JSON.stringify.
 * @param data The data to write to the file.
 * @param outFile The output file path where the data will be written.
 */
export function writeToFile(data: {}, outFile: string): void {
  writeFileSync(outFile, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
  });
  console.log(`\n===== Stats written to ${outFile} =====`);
}
