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
async function executeRconCommand(command: string, silent: boolean = true): Promise<string> {
  try {
    // Prepare the command
    let finalCommand = command;
    
    // If command doesn't start with / or /silent-command, add it
    if (!command.startsWith('/') && !command.startsWith('silent-command')) {
      // Add silent-command prefix if requested and not already present
      if (silent && !command.startsWith('silent-command')) {
        finalCommand = `/silent-command ${command}`;
      } else {
        finalCommand = `/${command}`;
      }
    }
    
    // Use rcon with explicit config file path
    console.error('Executing rcon command:', finalCommand);
    const { stdout } = await execAsync(`rcon -c ~/.config/rcon/rcon.yaml "${finalCommand}"`);
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
      // Use single quotes for the Lua string to avoid escaping issues
      // Use game.version instead of game.active_mods["base"] which may not be available
      const result = await executeRconCommand('/silent-command rcon.print(\'Version: \' .. game.version .. \', Tick: \' .. game.tick .. \', Players: \' .. #game.connected_players .. \', Surfaces: \' .. #game.surfaces)');
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
      // Get player count first
      const playerCount = await executeRconCommand('/silent-command rcon.print(#game.connected_players)');
      
      if (parseInt(playerCount) === 0) {
        return {
          content: [{ type: "text", text: "No players connected" }]
        };
      }
      
      // Get player names only, without any extra information
      // Use single quotes for the Lua string to avoid escaping issues
      const result = await executeRconCommand('/silent-command local names = \'\'; for _, p in pairs(game.connected_players) do names = names .. p.name .. \'\\n\' end; rcon.print(names)');
      
      // If no output, no players are connected
      if (!result || result.trim() === '') {
        return {
          content: [{ type: "text", text: "No players connected" }]
        };
      }
      
      // Process the results - each line is a player name
      const players = result.split('\n').filter(Boolean);
      
      if (players.length === 0) {
        return {
          content: [{ type: "text", text: "No players connected" }]
        };
      }
      
      // Format the output with the current time in the format YYYY-MM-DD HH:MM:SS
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      // Create a clean output with one player per line
      const output = players.map(player => 
        `${timeStr} [JOIN] ${player} joined the game`
      ).join('\n');
      
      return {
        content: [{ type: "text", text: output }]
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
      // Use single quotes for the Lua string to avoid escaping issues
      const result = await executeRconCommand('/silent-command rcon.print(\'Game time: \' .. math.floor(game.tick / (60 * 60 * 24)) .. \' days, \' .. math.floor(game.tick / (60 * 60)) % 24 .. \' hours, \' .. math.floor(game.tick / 60) % 60 .. \' minutes (Total ticks: \' .. game.tick .. \')\')');
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
        // Use select(2, pcall(...)) to only get the second return value from pcall
        const silentCmd = `/silent-command local success, result = pcall(function() return ${cleanCmd} end); rcon.print(result)`;
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
