// Stub implementation to satisfy imports - GitHub functionality has been removed
export const getOctokit = async () => {
  return {
    auth: null,
    rest: {
      repos: {
        getBranch: (_params: any) => {
          throw new Error('GitHub functionality has been removed')
        },
      },
    },
  }
}

export const createPullRequest = async () => {
  throw new Error('GitHub functionality has been removed')
}

export const getPullRequestStatus = async () => {
  throw new Error('GitHub functionality has been removed')
}

export const parseGitHubUrl = () => {
  throw new Error('GitHub functionality has been removed')
}
