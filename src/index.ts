#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { setupCommand } from './commands/setup.js';
import { startCommand } from './commands/start.js';
import { pluginNewCommand } from './commands/plugin/new.js';
import { pluginListCommand } from './commands/plugin/list.js';
import { pluginInstallCommand } from './commands/plugin/install.js';
import { pluginRemoveCommand } from './commands/plugin/remove.js';
import { pluginDownloadCommand } from './commands/plugin/download.js';
import { getConfig } from './utils/config.js';

const program = new Command();

program
  .name('nessie')
  .description(chalk.cyan('🐉 Nessie — Python platform project manager'))
  .version('0.1.0');

// nessie setup <folder>
program
  .command('setup <folder>')
  .description('Initialize a new Nessie project in the specified folder')
  .action(async (folder: string) => {
    await setupCommand(folder);
  });

// nessie start [server]  — server is optional, TUI shown if omitted
program
  .command('start [server]')
  .description('Clone (if needed) and start a web server')
  .action(async (server?: string) => {
    await startCommand(server);
  });

// nessie new <plugin_name>
program
  .command('new <plugin_name>')
  .description('Scaffold a new plugin in the my_plugins folder')
  .action(async (pluginName: string) => {
    await pluginNewCommand(pluginName);
  });

// nessie list
program
  .command('list')
  .description('List all available and installed plugins')
  .action(async () => {
    await pluginListCommand();
  });

// nessie install <plugin_name>
program
  .command('install <plugin_name>')
  .description('Install a plugin from my_plugins or nessie_plugins')
  .action(async (pluginName: string) => {
    await pluginInstallCommand(pluginName);
  });

// nessie remove <plugin_name>
program
  .command('remove <plugin_name>')
  .description('Remove (uninstall) an installed plugin')
  .action(async (pluginName: string) => {
    await pluginRemoveCommand(pluginName);
  });

// nessie download <github_repo_url>
program
  .command('download <github_repo_url>')
  .description('Download a plugin from a GitHub URL into nessie_plugins or my_plugins')
  .action(async (repoUrl: string) => {
    await pluginDownloadCommand(repoUrl);
  });

// nessie help
program
  .command('help')
  .description('Show all available commands')
  .action(() => {
    const config = getConfig();

    console.log(chalk.bold.cyan('\n🐉 Nessie CLI — Available Commands\n'));

    const commands = [
      {
        cmd: 'nessie setup <folder>',
        desc: 'Initialize a new Nessie project in the specified folder',
      },
      {
        cmd: 'nessie start [server]',
        desc: 'Clone (if needed) and start a web server (TUI if no server given)',
      },
      {
        cmd: 'nessie new <plugin_name>',
        desc: 'Scaffold a new plugin in my_plugins with TUI type selection',
      },
      {
        cmd: 'nessie list',
        desc: 'List all available and installed plugins',
      },
      {
        cmd: 'nessie install <plugin_name>',
        desc: 'Install a plugin from my_plugins or nessie_plugins',
      },
      {
        cmd: 'nessie remove <plugin_name>',
        desc: 'Uninstall an installed plugin',
      },
      {
        cmd: 'nessie download <github_url>',
        desc: 'Download a plugin from GitHub into nessie_plugins or my_plugins',
      },
      {
        cmd: 'nessie help',
        desc: 'Show this help message',
      },
    ];

    const cmdWidth = Math.max(...commands.map((c) => c.cmd.length)) + 4;
    for (const { cmd, desc } of commands) {
      console.log(
        chalk.green(cmd.padEnd(cmdWidth)) + chalk.dim(desc),
      );
    }

    console.log(chalk.bold('\nAvailable servers:'));
    for (const s of config.servers) {
      console.log(`  ${chalk.yellow(s.name.padEnd(12))} ${chalk.dim(s.description)}`);
    }

    console.log(chalk.bold('\nAvailable plugin types:'));
    for (const pt of config.plugin_types) {
      console.log(`  ${chalk.yellow(pt.name.padEnd(12))} ${chalk.dim(pt.description)}`);
    }

    console.log();
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
