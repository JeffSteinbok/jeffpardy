// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

const isProduction = process.env.NODE_ENV == "production";

const config = {
    entry: {
        index: './src/web/pages/startPage/StartPage.tsx',
        host: './src/web/pages/hostPage/HostPage.tsx',
        hostSecondary: './src/web/pages/hostSecondaryPage/HostSecondaryPage.tsx',
        player: './src/web/pages/playerPage/PlayerPage.tsx',
        fromJeopardyLabs: './src/web/pages/fromJeopardyLabs/FromJeopardyLabs.tsx',
    },
    output: {
        path: path.resolve(__dirname, "./wwwroot/js/dist"),
        filename: '[name].js',
        publicPath: 'dist/',
        sourceMapFilename: "[name].js.map"
    },
    plugins: [
        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"],
            }

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.tsx']
    },
};

module.exports = () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
    }
    return config;
};
