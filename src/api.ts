import type { Octokit } from "@octokit/rest";

/**
 * Fetches all repositories for a given organisation.
 * @param octokit An instance of Octokit.
 * @param org The organisation's username.
 */
export async function fetchAllRepos(octokit: Octokit, org: string) {
  console.debug(`Fetching all repos for organisation ${org} ...`);
  console.time("fetchAllRepos");
  const results = [];
  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    {
      org: org,
      type: "public",
      per_page: 100,
    },
  )) {
    results.push(...data);
  }
  console.timeEnd("fetchAllRepos");
  console.debug(`Fetched all repos for organisation ${org}.`);
  return results;
}

/**
 * Fetches all commits for a given repository.
 * @param octokit An instance of Octokit.
 * @param owner The repository owner's username.
 * @param repo The repository name.
 * @param since Optional start date for commits.
 * @param until Optional end date for commits.
 */
export async function fetchAllCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: Date,
  until?: Date,
) {
  console.debug(`Fetching all commits for ${owner}/${repo} ...`);
  console.time("fetchAllCommits");
  const results = [];
  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.repos.listCommits,
    {
      owner,
      repo,
      since: since?.toISOString() ?? undefined,
      until: until?.toISOString() ?? undefined,
      per_page: 100,
    },
  )) {
    results.push(...data);
  }
  console.timeEnd("fetchAllCommmits");
  console.debug(`Fetched all commits for ${owner}/${repo}.`);
  return results;
}

/**
 * Fetches all pull requests for a given repository.
 *
 * If the milestone argument is provided, the method will abort fetching older PRs as soon as at least 500 PRs without the milestone have been fetched.
 * This way it is avoided that all PRs have to be fetched if they should be filtered by milestone.
 *
 * @param octokit An instance of Octokit.
 * @param owner The repository owner's username.
 * @param repo The repository name.
 * @param state The state of the pull requests to fetch.
 * @param milestone The milestone to filter by.
 */
export async function fetchAllPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "merged" | "closed" | "all" = "all",
  milestone?: string,
) {
  console.debug(`Fetching all pull requests for ${owner}/${repo} ...`);
  console.time("fetchAllPullRequests");
  const results = [];
  let abortCountdown = 500;
  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.pulls.list,
    {
      owner,
      repo,
      state: state === "merged" ? "closed" : state,
      per_page: 100,
      sort: "updated",
      direction: "desc",
      milestone,
    },
  )) {
    for (const pr of data) {
      if (milestone && pr.milestone?.title !== milestone) {
        abortCountdown--;
        continue;
      }
      if (state === "merged" && pr.merged_at === null) continue;
      results.push(pr);
    }
    if (abortCountdown <= 0) break;
  }
  console.timeEnd("fetchAllPullRequests");
  console.debug(`Fetched all PRs for ${owner}/${repo}.`);
  return results;
}
