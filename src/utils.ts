import type { Octokit } from "@octokit/rest";

export async function fetchAllRepos(octokit: Octokit, owner: string) {
  const results = [];
  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    {
      org: owner,
      type: "public",
      per_page: 100,
    },
  )) {
    results.push(...data);
  }
  return results;
}

export async function fetchAllCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: Date,
  until?: Date,
) {
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
  return results;
}

export async function getAllPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all",
) {
  const results = [];
  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.pulls.list,
    {
      owner,
      repo,
      state,
      per_page: 100,
    },
  )) {
    results.push(...data);
  }
  return results;
}
