async function parseSpec(spec) {
  return {
    featureName: 'Generated Feature',
    tasks: [
      {
        id: 'task_1',
        type: 'code',
        description: spec,
        targetFile: 'src/generated/feature.js'
      }
    ]
  };
}

async function generatePRDescription(summary) {
  return {
    title: 'feat: generated feature',
    body: summary
  };
}

module.exports = {
  parseSpec,
  generatePRDescription
};