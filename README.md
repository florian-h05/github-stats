# github-stats

This repo hosts a collection of scripts to generate statistics from GitHub organisations and repositories.
It uses the GitHub's [Octokit](https://github.com/octokit/octokit.js) SDK to fetch the data and outputs it in JSON format.

## Pre-Requisites

Before using the scripts, you need to set up your environment:

```shell
nvm use # Use the Node.js version specified in .nvmrc
npm install # Install the dependencies
npm run compile # Compile the TypeScript code to JavaScript
```

If you want to generate statistics for larger GitHub organisations, you need to authenticate yourself against the GitHub API for higher rate limits.
To do so, you need to create a GitHub personal access token:

- Go to your GitHub account settings, navigate to _Developer settings_ > _Personal access tokens_.
- Choose _Fine-grained tokens_.
- You need no other permission than read-only access to the repositories you want to analyze.

Put it into a `.env` file in the root of the repository:

```dotenv
GITHUB_TOKEN=your_github_personal_access_token
```

## Usage

```text
Usage: npm run main -- <command> -- --owner=owner [--repo=repository] [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--milestone=milestone] [--out=filename.json]
Available commands: contribution_stats, pull_request_stats
```

Every command outputs a JSON file with the statistics.
Use the `--out` option to specify the output file name. If not specified, the output will be printed to the `out` directory with the name of the command as the file name.

### `contribution_stats`

This command generates statistics about commits and contributors to a repository or an organisation.
When specifying the `--repo` option, it will analyse the specified repository only, otherwise it will analyse all repositories of the specified organisation.

You may use the `--since` and `--until` options to limit the time range of the analysis.

### `pull_request_stats`

This command generates statistics about merged pull requests in a repository.
It requires the `--repo` option (in addition to the `--owner` option that is always required) to specify the repository to analyse.

You may use the `--milestone` option to filter pull requests by a specific milestone.
