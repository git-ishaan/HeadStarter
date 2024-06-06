#!/usr/bin/env node

import inquirer from "inquirer";
import { execSync } from "child_process";
import fs from "fs";
import chalk from "chalk";
import os from "os";

async function loadOra() {
  const ora = await import("ora");
  return ora.default;
}

const welcomeNote = () => {
  console.log(chalk.green("\nWelcome to the most modern headstarter tool,"));
  console.log(chalk.green("Developed with ♡ by github.com/git-ishaan\n"));
};

const questions = [
  {
    type: "list",
    name: "projectType",
    message: "Is this a client or server project?",
    choices: ["Client", "Server"],
  },
];

const clientQuestions = [
  {
    type: "list",
    name: "reactType",
    message: "Which React app do you want?",
    choices: ["CRA", "React with Vite TS", "React with Vite JS"],
  },
  {
    type: "list",
    name: "uiLibrary",
    message: "Which UI library do you want?",
    choices: ["MUI", "DaisyUI", "ChakraUI", "Bootstrap", "Nothing"],
  },
  {
    type: "confirm",
    name: "tailwind",
    message: "Do you want to use Tailwind CSS?",
  },
  {
    type: "list",
    name: "fetchingLibrary",
    message: "Which library do you want for fetching data?",
    choices: ["Fetch API", "Axios"],
  },
  {
    type: "list",
    name: "stateManagement",
    message: "Which state management library do you want?",
    choices: ["MobX", "Redux", "Zustand", "Nothing"],
  },
  {
    type: "list",
    name: "routingLibrary",
    message: "Which routing/query library do you want?",
    choices: ["React Router DOM", "TanStack Query"],
  },
  {
    type: "input",
    name: "appName",
    message: "What is the name of your app?",
  },
];

const serverQuestions = [
  {
    type: "list",
    name: "serverType",
    message: "Which server framework do you want?",
    choices: ["Express", "FastAPI"],
  },
  {
    type: "input",
    name: "appName",
    message: "What is the name of your app?",
  },
];

async function executeCommand(command, spinner, task) {
  spinner.start(`Executing: ${task}`);
  try {
    execSync(command, { stdio: "inherit", shell: true });
    spinner.succeed(`${task} completed`);
  } catch (error) {
    spinner.fail(`Error executing command: ${command}`);
    process.exit(1);
  }
}

async function createClientProject(answers) {
  const {
    reactType,
    uiLibrary,
    tailwind,
    fetchingLibrary,
    stateManagement,
    routingLibrary,
    appName,
  } = answers;
  const ora = await loadOra();
  const spinner = ora();

  let completedTasks = 0;
  const totalTasks =
    6 +
    (uiLibrary !== "Nothing" ? 1 : 0) +
    (tailwind ? 3 : 0) +
    (fetchingLibrary !== "Fetch API" ? 1 : 0) +
    (stateManagement !== "Nothing" ? 1 : 0);

  // Create project directory and initialize React app
  fs.mkdirSync(appName);
  process.chdir(appName);

  if (reactType === "CRA") {
    await executeCommand(
      `npx create-react-app ${appName}`,
      spinner,
      "Creating React app with CRA"
    );
  } else if (reactType === "React with Vite TS") {
    await executeCommand(
      `npm create vite@latest ${appName} -- --template react-ts`,
      spinner,
      "Creating React app with Vite TS"
    );
  } else if (reactType === "React with Vite JS") {
    await executeCommand(
      `npm create vite@latest ${appName} -- --template react`,
      spinner,
      "Creating React app with Vite JS"
    );
  }

  process.chdir(appName);
  await executeCommand(`npm install`, spinner, "Installing dependencies");
  completedTasks++;

  // Install UI library
  if (uiLibrary !== "Nothing") {
    if (uiLibrary === "MUI") {
      await executeCommand(
        "npm install @mui/material @mui/styled-engine-sc styled-components",
        spinner,
        "Installing MUI"
      );
    } else if (uiLibrary === "ChakraUI") {
      await executeCommand(
        "npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion",
        spinner,
        "Installing Chakra UI"
      );
    } else if (uiLibrary === "DaisyUI") {
      await executeCommand(
        "npm install -D daisyui@latest",
        spinner,
        "Installing DaisyUI"
      );
      // Modify tailwind.config.js to include DaisyUI plugin
      const tailwindConfigPath = "tailwind.config.js";
      let tailwindConfigContent = fs.readFileSync(tailwindConfigPath, "utf8");
      tailwindConfigContent = tailwindConfigContent.replace(
        "plugins: [],",
        "plugins: [require('daisyui')],"
      );
      fs.writeFileSync(tailwindConfigPath, tailwindConfigContent);
    } else {
      await executeCommand(
        `npm install ${uiLibrary.toLowerCase()}`,
        spinner,
        `Installing ${uiLibrary}`
      );
    }
    completedTasks++;
  }

  // Install and configure Tailwind CSS
  if (tailwind) {
    await executeCommand(
      "npm install -D tailwindcss postcss autoprefixer",
      spinner,
      "Installing Tailwind CSS"
    );
    await executeCommand(
      "npx tailwindcss init -p",
      spinner,
      "Initializing Tailwind CSS"
    );
    const indexCssPath = "src/index.css";
    const tailwindImports =
      "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";
    const currentCssContent = fs.readFileSync(indexCssPath, "utf8");
    fs.writeFileSync(indexCssPath, tailwindImports + currentCssContent);
    fs.writeFileSync(
      "tailwind.config.js",
      `
      module.exports = {
        content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
        theme: {
          extend: {},
        },
        plugins: [],
      };
    `
    );
    fs.writeFileSync(
      "postcss.config.cjs",
      `
      module.exports = {
        plugins: {
          tailwindcss: {},
          autoprefixer: {},
        },
      };
    `
    );
    completedTasks += 3;
  }

  // Install fetching library
  if (fetchingLibrary === "Axios") {
    await executeCommand("npm install axios", spinner, "Installing Axios");
    completedTasks++;
  }

  // Install state management library
  if (stateManagement !== "Nothing") {
    await executeCommand(
      `npm install ${stateManagement.toLowerCase()}`,
      spinner,
      `Installing ${stateManagement}`
    );
    completedTasks++;
  }

  // Install routing/query library
  if (routingLibrary === "React Router DOM") {
    await executeCommand(
      "npm install react-router-dom",
      spinner,
      "Installing React Router DOM"
    );
  } else if (routingLibrary === "TanStack Query") {
    await executeCommand(
      "npm install @tanstack/react-query",
      spinner,
      "Installing TanStack Query"
    );
  }

  console.log(chalk.green(`\n${appName} client project setup completed!\n`));
  console.log(chalk.blue(`Tasks completed: ${completedTasks} / ${totalTasks}`));
}

async function createServerProject(answers) {
  const { serverType, appName } = answers;
  const ora = await loadOra();
  const spinner = ora();

  let completedTasks = 0;
  const totalTasks = 1;

  // Create project directory and initialize server project
  fs.mkdirSync(appName);
  process.chdir(appName);

  if (serverType === "Express") {
    await executeCommand("npm init -y", spinner, "Initializing npm project");
    await executeCommand(
      "npm install express dotenv jsonwebtoken cors",
      spinner,
      "Installing Express and dependencies"
    );

    // Create standard folder structure
    fs.mkdirSync("models");
    fs.mkdirSync("controllers");
    fs.mkdirSync("config");
    fs.mkdirSync("routes");
    fs.mkdirSync("utils");

    fs.writeFileSync(
      "config/default.json",
      `
    {
      "port": 3000
    }
    `
    );

    fs.writeFileSync(
      "index.js",
      `
      const express = require('express');
      const cors = require('cors');
      const dotenv = require('dotenv');
      const jwt = require('jsonwebtoken');

      dotenv.config();

      const app = express();
      app.use(cors());
      app.use(express.json());

      app.get('/', (req, res) => {
        res.send('Hello World!');
      });

      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(\`Server is running on port \${PORT}\`);
      });
    `
    );

    completedTasks++;
  } else if (serverType === "FastAPI") {
    await executeCommand(
      "python -m venv env",
      spinner,
      "Creating virtual environment"
    );

    // Use correct command to activate virtual environment based on the OS
    const activateCommand =
      os.platform() === "win32"
        ? ".\\env\\Scripts\\activate && "
        : "source env/bin/activate && ";

    await executeCommand(
      `${activateCommand}pip install fastapi uvicorn python-dotenv`,
      spinner,
      "Installing FastAPI and dependencies"
    );

    // Create standard folder structure
    fs.mkdirSync("models");
    fs.mkdirSync("controllers");
    fs.mkdirSync("config");
    fs.mkdirSync("routes");
    fs.mkdirSync("utils");

    fs.writeFileSync(
      "main.py",
      `
      from fastapi import FastAPI
      from fastapi.middleware.cors import CORSMiddleware
      from dotenv import load_dotenv
      import os

      load_dotenv()

      app = FastAPI()

      origins = ["*"]

      app.add_middleware(
          CORSMiddleware,
          allow_origins=origins,
          allow_credentials=True,
          allow_methods=["*"],
          allow_headers=["*"],
      )

      @app.get("/")
      def read_root():
          return {"Hello": "World"}

      if __name__ == "__main__":
          import uvicorn
          uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
    `
    );

    completedTasks++;
  }

  console.log(chalk.green(`\n${appName} server project setup completed!\n`));
  console.log(chalk.blue(`Tasks completed: ${completedTasks} / ${totalTasks}`));
}

async function main() {
  welcomeNote();

  const { projectType } = await inquirer.prompt(questions);

  if (projectType === "Client") {
    const answers = await inquirer.prompt(clientQuestions);
    createClientProject(answers);
  } else if (projectType === "Server") {
    const answers = await inquirer.prompt(serverQuestions);
    createServerProject(answers);
  }
}

main();
