/**
 * MCP client for Copilot integration.
 * Connects to MCP server (e.g. stdio) and can call tools like "convert_scenario_to_playwright".
 * If MCP_SERVER_COMMAND is not set or connection fails, conversion falls back to template in convert.ts.
 */

export interface ConvertResult {
  testCode: string;
  success: boolean;
  error?: string;
}

export async function convertScenarioViaMCP(scenarioContent: string): Promise<ConvertResult> {
  const command = process.env.MCP_SERVER_COMMAND;
  if (!command?.trim()) {
    return { testCode: '', success: false, error: 'MCP_SERVER_COMMAND not set' };
  }

  try {
    // Load MCP SDK at runtime only when needed (optional dep: npm install @modelcontextprotocol/sdk)
    const sdkModule = '@modelcontextprotocol/sdk';
    const sdk = await import(/* webpackIgnore: true */ sdkModule).catch(() => null);
    if (!sdk?.Client || !sdk?.StdioClientTransport) {
      return { testCode: '', success: false, error: 'MCP SDK not installed. Run: npm install @modelcontextprotocol/sdk' };
    }
    const { Client, StdioClientTransport } = sdk;
    const parts = command.trim().split(/\s+/);
    const transport = new StdioClientTransport({
      command: parts[0],
      args: parts.slice(1),
    });
    const client = new Client({ name: 'business-scenario-app', version: '1.0.0' });
    await client.connect(transport);

    const list = await client.listTools();
    const tools = list?.tools ?? [];
    const convertTool = tools.find(
      (t: { name?: string }) =>
        t.name && (
          t.name.toLowerCase().includes('convert') ||
          t.name.toLowerCase().includes('playwright') ||
          t.name.toLowerCase().includes('scenario')
        )
    );

    if (convertTool?.name) {
      const result = await client.callTool({
        name: convertTool.name,
        arguments: { scenario: scenarioContent },
      });
      const content = result.content?.[0];
      const text =
        content && typeof content === 'object' && 'type' in content && content.type === 'text'
          ? (content as { text: string }).text
          : JSON.stringify(result);
      await client.close();
      return { testCode: text, success: true };
    }

    await client.close();
    return { testCode: '', success: false, error: 'No convert/playwright tool on MCP server' };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { testCode: '', success: false, error: `MCP error: ${message}` };
  }
}
