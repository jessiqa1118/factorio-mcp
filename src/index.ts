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

// Function to execute rcon command
async function executeRconCommand(command: string): Promise<string> {
  try {
    // Execute rcon command
    // Remove leading slash from command if present
    const cleanCommand = command.startsWith('/') ? command.substring(1) : command;
    
    // Use rcon with explicit config file path
    // Note: ~ expands to the home directory of the current user
    console.error('Executing rcon command:', cleanCommand);
    const { stdout } = await execAsync(`rcon -c ~/.config/rcon/rcon.yaml "${cleanCommand}"`);
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
      // Execute silent command to get server information without in-game notification
      const result = await executeRconCommand('/silent-command rcon.print("Version: " .. game.active_mods["base"] .. ", Tick: " .. game.tick .. ", Players: " .. #game.connected_players .. ", Surfaces: " .. #game.surfaces)');
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
      // Execute silent command to get player list without in-game notification
      const result = await executeRconCommand('/silent-command for _, p in pairs(game.connected_players) do rcon.print(p.name) end');
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
      // Execute silent command to get game time without in-game notification
      const result = await executeRconCommand('/silent-command rcon.print("Game time: " .. math.floor(game.tick / (60 * 60 * 24)) .. " days, " .. math.floor(game.tick / (60 * 60)) % 24 .. " hours, " .. math.floor(game.tick / 60) % 60 .. " minutes (Total ticks: " .. game.tick .. ")")');
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
  { 
    command: z.string().describe('Command to execute'),
    silent: z.boolean().default(true).describe('Whether to use silent-command (no in-game notification)')
  },
  async ({ command, silent }) => {
    try {
      // If command already starts with /silent-command, use it as is
      if (command.startsWith('/silent-command') || !silent) {
        const result = await executeRconCommand(command);
        return {
          content: [{ type: "text", text: result }]
        };
      } else {
        // Wrap command in silent-command if it's not already and silent is true
        // If command starts with /, remove it before wrapping
        const cleanCmd = command.startsWith('/') ? command.substring(1) : command;
        // For simple commands, just prepend silent-command
        // For complex commands that need to return data, wrap in rcon.print
        const silentCmd = `/silent-command rcon.print(pcall(function() ${cleanCmd} end))`;
        const result = await executeRconCommand(silentCmd);
        return {
          content: [{ type: "text", text: result }]
        };
      }
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
