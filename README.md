# github-stats

This repo hosts a collection of scripts to generate statistics from GitHub organisations and repositories.
It uses the GitHub's [Octokit](https://github.com/octokit/octokit.js) SDK to fetch the data and outputs it in JSON format.

## Usage

Before using the scripts, you need to set up your environment:

```shell
nvm use # Use the Node.js version specified in .nvmrc
npm install # Install the dependencies
```

Next, you need to create a GitHub personal access token:

- Go to your GitHub account settings, navigate to _Developer settings_ > _Personal access tokens_.
- Choose _Fine-grained tokens_.
- You need no other permission than read-only access to the repositories you want to analyze.

Put it into a `.env` file in the root of the repository:

```dotenv
GITHUB_TOKEN=your_github_personal_access_token
```

## Commit & Contributor Counts

The [`contributionCounter.ts`](src/contributionCounter.ts) script counts the number of commits and contributors for each repository in a GitHub organisation.
It also provides these statistics for the organisation as a whole, only counting unique contributors across all repositories.

Contributions are counted across the main branch only.
Contributors are counted based on their GitHub usernames, with a fallback to the commit author's email if the username is not available.

```shell
npm run contributionCounter -- --org=organization [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--out=filename.json]
```
