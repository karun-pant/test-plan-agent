require('dotenv').config();
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('@actions/exec');

/**
 * Utility function to interact with Cody
 * @param {string} prompt - The prompt to send to Cody
 * @param {string[]} additionalArgs - Any additional arguments for the Cody command
 * @returns {Promise<string>} - The response from Cody or error message
 */
async function runCodyChat(prompt, additionalArgs = []) {
    let output = '';
    let errorOutput = '';
    
    try {
        const defaultArgs = [
            'chat',
            '--stdin',
            '--access-token', process.env.SRC_ACCESS_TOKEN,
            '--endpoint', process.env.SRC_ENDPOINT || 'https://priceline.sourcegraph.com',
            '--model', 'claude-3-5-sonnet-latest'
        ];
        
        const args = [...defaultArgs, ...additionalArgs];
        
        await exec('cody', args, {
            input: prompt,
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                },
                stderr: (data) => {
                    errorOutput += data.toString();
                }
            }
        });
        
        if (errorOutput) {
            console.error('Cody error:', errorOutput);
        }
        
        return output || 'No output generated';
    } catch (error) {
        console.error('Error running Cody chat:', error);
        return `Error: ${error.message}`;
    }
}

/**
 * Fetches Jira ticket details using the Jira API
 * @param {string} ticketNumber - The Jira ticket ID
 * @returns {Promise<Object|null>} - The Jira ticket details or null if error
 */
async function fetchJiraDetails(ticketNumber) {
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraAuth = Buffer.from(`${process.env.JIRA_USER}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    
    const url = `${jiraBaseUrl}/rest/api/2/issue/${ticketNumber}`;
    console.log(`Requesting Jira ticket from: ${url}`);
    
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${jiraAuth}`,
                Accept: 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching JIRA details:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Generates a test plan using Cody AI based on Jira ticket details
 * @param {Object} jiraDetails - The Jira ticket details
 * @returns {Promise<string|null>} - The generated test plan or null if error
 */
async function generateTestPlan(jiraDetails) {
    const prompt = `Given the following JIRA ticket details, 
    generate a detailed test plan in markdown format, including functional tests,
     integration tests, and edge cases:\n\n${JSON.stringify(jiraDetails, null, 2)}`;

    try {
        const testPlan = await runCodyChat(prompt);
        return testPlan;
    } catch (error) {
        console.error('Error generating test plan with Cody:', error);
        return null;
    }
}

/**
 * Main function to generate a test plan for a Jira ticket
 * @param {string} ticketNumber - The Jira ticket ID
 * @param {Object} options - Optional configuration
 * @param {boolean} options.saveToFile - Whether to save the test plan to a file (default: true)
 * @param {string} options.outputPath - The path where to save the test plan file (default: current directory)
 * @returns {Promise<Object|null>} - Object containing jiraDetails and testPlan, or null if error
 */
async function testPlanAgent(ticketNumber, options = {}) {
    const { saveToFile = true, outputPath = process.cwd() } = options;
    
    const jiraDetails = await fetchJiraDetails(ticketNumber);
    if (!jiraDetails) return null;

    const testPlan = await generateTestPlan(jiraDetails);
    
    // Save test plan to file if requested
    if (testPlan && saveToFile) {
        try {
            const fileName = path.join(outputPath, `testplan_${ticketNumber}.md`);
            await fs.writeFile(fileName, testPlan, 'utf8');
            console.log(`Test plan successfully saved to ${fileName}`);
        } catch (error) {
            console.error(`Error saving test plan to file: ${error.message}`);
        }
    }
    
    return { jiraDetails, testPlan };
}

module.exports = {
    testPlanAgent,
    runCodyChat,
};
