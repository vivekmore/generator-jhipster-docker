const chalk = require('chalk');
const packagejs = require('../../package.json');
// const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const exec = require('child_process').exec;
const githubUrl = require('remote-origin-url');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    this.dockerDefault = true;
                }
            },

            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },

            displayLogo() {
                this.log('');
                this.log(`${chalk.cyan.bold('                                      ##        .')}`);
                this.log(`${chalk.cyan.bold('                                ## ## ##       ==')}`);
                this.log(`${chalk.cyan.bold('                             ## ## ## ##      ===')}`);
                this.log(`${chalk.cyan.bold('                         /""""""""""""""""\\___/ ===')}`);
                this.log(`${chalk.cyan.bold('                    ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~')}`);
                this.log(`${chalk.cyan.bold('                         \\______ o          __/')}`);
                this.log(`${chalk.cyan.bold('                           \\    \\        __/')}`);
                this.log(`${chalk.cyan.bold('                            \\____\\______/')}\n`);
                this.log(`${chalk.white.bold('                        http://www.jhipster.tech/')}`);
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster Docker')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },

            checkOracle() {
                if (this.jhipsterAppConfig.prodDatabaseType === 'oracle') {
                    this.env.error(`${chalk.red.bold('ERROR!')} Oracle isn't on the boat...`);
                }
            },

            checkDocker() {
                const done = this.async();
                exec('docker --version', (err) => {
                    if (err) {
                        this.log(`${chalk.yellow.bold('WARNING!')} You don't have Docker installed.`);
                        this.log('    Read http://docs.docker.com/engine/installation/#installation');
                    }
                    done();
                });
            },

            checkDockerCompose() {
                const done = this.async();
                exec('docker-compose --version', (err) => {
                    if (err) {
                        this.log(`${chalk.yellow.bold('WARNING!')} You don't have Docker Compose installed.`);
                        this.log('    Read https://docs.docker.com/compose/install/\n');
                    }
                    done();
                });
            },

            checkGithubUrl() {
                this.defaultGithubUrl = githubUrl.sync();
                if (!this.defaultGithubUrl) {
                    this.log(`${chalk.yellow.bold('WARNING!')} This project doesn't have a remote-origin GitHub.`);
                    this.log('  The option Automated build won\'t work correctly.\n');
                } else {
                    this.defaultGithubUrl = this.defaultGithubUrl.replace(/git@github.com:/g, 'https://github.com/');
                }
            }
        };
    }

    prompting() {
        const done = this.async();
        const choices = [];
        const defaultChoice = [];

        choices.push({
            name: `Dockerfile for Automated build at ${chalk.bold('https://hub.docker.com/')}`,
            value: 'automated:true'
        });
        choices.push({
            name: 'Local SMTP Server (https://github.com/djfarrelly/MailDev/)',
            value: 'maildev:true'
        });
        // choices.push({
        //     name: 'NGinx',
        //     value: 'nginx'
        // });

        const PROMPTS = {
            type: 'checkbox',
            name: 'dockerOptions',
            message: 'Which additionnal options would you like?',
            choices,
            default: defaultChoice
        };

        if (this.dockerDefault) {
            this.automated = true;
            done();
        } else {
            this.prompt(PROMPTS).then((prompt) => {
                this.dockerOptions = prompt.dockerOptions;
                this.automated = this.getOptionFromArray(this.dockerOptions, 'automated');
                this.maildev = this.getOptionFromArray(this.dockerOptions, 'maildev');
                done();
            });
        }
    }

    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        this.buildTool = this.jhipsterAppConfig.buildTool;
        this.serverPort = this.jhipsterAppConfig.serverPort ? this.jhipsterAppConfig.serverPort : '8080';
        this.cacheProvider = this.jhipsterAppConfig.cacheProvider;
        if (this.cacheProvider === undefined) {
            this.cacheProvider = this.jhipsterAppConfig.hibernateCache;
        }

        const dockerDir = jhipsterConstants.DOCKER_DIR;

        if (this.automated) {
            this.template('_Dockerfile', 'Dockerfile');
        }

        if (this.maildev) {
            this.template(`${dockerDir}_smtp.yml`, `${dockerDir}smtp.yml`);
        }
    }

    end() {
        this.log(`\n${chalk.bold.green('##### USAGE #####\n')}`);

        if (this.automated) {
            this.log('To param your project as Automated build:\n');

            this.log('Go to your GitHub project');
            this.log('- Go to Settings > Integrations & services');
            this.log('- Add service and select Docker');
            this.log('- Click [x] Active');
            this.log('- Click on update service');
            this.log(`- Back to Integration & services, Docker must be: ${chalk.bold.green('✓')} Docker\n`);

            this.log('Go to https://hub.docker.com/r/YOUR_DOCKER_ID');
            this.log('- menu Create: Create Automated Build');
            this.log('  - select the repository of your project');
            this.log('  - put a description, then click on create');
            this.log('- go to Build Settings');
            this.log('  - choose your branch or let master by default');
            this.log('  - click on Save Changes');
            this.log('- return to this project: git commit and push these changes!');
            this.log(`- go to Build details: it should be a new line with ${chalk.cyan.bold('Building\n')}`);
            this.log('');
        }

        if (this.maildev) {
            this.log('Start local smtp server:');
            this.log('- docker-compose -f src/main/docker/smtp.yml up');
            this.log('');
        }

        // if (this.tomcat) {
        //     this.log('');
        //     this.log('To generate an image, using Tomcat as based image:')
        //     if (this.buildTool === 'maven') {
        //         this.log(' - ./mvnw clean package -Pprod dockerfile:build\n');
        //     } else if (this.buildTool === 'gradle') {
        //         this.log(' - ./gradlew clean bootRepackage -Pprod buildDocker\n');
        //     }
        //     this.log('Once the container is launched:');
        //     this.log('- Admin Tomcat URL (with tomcat/JH!pst3r): http://localhost:8080/');
        //     this.log(`- Access URL: http://localhost:8080/${this.dockerBaseUrl}\n`);
        //     this.log('');
        // }

        // if (this.wildfly) {
        //     this.log('');
        //     this.log('To generate an image, using Wildfly as based image:')
        //     if (this.buildTool === 'maven') {
        //         this.log(' - ./mvnw clean package -Pprod dockerfile:build\n');
        //     } else if (this.buildTool === 'gradle') {
        //         this.log(' - ./gradlew clean bootRepackage -Pprod buildDocker\n');
        //     }
        //     this.log('Once the container is launched:');
        //     this.log('- Admin WildFly URL (with admin/JH!pst3r): http://localhost:9990/');
        //     this.log(`- Access URL: http://localhost:8080/${this.dockerBaseUrl}\n`);
        //     this.log('');
        // }
    }
};
