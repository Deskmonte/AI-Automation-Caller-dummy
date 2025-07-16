const axios = require('axios');

/**
 * Trigger an outbound call using Vapi.ai
 * @param {Object} contact - The contact info (e.g., phone number, name)
 * @param {Object} config - The Vapi config (apiKey, agentId, etc.)
 * @returns {Promise<Object>} - The Vapi.ai API response
 */
async function triggerVapiCall(contact, config) {
  const { apiKey, agentId } = config;
  const url = 'https://api.vapi.ai/call';
  const payload = {
    assistant: { id: agentId },
    customer: { number: contact[0] }
    // Add other properties as required by your Vapi agent
  };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    return { error: error.response ? error.response.data : error.message };
  }
}

module.exports = { triggerVapiCall }; 