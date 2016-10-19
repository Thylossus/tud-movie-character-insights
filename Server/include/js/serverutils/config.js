const path = require('path');
const fs = require('fs');
const assign = require('lodash/assign');

(function () {
    'use strict';

    const ROOT_DIR_NAME = process.env.DEPLOYMENT_ENV === 'Server' ? 'wwwroot' : 'Server';
    const CONF_FILENAME = 'server.conf';
    const USER_CONF_FILENAME = 'server.user.conf';

    let configCache;

    ////////////////////////////////////////////////////////////////////////////
    ///
    /// Private
    ///
    ////////////////////////////////////////////////////////////////////////////
    /**
     * Read the configuration file and return a promise that is resolved as soon
     * as the file is read.
     * This method reads the file synchronously to allow for an simpler API.
     * @param  {string} confPath  Path to configuration file.
     * @return {object}           Configuration object
     */
    let readConfigurationFile = function readConfigurationFile(confPath) {
        let kvPattern = /([^=]+)=(.*)/;
        let windowsNewline = /\r\n/g;

        let file = fs.readFileSync(confPath).toString();
        // If the file was created with windows, replace windows line endings with \n
        file = file.replace(windowsNewline, '\n');
        let lines = file.split('\n');

        return lines.reduce((config, line) => {
            if (line.startsWith('#') || !line.trim()) {
                return config;
            }

            let match = kvPattern.exec(line);

            if (!match) {
                return config;
            }

            let key = match[1].trim();
            let value = match[2].trim();

            if (!value || !key) {
                return config;
            }

            config[key] = value;
            
            return config;
        }, {});
    };

    /**
     * Find server root directory itertively
     * 
     * @return {string} Absolute path to server root directory
     */
    let getServerRoot = function getServerRoot() {
        let dir = __dirname;
        let base = path.basename(dir);

        // Special case for unix paths
        const leading = dir.startsWith(path.sep) ? path.sep : '';

        while (base !== ROOT_DIR_NAME) {
            let split = dir.split(path.sep);
            split.pop();
            dir = path.join.apply(null, [leading].concat(split));
            base = path.basename(dir);
        }

        // Special for UNC paths
        dir = dir.startsWith(path.sep) && path.sep === '\\' ? path.sep + dir : dir;
        return dir;
    };

    /**
     * Recursively replace all variables in the configuration file.
     * If a variable has been replaced during a pass over the config,
     * the function is invoked recursively because this replacemet may
     * have replaced the value with a variable.
     * Unknown variables will not be replaced.
     * 
     * @param  {object} config Configuration object with variables
     * @return {object}        Configuration object without variables
     */
    let replaceVariables = function replaceVariables(config) {
        let pattern = /\$\{([a-zA-Z0-9\._]+)\}/g;
        let variableReplaced = false;

        config = Object.keys(config).reduce((config, key) => {
            let value = config[key];
            let matches = pattern.exec(value);

            while (matches) {
                let key = matches[1];

                if (config.hasOwnProperty(key)) {
                    value = value.replace(matches[0], config[key]);
                    variableReplaced = true;
                } else {
                    console.warn(`Configuration file uses a variable that is not defined: ${key}`);
                }

                matches = pattern.exec(value);
            }

            config[key] = value;

            return config;
        }, config);

        if (variableReplaced) {
            // Invoke a new pass over the config
            return replaceVariables(config);
        }

        return config;
    }

    //////////////////////////////////////////////////////////////////////////////
    ///
    /// API
    ///
    //////////////////////////////////////////////////////////////////////////////
    /**
     * Loads the configuration from the default and user configuration file.
     * The contents of the user configuration file overwrite those of the
     * default configuration file.
     *
     * If the configuration is already loaded, it is served from the cache.
     * @return {object} A configuration object
     */
    exports.getConfiguration = function functionName() {
        // Load configuration from cache if possible
        if (configCache) {
            console.log('using cache');
            
            return configCache;
        }

        // Determine paths
        let serverRoot = getServerRoot();
        let confPath = path.join(serverRoot, CONF_FILENAME);
        let userConfPath = path.join(serverRoot, USER_CONF_FILENAME);

        // Load configurations
        let config = readConfigurationFile(confPath);
        let userConfig = readConfigurationFile(userConfPath);
        
        // Override entries of config with user config
        config = assign(config, userConfig);

        // Replace placeholders
        config = replaceVariables(config);

        // Store configuration in cache and return config;
        configCache = config;

        return config;
    };

    /**
     * Get a property from the configuration. If the configuration has not been
     * loaded yet, it will be loaded.
     * @param  {string} propname Name of the property
     * @return {mixed}           Value
     */
    exports.getProperty = function getProperty(propname) {
        // Prefer loading configuration from cache
        let config = configCache || exports.getConfiguration();
        return config[propname];
    };

} ());
