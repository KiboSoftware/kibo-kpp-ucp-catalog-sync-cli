#! /usr/bin/env node
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import ProfileInquirer from "../lib/profileinquirer.js";
import ProfileManager from "../lib/profilemanager.js";
import Authenticator from "../lib/authenticator.js";
import TenantManager from "../lib/tenantmanager.js";
import ExportManager from "../lib/exportmanager.js";
import ImportManager from "../lib/importmanager.js";

async function go() {
  /* first - parse the main command */
  const mainDefinitions = [
    {
      name: "command",
      defaultOption: true,
      defaultValue: "help",
    },
    { name: "file", alias: "f" },
  ];
  const options = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });

  switch (options.command) {
    case "import": {
      if (!options.file) {
        return showHelp();
      }
      return await importCommand(options.file);
    }
    case "export": {
      return await exportCommand();
    }
    default: {
      return showHelp();
    }
  }
  //onsole.log(mainOptions);
}

async function importCommand(file) {
  const authenticator = new Authenticator();
  const tenantManager = new TenantManager({ authenticator });
  const profileManager = new ProfileManager();
  const pi = new ProfileInquirer({ profileManager, tenantManager });
  const importManager = new ImportManager({ authenticator, tenantManager });
  var profile = await pi.askProfile();
  const importRes = await importManager.import(profile, file);
  await importManager.poll(profile, importRes.id);
}

async function exportCommand() {
  const authenticator = new Authenticator();
  const tenantManager = new TenantManager({ authenticator });
  const profileManager = new ProfileManager();
  const pi = new ProfileInquirer({ profileManager, tenantManager });
  const exportManager = new ExportManager({ authenticator, tenantManager });
  var profile = await pi.askProfile();
  const exportRes = await exportManager.export(profile);
  await exportManager.poll(profile, exportRes.id);
}

function showHelp() {
  const sections = [
    {
      header: "kibo-kpp-ucp-catalog-sync",
      content:
        "Helps with importing and exporting product catalogs for kibo/kpp integration",
    },
    {
      header: "Synopsis",
      content: "$ kibo-kpp-ucp-catalog-sync <options> <command>",
    },
    {
      header: "Command List",
      content: [
        { name: "help", summary: "Display help information" },
        { name: "import", summary: "Creates and polls for an import" },
        { name: "export", summary: "Print the version." },
      ],
    },
    {
      header: "Options",
      optionList: [
        {
          name: "file",
          description: "The input files to process.",
          type: String,
          multiple: false,
          alias: "f",
          defaultOption: false,
          typeLabel: "{underline file} ...",
        },
      ],
    },
  ];

  const usage = commandLineUsage(sections);
  console.log(usage);
}

go();
