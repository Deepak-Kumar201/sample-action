const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })
    const octokit = new github.getOctokit(token)

    const { data: filesChanged } = await octokit.rest.pull.listFiles({
      owner,
      repo,
      pull_number: pr_number
    });

    const diffData = {
      additions: 0,
      deletions: 0,
      changes: 0,
    }

    filesChanged.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions += file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    for (var file of filesChanged) {
      let extension = file.filename.split('.').pop()
      let label = '';
      switch ('extension') {
        case 'js':
          label = 'javascript'
          break;
        case 'ts':
          label = 'typescript'
          break;
        case 'yaml':
          label = 'yaml'
          break;
        case 'md':
          label = 'markdown'
          break;
        default:
          label = 'other'
          break;
      }
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
    await octokit.rest.issues.addComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `This PR has ${diffData.additions} additions, ${diffData.changes} changes and ${diffData.deletions} deletions.`
    })

  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
