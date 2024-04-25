#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import shell from "shelljs";
import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";

const execAsync = promisify(exec);

async function createApp() {
  console.log(chalk.yellow("Welcome to the Modern App CLI!"));

  const { appName } = await inquirer.prompt({
    type: "input",
    name: "appName",
    message: "What is the name of your application?",
    default: "my-app",
  });

  const { framework } = await inquirer.prompt({
    type: "list",
    name: "framework",
    message: "Choose your framework:",
    choices: [
      "React with Vite (TypeScript)",
      "React with Vite",
      "Vue with Vite",
      "Svelte with Vite",
    ],
  });

  const fetchingOptions = ["Axios", "Fetch API"];
  const cssOptions = ["Tailwind CSS", "Bootstrap", "Sass"];
  let uiOptions = [];
  let installReactRouterDom = false;

  if (framework.includes("React")) {
    fetchingOptions.push("SWR", "React Query");
    uiOptions.push("Material UI", "Chakra UI", "Ant Design");

    const { confirmRouter } = await inquirer.prompt({
      type: "confirm",
      name: "confirmRouter",
      message: "Would you like to install React Router DOM?",
      default: false,
    });
    installReactRouterDom = confirmRouter;
  }

  const { fetchLibrary } = await inquirer.prompt({
    type: "list",
    name: "fetchLibrary",
    message: "Choose your fetching library:",
    choices: fetchingOptions,
  });

  const { cssFramework } = await inquirer.prompt({
    type: "list",
    name: "cssFramework",
    message: "Choose your CSS framework or preprocessor:",
    choices: cssOptions,
  });

  const { uiLibrary } = await inquirer.prompt({
    type: "list",
    name: "uiLibrary",
    message: "Choose a UI library to install:",
    choices: uiOptions,
  });

  const stateOptions = ["Redux", "Zustand", "MobX"];
  const { stateManagement } = await inquirer.prompt({
    type: "list",
    name: "stateManagement",
    message: "Choose your state management tool:",
    choices: stateOptions,
  });

  const { deployment } = await inquirer.prompt({
    type: "list",
    name: "deployment",
    message: "Choose your deployment platform:",
    choices: ["Vercel", "Netlify", "None"],
  });

  console.log(chalk.green("Creating your application..."));
  await generateApp(
    appName,
    framework,
    fetchLibrary,
    cssFramework,
    uiLibrary,
    stateManagement,
    deployment,
    installReactRouterDom
  );
  console.log(
    chalk.green("Application setup complete! Enjoy building your app!")
  );
}

async function generateApp(
  appName,
  framework,
  fetchLibrary,
  cssFramework,
  uiLibrary,
  stateManagement,
  deployment,
  installReactRouterDom
) {
  const templates = {
    "React with Vite (TypeScript)": `npx create-vite ${appName} --template react-ts`,
    "React with Vite": `npx create-vite ${appName} --template react`,
    "Vue with Vite": `npx create-vite ${appName} --template vue`,
    "Svelte with Vite": `npx create-vite ${appName} --template svelte`,
  };

  await runCommandWithSpinner(
    execAsync,
    templates[framework],
    "Setting up the project template"
  );

  shell.cd(appName);

  const installations = {
    [cssFramework]: true,
    [uiLibrary]: true,
    [stateManagement]: true,
    [fetchLibrary]: true,
    "React Router DOM": installReactRouterDom,
  };

  const packageCommands = {
    "Tailwind CSS":
      "npm install -D tailwindcss@latest postcss@latest autoprefixer@latest && npx tailwindcss init -p",
    Bootstrap: "npm install bootstrap",
    Sass: "npm install sass",
    "Material UI": "npm install @mui/material @emotion/react @emotion/styled",
    "Chakra UI":
      "npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion",
    "Ant Design": "npm install antd",
    Redux: "npm install @reduxjs/toolkit react-redux",
    Zustand: "npm install zustand",
    MobX: "npm install mobx mobx-react",
    Axios: "npm install axios",
    "Fetch API": "echo 'Fetch API is built-in, no need to install.'",
    SWR: "npm install swr",
    "React Query": "npm install react-query",
    "React Router DOM": "npm install react-router-dom@latest",
  };

  for (const key in installations) {
    if (installations[key]) {
      await runCommandWithSpinner(
        execAsync,
        packageCommands[key],
        `Installing ${key}`
      );
    }
  }

  if (deployment !== "None") {
    console.log(
      chalk.blue(
        `Remember to set up your project on ${deployment} after pushing your code!`
      )
    );
  }
}

async function runCommandWithSpinner(execFn, command, message) {
  const spinner = ora({ text: message, color: "yellow" }).start();
  try {
    await execFn(command);
    spinner.succeed(`${message} completed successfully.`);
  } catch (error) {
    spinner.fail(`${message} failed. Error: ${error.message}`);
    throw error;
  }
}

createApp();
