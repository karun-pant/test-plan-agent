# Test Plan Generator

A Node.js package that uses Sourcegraph Cody AI to generate detailed test plans from JIRA tickets. 
Uses Cody as a test plan generator.
### Future:
- Add more llm capabilities.
- Make llm integration configurable.

## Installation

```bash
npm install test-plan-agent
```

## Requirements

- Node.js 14 or higher
- Cody CLI installed and configured
- JIRA account with API access

## Environment Variables

Create a `.env` file with the following variables:

```
SRC_ACCESS_TOKEN=your_sourcegraph_access_token
SRC_ENDPOINT=https://your-sourcegraph-instance.com
JIRA_BASE_URL=https://your-jira-instance.atlassian.net
JIRA_USER=your_jira_email@example.com
JIRA_API_TOKEN=your_jira_api_token
```

## Usage

```javascript
const { testPlanAgent } = require('test-plan-agent');

// Generate a test plan for a JIRA ticket
async function generateTestPlan() {
  const ticketNumber = 'PROJECT-123';
  
  // Basic usage - will save file to current directory
  const result = await testPlanAgent(ticketNumber);
  
  // Advanced usage with options
  const resultWithOptions = await testPlanAgent(ticketNumber, {
    saveToFile: true,
    outputPath: './test-plans'
  });
  
  console.log(result.testPlan);
}

generateTestPlan();
```

## API

### testPlanAgent(ticketNumber, options)

Generates a test plan for the specified JIRA ticket.

- `ticketNumber` (string): The JIRA ticket ID (e.g., "PROJECT-123")
- `options` (object, optional):
  - `saveToFile` (boolean): Whether to save the test plan to a file (default: true)
  - `outputPath` (string): The directory where to save the test plan file (default: current directory)

Returns: Promise that resolves to an object with `jiraDetails` and `testPlan` properties.

## License

MIT
