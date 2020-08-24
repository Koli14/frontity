#!/usr/bin/env node
/* eslint-disable */
// @ts-check

const waitOn = require("wait-on");
const execa = require("execa");
const cypress = require("cypress");
const argv = require("minimist")(process.argv.slice(2));

/**
 * @param {string} arg - The CLI argument
 * @param {Object} options
 * @param {string[]} options.possibleValues
 */
function validateArgs(arg, { possibleValues }) {
  if (!possibleValues.includes(arg)) {
    throw new Error(`${arg} is not one of "${possibleValues.join(" | ")}"`);
  }
}

let {
  wpVersion,
  target,
  browser,
  prod,
  cypress: cypressCommand,
  suite,
  publicPath,
} = argv;

// Sane defaults for local development.
wpVersion = wpVersion || "latest";
target = target || "both";
browser = browser || "chrome";
prod = prod || false;
cypressCommand = cypressCommand || "open";
suite = suite || "all";

// Validate CLI args.
validateArgs(target, { possibleValues: ["es5", "module", "both"] });
validateArgs(browser, { possibleValues: ["firefox", "chrome", "edge"] });
validateArgs(cypressCommand, { possibleValues: ["open", "run", "off"] });
validateArgs(suite, { possibleValues: ["wp", "e2e", "all"] });

// We have to make sure that we are runnng inside of the e2e directory The
// script assumes that files are relative to this location.
process.chdir(__dirname);

(async () => {
  try {
    if (suite === "all" || suite === "wp") {
      // Set the WordPress version as an environment variable to be consumed by
      // the docker-compose.yml file.
      process.env.WORDPRESS_VERSION = wpVersion;

      // Stop all the containers and remove all the volumes that they use (the
      // `-v` option).
      await execa("docker-compose", ["down", "-v"], {
        stdio: "inherit",
      });

      // Run all the services defined in docker-compose.yml: wp, wpcli & mysql
      // (in the background via the -d flag).
      await execa("docker-compose", ["up", "-d"], { stdio: "inherit" });

      // Wait until WordPress is responsive.
      await waitOn({
        resources: ["http-get://localhost:8080"],
        log: true,
      });

      // Give read and write permission to all files under /var/www/html in the
      // WordPress container This is fine because we are only using the
      // instances for testing.
      await execa(
        "docker-compose",
        ["run", "wp", "/bin/bash", "-c", "chmod -R 777 /var/www/html"],
        { stdio: "inherit" }
      );
    }

    // CD into the project directory.
    process.chdir("./project");

    if (prod) {
      let args = ["frontity", "build", "--target", target];

      // Only if publicPath was passed as a CLI argument, add it to the final
      // command.
      if (publicPath) {
        args = [...args, "--publicPath", publicPath];
      }

      // Build.
      await execa("npx", args, {
        stdio: "inherit",
      });

      // Serve.
      execa("npx", ["frontity", "serve", "--port", "3001"], {
        stdio: "inherit",
      });
    } else {
      // Dev.
      execa(
        "npx",
        ["frontity", "dev", "--port", "3001", "--dont-open-browser"],
        {
          stdio: "inherit",
        }
      );
    }

    // Wait for the frontity app to become available.
    await waitOn({ resources: ["http-get://localhost:3001"] });

    // CD back into the e2e directory.
    process.chdir("..");

    // Workaround for a bug in Cypress, otherwise it fails with:
    // electron: -max-http-header-size=1048576 is not allowed in NODE_OPTIONS.
    process.env.NODE_OPTIONS = "";

    // Run Cypress if the `cypressCommnand` is not "off".
    if (cypressCommand !== "off") {
      if (cypressCommand === "open") {
        await cypress.open({ env: { WORDPRESS_VERSION: wpVersion }, browser });
      } else if (cypressCommand === "run") {
        switch (suite) {
          case "all":
            await cypress.run({
              env: { WORDPRESS_VERSION: wpVersion },
              browser,
            });
            break;
          case "wp":
            await cypress.run({
              env: { WORDPRESS_VERSION: wpVersion },
              browser,
              spec: "./integration/wp-tests/*",
            });
            break;
          case "e2e":
            await cypress.run({
              env: { WORDPRESS_VERSION: wpVersion },
              browser,
              spec: "./integration/*.js",
            });
            break;
        }
      }
      // Exit the process once Cypress ends.
      process.exit(0);
    }
  } catch (err) {
    console.error(err);

    // We need to return the exit code so that the GitHub action returns a fail.
    process.exit(1);
  }
})();
