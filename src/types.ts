/**
 * Uniquely identifies a repository by its owner and name.
 */
export interface RepoId {
  owner: string;
  name: string;
}

/**
 * Represents a time range with a start and end date.
 */
export interface TimeRange {
  since: Date;
  until: Date;
}

/**
 * Represents GitHub pull request statistics for a specific repository.
 */
export interface PullRequestStats {
  repo: RepoId;
  tags: Record<string, number>;
  pr_count: number;
  milestone?: string;
}

/**
 * Represents GitHub commit and contributor statistics for a specific repository.
 */
export interface RepoStats {
  repo: RepoId;
  contributor_count: number;
  contributors: string[];
  top_contributors_by_commits: Record<string, number>;
  commit_count: number;
  time_range?: TimeRange;
}

/**
 * Represents GitHub organisation statistics, including repository as well as global commit and contributor statistics.
 */
export interface OrgStats {
  repository_count: number;
  repositories: RepoStats[];
  unique_contributor_count: number;
  total_commit_count: number;
  time_range?: TimeRange;
}

/**
 * Represents the available commands for the CLI tool.
 */
export const Commands = {
  CONTRIBUTION_STATS: "contribution_stats",
  PULL_REQUEST_STATS: "pull_request_stats",
};
