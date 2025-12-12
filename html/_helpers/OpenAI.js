import axios from "axios";
import { getConfig } from "../configStore.js";

let openAIApiKey = getConfig('open_ai_api_key');

// Function to create a thread (Only once per user session)
async function createThread() {
  const url = "https://api.openai.com/v1/threads";
  const response = await sendRequest(url, {});
  return response?.id ?? null;
}

// Function to send user messages to a thread
async function sendMessageToThread(thread_id, message) {
  const url = `https://api.openai.com/v1/threads/${thread_id}/messages`;
  const data = {
    role: "user",
    content: message
  };
  return await sendRequest(url, data);
}

// Function to run the assistant on the thread
async function runAssistantOnThread(thread_id, assistant_id, custom_instruction = null) {
  const url = `https://api.openai.com/v1/threads/${thread_id}/runs`;
  const data = {
    assistant_id: assistant_id
  };

  if (custom_instruction) {
    data.instructions = custom_instruction;
  }

  const response = await sendRequest(url, data);
  return response?.id ?? null;
}

// Function to get the status of the run
async function getRunStatus(thread_id, run_id) {
  const url = `https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`;
  return await sendRequest(url, {}, 'GET');
}

// Function to get messages from a thread
async function getThreadMessages(thread_id) {
  const url = `https://api.openai.com/v1/threads/${thread_id}/messages`;
  const response = await sendRequest(url, {}, 'GET');
  return response?.data?.[0]?.content ?? null; // First message
}

// Generic Axios function for OpenAI API requests
async function sendRequest(url, data = {}, method = 'POST') {
  try {
    const headers = {
      "Content-type": "application/json",
      "Authorization": `Bearer ${openAIApiKey}`,
      "OpenAI-Beta": "assistants=v2"
    };

    const response = await axios({
      method: method.toLowerCase(),
      url: url,
      headers: headers,
      data: method === 'POST' ? data : undefined
    });

    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

// Function for chat completions
async function completions(fields) {
  try {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
      "Content-type": "application/json",
      "Authorization": `Bearer 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`
    };

    const response = await axios.post(url, fields, { headers });

    return response.data;
  } catch (e) {
    return { error: e.message };
  }
}

const open_ai = {
    createThread,
    sendMessageToThread,
    runAssistantOnThread,
    getRunStatus,
    getThreadMessages,
    completions,
};

export default open_ai;
