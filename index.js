
// #!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import shell from "shelljs";
import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";
import fs from "fs";
import path from "path";
import ProgressBar from "progress";

const execAsync = promisify(exec);

async function createApp() {
  console.log(chalk.green("Welcome to the most modern CLI to headstart your project!"));
  console.log(chalk.green("Press Enter to continue"));
  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "",
  });

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
      "React (CRA)",
      "React with Vite (TypeScript)",
      "React with Vite (JavaScript)",
      "Svelte",
    ],
  });

  const cssOptions = ["Tailwind CSS", "Bootstrap", "Sass"];
  let uiOptions = [];
  let installReactRouterDom = false;

  if (framework.includes("React")) {
    uiOptions = ["Material UI", "Chakra UI", "Daisy UI", "Ant Design"];

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

    const { confirmRouter } = await inquirer.prompt({
      type: "confirm",
      name: "confirmRouter",
      message: "Would you like to install React Router DOM?",
      default: false,
    });
    installReactRouterDom = confirmRouter;

    const fetchingOptions = ["Axios", "Fetch API"];
    const { fetchLibrary } = await inquirer.prompt({
      type: "list",
      name: "fetchLibrary",
      message: "Choose your fetching library:",
      choices: fetchingOptions,
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
      cssFramework,
      uiLibrary,
      fetchLibrary,
      stateManagement,
      deployment,
      installReactRouterDom
    );
    console.log(chalk.green("Application setup complete! Enjoy building your app!"));
  }
}

async function setupTailwindCSS(appName) {
  shell.cd(appName);
  await runCommandWithSpinner(
    execAsync,
    "npm install -D tailwindcss@latest postcss@latest autoprefixer@latest",
    "Installing Tailwind CSS"
  );

  await runCommandWithSpinner(
    execAsync,
    "npx tailwindcss init -p",
    "Initializing Tailwind CSS"
  );

  const tailwindConfigPath = path.join(shell.pwd().toString(), 'tailwind.config.js');
  fs.appendFileSync(
    tailwindConfigPath,
    `
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,
    (err) => {
      if (err) throw err;
    }
  );

  const indexPath = path.join(shell.pwd().toString(), 'src/index.css');
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  if (fs.existsSync(indexPath)) {
    const existingCSS = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(
      indexPath,
      `
@tailwind base;
@tailwind components;
@tailwind utilities;
${existingCSS}
`,
      (err) => {
        if (err) throw err;
      }
    );
  } else {
    fs.writeFileSync(
      indexPath,
      `
@tailwind base;
@tailwind components;
@tailwind utilities;
`,
      (err) => {
        if (err) throw err;
      }
    );
  }

  shell.cd("..");
}

async function generateApp(
  appName,
  framework,
  cssFramework,
  uiLibrary,
  fetchLibrary,
  stateManagement,
  deployment,
  installReactRouterDom
) {
  const templates = {
    "React (CRA)": `npx create-react-app ${appName}`,
    "React with Vite (TypeScript)": `npx create-vite ${appName} --template react-ts`,
    "React with Vite (JavaScript)": `npx create-vite ${appName} --template react`,
    "Svelte": `npx create-vite ${appName} --template svelte`,
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
    "Tailwind CSS": setupTailwindCSS,
    Bootstrap: "npm install bootstrap",
    Sass: "npm install sass",
    "Material UI": "npm install @mui/material @emotion/react @emotion/styled",
    "Chakra UI": "npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion",
    "Daisy UI": "npm install daisyui",
    "Ant Design": "npm install antd",
    Redux: "npm install @reduxjs/toolkit react-redux",
    Zustand: "npm install zustand",
    MobX: "npm install mobx mobx-react",
    Axios: "npm install axios",
    "Fetch API": "echo 'Fetch API is built-in, no need to install.'",
    "React Router DOM": "npm install react-router-dom@latest",
  };

  const progressBar = new ProgressBar(':bar :percent :eta seconds remaining', {
    total: Object.keys(installations).length,
    width: 30,
  });

  for (const key in installations) {
    if (installations[key]) {
      if (typeof packageCommands[key] === "function") {
        await packageCommands[key](appName);
      } else {
        await runCommandWithSpinner(
          execAsync,
          packageCommands[key],
          `Installing ${key}`
        );
      }
      progressBar.tick();
    }
  }

  if (deployment !== "None") {
    console.log(
      chalk.blue(
        `Remember to set up your project on ${deployment} after pushing your code!`
      )
    );
  }

  shell.cd("..");
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
