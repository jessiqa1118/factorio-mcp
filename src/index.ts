#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get configuration from environment variables
const FACTORIO_SERVER_IP = process.env.FACTORIO_SERVER_IP || '127.0.0.1';
const FACTORIO_RCON_PORT = process.env.FACTORIO_RCON_PORT || '27015';
const FACTORIO_RCON_PASSWORD = process.env.FACTORIO_RCON_PASSWORD || '';

// Function to execute factorio-rcon command
async function executeRconCommand(command: string): Promise<string> {
  try {
    // Execute factorio-rcon command
    const { stdout } = await execAsync(
      `factorio-rcon --connect ${FACTORIO_SERVER_IP} --port ${FACTORIO_RCON_PORT} --password ${FACTORIO_RCON_PASSWORD} "${command}"`
    );
    return stdout.trim();
  } catch (error: unknown) {
    console.error('Error executing RCON command:', error);
    throw new Error(`Failed to execute RCON command: ${error}`);
  }
}

// Create MCP server
const server = new McpServer({
  name: "factorio-mcp-server",
  version: "0.1.0"
});

// Tool to get server status
server.tool(
  "get_server_status",
  {},
  async () => {
    try {
      // Execute /serverinfo command to get server information
      const result = await executeRconCommand('/serverinfo');
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error: unknown) {
      return {
        content: [{ type: "text", text: `Error occurred: ${error}` }],
        isError: true
      };
    }
  }
);

// Tool to get player list
server.tool(
  "list_players",
  {},
  async () => {
    try {
      // Execute /players online command to get online players
      const result = await executeRconCommand('/players online');
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error: unknown) {
      return {
        content: [{ type: "text", text: `Error occurred: ${error}` }],
        isError: true
      };
    }
  }
);

// Tool to get game time
server.tool(
  "get_game_time",
  {},
  async () => {
    try {
      // Execute /time command to get in-game time
      const result = await executeRconCommand('/time');
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error: unknown) {
      return {
        content: [{ type: "text", text: `Error occurred: ${error}` }],
        isError: true
      };
    }
  }
);

// Tool to execute arbitrary command
server.tool(
  "execute_command",
  { command: z.string().describe('Command to execute') },
  async ({ command }) => {
    try {
      const result = await executeRconCommand(command);
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error: unknown) {
      return {
        content: [{ type: "text", text: `Error occurred: ${error}` }],
        isError: true
      };
    }
  }
);

// Start the server
async function run() {
  try {
    const transport = new StdioServerTransport();
    console.error('Factorio MCP server starting...');
    await server.connect(transport);
    console.error('Factorio MCP server running on stdio');
  } catch (error: unknown) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

run().catch(console.error);
